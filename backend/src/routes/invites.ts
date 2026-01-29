import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';
import SuperbetAdapter from '../services/superbetAdapter';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Inicializar adapter Superbet (configurar via env)
const superbetAdapter = new SuperbetAdapter({
  apiKey: process.env.SUPERBET_API_KEY || '',
  baseURL: process.env.SUPERBET_API_URL || 'https://api.superbet.com/v1',
});

/**
 * Gerar código único para convite
 */
function generateInviteCode(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

/**
 * Criar e associar deal automaticamente quando o link da Superbet é cadastrado
 * Busca o deal real da API da Superbet
 */
export async function createAndAssociateDefaultDeal(affiliateId: string, affiliateName: string, superbetAffiliateId?: string): Promise<void> {
  try {
    // Verificar se o afiliado já tem um deal associado
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: { dealId: true, superbetAffiliateId: true },
    });

    if (affiliate?.dealId) {
      console.log(`ℹ️  Afiliado ${affiliateId} já possui deal associado, pulando criação automática`);
      return;
    }

    let dealToAssociate = null;
    const affiliateIdToUse = superbetAffiliateId || affiliate?.superbetAffiliateId;

    // Tentar buscar deal real da API da Superbet
    if (affiliateIdToUse) {
      try {
        const superbetDealData = await superbetAdapter.getAffiliateDeal(affiliateIdToUse);
        
        if (superbetDealData) {
          // Extrair valores de forma flexível (espelha todos os dados da API)
          let cpaValue: number | undefined;
          let revSharePercentage: number | undefined;
          let dealName: string | undefined;
          let description: string | undefined;

          // Tentar diferentes estruturas de resposta
          if (superbetDealData.deal) {
            // Formato: { deal: { cpaValue, revSharePercentage, name, ... } }
            cpaValue = superbetDealData.deal.cpaValue;
            revSharePercentage = superbetDealData.deal.revSharePercentage;
            dealName = superbetDealData.deal.name;
            description = superbetDealData.deal.description || `Deal espelhado da API Superbet para ${affiliateName}`;
          } else {
            // Formato direto: { cpaValue, revSharePercentage, name, ... }
            cpaValue = superbetDealData.cpaValue;
            revSharePercentage = superbetDealData.revSharePercentage;
            dealName = superbetDealData.name || superbetDealData.dealName;
            description = superbetDealData.description || `Deal espelhado da API Superbet para ${affiliateName}`;
          }

          // Validar valores obrigatórios
          if (cpaValue !== undefined && revSharePercentage !== undefined) {
            // Preparar descrição com todos os dados espelhados da API
            const apiDataJson = JSON.stringify(superbetDealData, null, 2);
            const fullDescription = description 
              ? `${description}\n\n📊 Dados completos da API Superbet:\n\`\`\`json\n${apiDataJson}\n\`\`\``
              : `Deal espelhado automaticamente da API Superbet para ${affiliateName}.\n\n📊 Dados completos da API:\n\`\`\`json\n${apiDataJson}\n\`\`\``;

            // Criar deal espelhando todos os dados da API
            dealToAssociate = await prisma.deal.create({
              data: {
                name: dealName || `Deal ${affiliateName}`,
                cpaValue: cpaValue,
                revSharePercentage: revSharePercentage,
                description: fullDescription,
                active: true,
              },
            });
            console.log(`✅ Deal espelhado da Superbet criado para afiliado ${affiliateId}`);
            console.log(`📋 Dados completos recebidos da API:`, JSON.stringify(superbetDealData, null, 2));
          } else {
            console.log(`⚠️  Dados do deal da Superbet incompletos (faltam cpaValue ou revSharePercentage)`);
            console.log(`📋 Dados recebidos:`, JSON.stringify(superbetDealData, null, 2));
          }
        }
      } catch (superbetError: any) {
        console.log(`⚠️  Não foi possível obter deal da Superbet: ${superbetError.message}`);
        if (superbetError.response?.data) {
          console.log(`📋 Resposta de erro da API:`, JSON.stringify(superbetError.response.data, null, 2));
        }
      }
    }

    // Se não conseguiu buscar da Superbet, usar deal padrão ou criar um novo
    if (!dealToAssociate) {
      // Tentar usar o deal padrão criado quando o admin cadastrou o link
      dealToAssociate = await prisma.deal.findFirst({
        where: {
          name: 'Deal Padrão',
          active: true,
        },
      });

      // Se não existe deal padrão, criar um novo deal com valores padrão do sistema
      if (!dealToAssociate) {
        const { getSystemConfig } = await import('../services/config');
        
        // Obter valores padrão do sistema
        const defaultCpaValue = parseFloat(await getSystemConfig('CPA_VALUE', '300'));
        const defaultRevSharePercentage = parseFloat(await getSystemConfig('REVENUE_SHARE_PERCENTAGE', '25'));

        // Criar deal para o afiliado
        dealToAssociate = await prisma.deal.create({
          data: {
            name: `Deal ${affiliateName}`,
            cpaValue: defaultCpaValue,
            revSharePercentage: defaultRevSharePercentage,
            description: `Deal criado automaticamente para ${affiliateName}`,
            active: true,
          },
        });
      }
    }

    // Associar deal ao afiliado
    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: { dealId: dealToAssociate.id },
    });

    console.log(`✅ Deal associado automaticamente ao afiliado ${affiliateId} (${dealToAssociate.name})`);
  } catch (error: any) {
    console.error('Erro ao criar deal automático:', error);
    // Não lançar erro para não quebrar o fluxo principal
  }
}

/**
 * Criar novo convite (apenas admin)
 * Obtém link de cadastro da Superbet para enviar ao afiliado
 */
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { email, name, expiresInDays = 7 } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' });
    }

    // Verificar se já existe convite pendente para este email
    const existingInvite = await prisma.affiliateInvite.findFirst({
      where: {
        email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvite) {
      return res.status(400).json({
        error: 'Já existe um convite pendente para este email',
        invite: {
          id: existingInvite.id,
          code: existingInvite.code,
          expiresAt: existingInvite.expiresAt,
        },
      });
    }

    // Obter link da Superbet do admin (configurado pelo admin)
    const { getSystemConfig } = await import('../services/config');
    const adminSuperbetLink = await getSystemConfig('ADMIN_SUPERBET_LINK', '');

    if (!adminSuperbetLink) {
      return res.status(400).json({
        error: 'Link da Superbet do admin não configurado. Configure o link antes de criar convites.',
      });
    }

    // Usar o link do admin como link de cadastro
    const superbetRegistrationLink = adminSuperbetLink;
    const superbetRequestId: string | null = null; // Não precisamos mais do requestId da API

    // Criar convite
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite = await prisma.affiliateInvite.create({
      data: {
        code: generateInviteCode(),
        email,
        name,
        expiresAt,
        status: 'PENDING',
        superbetRequestId,
      },
    });

    res.status(201).json({
      id: invite.id,
      code: invite.code,
      email: invite.email,
      name: invite.name,
      registrationLink: superbetRegistrationLink, // Link da Superbet
      expiresAt: invite.expiresAt,
      status: invite.status,
    });
  } catch (error: any) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Erro ao criar convite' });
  }
});

/**
 * Listar todos os convites (apenas admin)
 */
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const invites = await prisma.affiliateInvite.findMany({
      where,
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            deal: {
              select: {
                id: true,
                name: true,
                cpaValue: true,
                revSharePercentage: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const adminSuperbetLink = await getSystemConfig('ADMIN_SUPERBET_LINK', '');

    const invitesWithLinks = invites.map((invite) => ({
      id: invite.id,
      code: invite.code,
      email: invite.email,
      name: invite.name,
      status: invite.status,
      // Não geramos link próprio - usamos apenas o link do admin cadastrado
      registrationLink: adminSuperbetLink || `${frontendUrl}/register?invite=${invite.code}`,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      affiliate: invite.affiliate
        ? {
            id: invite.affiliate.id,
            superbetAffiliateLink: invite.affiliate.superbetAffiliateLink,
            superbetAffiliateId: invite.affiliate.superbetAffiliateId,
            deal: invite.affiliate.deal,
            user: invite.affiliate.user,
          }
        : null,
    }));

    res.json(invitesWithLinks);
  } catch (error: any) {
    console.error('List invites error:', error);
    res.status(500).json({ error: 'Erro ao listar convites' });
  }
});

/**
 * Obter convite por código (público, para página de cadastro)
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const invite = await prisma.affiliateInvite.findUnique({
      where: { code },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    // Verificar se expirou
    if (invite.expiresAt < new Date() && invite.status === 'PENDING') {
      await prisma.affiliateInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Convite expirado' });
    }

    // Verificar se já foi usado
    if (invite.status !== 'PENDING') {
      return res.status(400).json({
        error: `Convite já foi ${invite.status === 'APPROVED' ? 'aprovado' : 'rejeitado'}`,
        status: invite.status,
      });
    }

    res.json({
      code: invite.code,
      email: invite.email,
      name: invite.name,
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    console.error('Get invite error:', error);
    res.status(500).json({ error: 'Erro ao obter convite' });
  }
});

/**
 * Registrar afiliado usando convite (público)
 * Este endpoint envia os dados para a Superbet
 */
router.post('/:code/register', async (req, res) => {
  try {
    const { code } = req.params;
    const { password, phone, company } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    // Buscar convite
    const invite = await prisma.affiliateInvite.findUnique({
      where: { code },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    // Verificar se expirou
    if (invite.expiresAt < new Date()) {
      await prisma.affiliateInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Convite expirado' });
    }

    // Verificar se já foi usado
    if (invite.status !== 'PENDING') {
      return res.status(400).json({
        error: `Convite já foi ${invite.status === 'APPROVED' ? 'aprovado' : 'rejeitado'}`,
      });
    }

    // Verificar se email já está cadastrado
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Enviar para Superbet
    let superbetRequestId: string | null = null;
    try {
      const superbetResponse = await superbetAdapter.registerAffiliate({
        email: invite.email,
        name: invite.name,
        phone,
        company,
      });

      superbetRequestId = superbetResponse.requestId;

      // Atualizar convite com requestId
      await prisma.affiliateInvite.update({
        where: { id: invite.id },
        data: {
          superbetRequestId,
          status: superbetResponse.status === 'approved' ? 'APPROVED' : 'PENDING',
        },
      });

      // Se já foi aprovado imediatamente, criar usuário e afiliado
      if (superbetResponse.status === 'approved' && superbetResponse.affiliateLink) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash(password, 10);

        const user = await prisma.user.create({
          data: {
            email: invite.email,
            password: hashedPassword,
            name: invite.name,
            role: 'AFFILIATE',
          },
        });

        const affiliate = await prisma.affiliate.create({
          data: {
            name: invite.name,
            userId: user.id,
            superbetAffiliateLink: superbetResponse.affiliateLink,
            superbetAffiliateId: superbetResponse.affiliateId,
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

        // Criar e associar deal automaticamente (buscar deal real da Superbet)
        await createAndAssociateDefaultDeal(affiliate.id, invite.name, superbetResponse.affiliateId);

        return res.status(201).json({
          message: 'Cadastro realizado com sucesso! Você já pode fazer login.',
          affiliate: {
            id: affiliate.id,
            superbetAffiliateLink: affiliate.superbetAffiliateLink,
          },
        });
      }
    } catch (superbetError: any) {
      console.error('Superbet registration error:', superbetError);
      // Continuar mesmo se Superbet falhar (pode ser webhook depois)
    }

    // Se ainda está pendente, apenas criar o convite atualizado
    res.status(202).json({
      message: 'Cadastro enviado para aprovação. Você receberá um email quando for aprovado.',
      requestId: superbetRequestId,
    });
  } catch (error: any) {
    console.error('Register with invite error:', error);
    res.status(500).json({ error: 'Erro ao registrar afiliado' });
  }
});

/**
 * Webhook da Superbet para notificar aprovação (público, mas protegido por token)
 * Recebe quando afiliado se cadastra e é aprovado pela Superbet
 */
router.post('/webhook/superbet', async (req, res) => {
  try {
    // Verificar token de webhook
    const webhookToken = req.headers['x-webhook-token'];
    if (webhookToken !== process.env.SUPERBET_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { requestId, affiliateId, affiliateLink, status, email, password } = req.body;

    if (!requestId || !affiliateId || !affiliateLink) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Log completo dos dados recebidos para debug
    console.log('📥 Webhook Superbet recebido:', JSON.stringify(req.body, null, 2));

    // IMPORTANTE: Quando admin envia link da Superbet, afiliado se cadastra DIRETAMENTE na Superbet
    // O webhook recebe quando Superbet aprova o cadastro
    // Buscar registro pendente pelo requestId OU criar novo se não existir
    let invite = await prisma.affiliateInvite.findFirst({
      where: { superbetRequestId: requestId },
      include: { affiliate: true },
    });

    // Se não encontrou registro, é cadastro direto via link da Superbet que admin enviou
    // Criar registro pendente para rastrear até aprovação
    if (!invite) {
      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório para criar registro' });
      }

      console.log('📝 Criando registro pendente para afiliado cadastrado via link da Superbet');
      
      // Verificar se já existe usuário com este email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Se já existe usuário, buscar afiliado associado
        const existingAffiliate = await prisma.affiliate.findFirst({
          where: { userId: existingUser.id },
          include: { invite: true },
        });

        if (existingAffiliate) {
          // Atualizar afiliado existente com link da Superbet
          await prisma.affiliate.update({
            where: { id: existingAffiliate.id },
            data: {
              superbetAffiliateLink: affiliateLink,
              superbetAffiliateId: affiliateId,
            },
          });

          if (status === 'approved' && !existingAffiliate.dealId) {
            await createAndAssociateDefaultDeal(existingAffiliate.id, existingAffiliate.name, affiliateId);
          }

          return res.json({ message: 'Afiliado atualizado com sucesso' });
        }
      }

      // Criar registro pendente
      invite = await prisma.affiliateInvite.create({
        data: {
          code: generateInviteCode(),
          email: email,
          name: req.body.name || email.split('@')[0],
          status: status === 'approved' ? 'APPROVED' : 'PENDING',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          superbetRequestId: requestId,
        },
        include: { affiliate: true },
      });
    }

    // Se já tem afiliado criado, apenas atualizar
    if (invite.affiliate) {
      await prisma.affiliate.update({
        where: { id: invite.affiliate.id },
        data: {
          superbetAffiliateLink: affiliateLink,
          superbetAffiliateId: affiliateId,
        },
      });

      await prisma.affiliateInvite.update({
        where: { id: invite.id },
        data: { status: status === 'approved' ? 'APPROVED' : 'REJECTED' },
      });

      // Se foi aprovado e ainda não tem deal, criar e associar deal automaticamente
      if (status === 'approved' && !invite.affiliate.dealId) {
        await createAndAssociateDefaultDeal(invite.affiliate.id, invite.name, affiliateId);
      }

      return res.json({ message: 'Afiliado atualizado com sucesso' });
    }

    // Se foi aprovado mas ainda não tem afiliado criado, criar agora
    if (status === 'approved') {
      // Verificar se usuário já existe
      let user = await prisma.user.findUnique({
        where: { email: invite.email },
      });

      if (!user) {
        // IMPORTANTE: Tentar espelhar senha que veio da Superbet, senão criar temporária
        const bcrypt = await import('bcryptjs');
        let hashedPassword: string;
        
        if (password && typeof password === 'string') {
          // Se a Superbet enviou a senha, espelhar ela
          console.log('🔐 Espelhando senha recebida da Superbet');
          hashedPassword = await bcrypt.default.hash(password, 10);
        } else {
          // Senão, criar senha temporária
          const tempPassword = crypto.randomBytes(16).toString('hex');
          hashedPassword = await bcrypt.default.hash(tempPassword, 10);
          console.log('⚠️  Senha não recebida da Superbet, criando temporária');
        }

        // IMPORTANTE: Usar email que veio da Superbet (espelhado)
        const userEmail = email || invite.email;
        const userName = req.body.name || invite.name;

        user = await prisma.user.create({
          data: {
            email: userEmail,
            password: hashedPassword,
            name: userName,
            role: 'AFFILIATE',
          },
        });
      }

      // Criar afiliado com link espelhado da Superbet
      const affiliate = await prisma.affiliate.create({
        data: {
          name: req.body.name || invite.name,
          userId: user.id,
          superbetAffiliateLink: affiliateLink, // Link espelhado da Superbet
          superbetAffiliateId: affiliateId,
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

      // Criar e associar deal automaticamente (buscar deal real da Superbet)
      await createAndAssociateDefaultDeal(affiliate.id, affiliate.name, affiliateId);

      // TODO: Enviar email para o afiliado com credenciais e link
    } else {
      // Rejeitado
      await prisma.affiliateInvite.update({
        where: { id: invite.id },
        data: { status: 'REJECTED' },
      });
    }

    res.json({ message: 'Webhook processado com sucesso' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

/**
 * Verificar status de aprovação manualmente (apenas admin)
 */
router.post('/:id/check-status', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const invite = await prisma.affiliateInvite.findUnique({
      where: { id },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (!invite.superbetRequestId) {
      return res.status(400).json({ 
        error: 'Este convite ainda não foi registrado na Superbet. O afiliado precisa acessar o link de cadastro primeiro.' 
      });
    }

    // Verificar status na Superbet
    const status = await superbetAdapter.checkRequestStatus(invite.superbetRequestId);

    // Atualizar convite
    await prisma.affiliateInvite.update({
      where: { id },
      data: {
        status: status.status === 'approved' ? 'APPROVED' : status.status === 'rejected' ? 'REJECTED' : 'PENDING',
      },
    });

    // Se foi aprovado e tem link, atualizar/criar afiliado
    if (status.status === 'approved' && status.affiliateLink && !invite.affiliateId) {
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
        where: { id },
        data: { affiliateId: affiliate.id },
      });

      // Criar e associar deal automaticamente (buscar deal real da Superbet)
      await createAndAssociateDefaultDeal(affiliate.id, invite.name, status.affiliateId);
    }

    res.json({
      status: status.status,
      affiliateLink: status.affiliateLink,
      affiliateId: status.affiliateId,
    });
  } catch (error: any) {
    console.error('Check status error:', error);
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

// Endpoint para sincronizar afiliados pendentes manualmente (apenas admin)
router.post('/sync-pending', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Importar função de sincronização do cron
    const cronModule = await import('../services/cron');
    
    // Executar sincronização
    await cronModule.syncSuperbetAffiliates?.();
    
    res.json({ message: 'Sincronização de afiliados pendentes concluída' });
  } catch (error: any) {
    console.error('Sync pending error:', error);
    res.status(500).json({ error: 'Erro ao sincronizar afiliados pendentes' });
  }
});

export default router;
