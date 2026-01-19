import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSystemConfig(key: string, defaultValue: string): Promise<string> {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!config) {
    // Criar com valor padrão se não existir
    await prisma.systemConfig.create({
      data: {
        key,
        value: defaultValue,
      },
    });
    return defaultValue;
  }

  return config.value;
}

export async function setSystemConfig(key: string, value: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
