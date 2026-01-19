import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Endpoint para registrar novo afiliado via link de indicação
router.post('/register', async (req, res) => {
  try {
    const { referralCode, email, password, name } = req.body;

    if (!referralCode || !email || !password || !name) {
      return res.status(400).json({ error: 'Código de indicação, email, senha e nome são obrigatórios' });
    }

    // Buscar afiliado que fez a indicação pelo código
    const referringAffiliate = await prisma.affiliate.findFirst({
      where: {
        OR: [
          { id: referralCode },
          { externalId: referralCode },
        ],
      },
      include: { user: true },
    });

    if (!referringAffiliate) {
      return res.status(404).json({ error: 'Código de indicação inválido' });
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criar usuário
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'AFFILIATE',
      },
    });

    // Criar afiliado vinculado ao que indicou
    const affiliate = await prisma.affiliate.create({
      data: {
        name,
        userId: user.id,
        referredById: referringAffiliate.id,
        siteIds: [],
      },
    });

    // Atualizar user com affiliateId
    await prisma.user.update({
      where: { id: user.id },
      data: { affiliateId: affiliate.id },
    });

    res.status(201).json({
      id: affiliate.id,
      email: user.email,
      name: user.name,
      referredBy: referringAffiliate.name,
      message: 'Cadastro realizado com sucesso via link de indicação',
    });
  } catch (error: any) {
    console.error('Referral register error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: 'Erro ao realizar cadastro' });
  }
});

// Obter estatísticas de indicações (apenas para o próprio afiliado)
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.affiliateId) {
      return res.status(403).json({ error: 'Apenas afiliados podem ver estatísticas de indicações' });
    }

    const totalReferrals = await prisma.affiliate.count({
      where: { referredById: req.user.affiliateId },
    });

    res.json({
      totalReferrals,
      affiliateId: req.user.affiliateId,
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

export default router;
