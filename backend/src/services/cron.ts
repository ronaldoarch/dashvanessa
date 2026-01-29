import cron from 'node-cron';
import { otgAdapter } from './otgAdapter';
import SuperbetAdapter from './superbetAdapter';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Inicializar adapter Superbet
const superbetAdapter = new SuperbetAdapter({
  apiKey: process.env.SUPERBET_API_KEY || '',
  baseURL: process.env.SUPERBET_API_URL || 'https://api.superbet.com/v1',
});

/**
 * Sincronizar afiliados aprovados da Superbet
 * Verifica registros pendentes e cria afiliados quando aprovados
 */
export async function syncSuperbetAffiliates() {
  try {
    console.log('🔄 Verificando afiliados pendentes da Superbet...');
    
    // Buscar todos os registros pendentes
    const pendingInvites = await prisma.affiliateInvite.findMany({
      where: {
        status: 'PENDING',
        superbetRequestId: { not: null },
      },
      include: { affiliate: true },
    });

    console.log(`📋 Encontrados ${pendingInvites.length} registros pendentes`);

    for (const invite of pendingInvites) {
      if (!invite.superbetRequestId) continue;

      try {
        // Verificar status na API da Superbet
        const status = await superbetAdapter.checkRequestStatus(invite.superbetRequestId);
        
        console.log(`📊 Status do registro ${invite.id}: ${status.status}`);

        // Se foi aprovado e ainda não tem afiliado criado
        if (status.status === 'approved' && status.affiliateLink && !invite.affiliateId) {
          console.log(`✅ Criando afiliado para ${invite.email}...`);

          // Verificar se usuário já existe
          let user = await prisma.user.findUnique({
            where: { email: invite.email },
          });

          if (!user) {
            const bcrypt = await import('bcryptjs');
            const tempPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.default.hash(tempPassword, 10);

            user = await prisma.user.create({
              data: {
                email: invite.email,
                password: hashedPassword,
                name: invite.name,
                role: 'AFFILIATE',
              },
            });
          }

          // Criar afiliado com link espelhado da Superbet
          const affiliate = await prisma.affiliate.create({
            data: {
              name: invite.name,
              userId: user.id,
              superbetAffiliateLink: status.affiliateLink,
              superbetAffiliateId: status.affiliateId,
              siteIds: [],
            },
          });

          await prisma.user.update({
            where: { id: user.id },
            data: { affiliateId: affiliate.id },
          });

          await prisma.affiliateInvite.update({
            where: { id: invite.id },
            data: {
              affiliateId: affiliate.id,
              status: 'APPROVED',
            },
          });

          // Criar e associar deal automaticamente
          try {
            const invitesModule = await import('../routes/invites');
            if (invitesModule.createAndAssociateDefaultDeal) {
              await invitesModule.createAndAssociateDefaultDeal(affiliate.id, invite.name, status.affiliateId);
            }
          } catch (dealError: any) {
            console.error('Erro ao criar deal automático:', dealError.message);
          }

          console.log(`✅ Afiliado criado: ${affiliate.id}`);
        } else if (status.status === 'rejected') {
          await prisma.affiliateInvite.update({
            where: { id: invite.id },
            data: { status: 'REJECTED' },
          });
        }
      } catch (error: any) {
        console.error(`❌ Erro ao verificar registro ${invite.id}:`, error.message);
      }
    }

    console.log('✅ Verificação de afiliados pendentes concluída');
  } catch (error) {
    console.error('❌ Erro na sincronização de afiliados Superbet:', error);
  }
}

export function setupCronJobs() {
  // Sincronizar afiliados OTG a cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Iniciando sincronização de afiliados OTG...');
    try {
      await otgAdapter.syncAffiliates();
      console.log('✅ Sincronização de afiliados OTG concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização de afiliados OTG:', error);
    }
  });

  // Sincronizar resultados OTG a cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Iniciando sincronização de resultados OTG...');
    try {
      await otgAdapter.syncResults();
      console.log('✅ Sincronização de resultados OTG concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização de resultados OTG:', error);
    }
  });

  // Verificar afiliados pendentes da Superbet a cada 10 minutos
  cron.schedule('*/10 * * * *', async () => {
    await syncSuperbetAffiliates();
  });

  console.log('⏰ Cron jobs configurados:');
  console.log('   - Sincronização de afiliados OTG: a cada hora');
  console.log('   - Sincronização de resultados OTG: a cada 5 minutos');
  console.log('   - Verificação de afiliados Superbet: a cada 10 minutos');
}
