import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin padrão
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
      },
    });

    console.log(`✅ Usuário admin criado: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`ℹ️  Usuário admin já existe: ${adminEmail}`);
  }

  // Criar configurações padrão do sistema
  const cpaValue = await prisma.systemConfig.findUnique({
    where: { key: 'CPA_VALUE' },
  });

  if (!cpaValue) {
    await prisma.systemConfig.create({
      data: {
        key: 'CPA_VALUE',
        value: '300',
      },
    });
    console.log('✅ Configuração CPA_VALUE criada: R$ 300');
  }

  const revSharePercentage = await prisma.systemConfig.findUnique({
    where: { key: 'REVENUE_SHARE_PERCENTAGE' },
  });

  if (!revSharePercentage) {
    await prisma.systemConfig.create({
      data: {
        key: 'REVENUE_SHARE_PERCENTAGE',
        value: '25',
      },
    });
    console.log('✅ Configuração REVENUE_SHARE_PERCENTAGE criada: 25%');
  }

  console.log('✨ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
