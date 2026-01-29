import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Listar todos os afiliados (admin) ou apenas o próprio (afiliado)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'ADMIN') {
      const affiliates = await prisma.affiliate.findMany({
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
              active: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(affiliates);
    }

    if (req.user?.affiliateId) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { id: req.user.affiliateId },
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
              active: true,
            },
          },
        },
      });
      return res.json(affiliate ? [affiliate] : []);
    }

    res.json([]);
  } catch (error) {
    console.error('List affiliates error:', error);
    res.status(500).json({ error: 'Erro ao listar afiliados' });
  }
});

// Obter afiliado específico
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Afiliados só podem ver seus próprios dados
    if (req.user?.role === 'AFFILIATE' && req.user.affiliateId !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!affiliate) {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }

    res.json(affiliate);
  } catch (error) {
    console.error('Get affiliate error:', error);
    res.status(500).json({ error: 'Erro ao obter afiliado' });
  }
});

// Criar afiliado (apenas admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, externalId, siteIds, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: 'Nome e userId são obrigatórios' });
    }

    const affiliate = await prisma.affiliate.create({
      data: {
        name,
        externalId,
        siteIds: siteIds || [],
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(affiliate);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Afiliado já existe' });
    }
    console.error('Create affiliate error:', error);
    res.status(500).json({ error: 'Erro ao criar afiliado' });
  }
});

// Atualizar links sociais do afiliado (apenas admin)
router.put('/:id/social-links', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { instagramLink, facebookLink, telegramLink } = req.body;

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        instagramLink: instagramLink !== undefined ? instagramLink : undefined,
        facebookLink: facebookLink !== undefined ? facebookLink : undefined,
        telegramLink: telegramLink !== undefined ? telegramLink : undefined,
      },
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
            active: true,
          },
        },
      },
    });

    res.json(affiliate);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }
    console.error('Update social links error:', error);
    res.status(500).json({ error: 'Erro ao atualizar links sociais' });
  }
});

// Atualizar link da Superbet do afiliado (apenas admin - permite modificar link espelhado)
router.put('/:id/superbet-link', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { superbetAffiliateLink } = req.body;

    if (!superbetAffiliateLink || typeof superbetAffiliateLink !== 'string') {
      return res.status(400).json({ error: 'Link da Superbet é obrigatório' });
    }

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        superbetAffiliateLink,
      },
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
            active: true,
          },
        },
      },
    });

    res.json(affiliate);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }
    console.error('Update superbet link error:', error);
    res.status(500).json({ error: 'Erro ao atualizar link da Superbet' });
  }
});

export default router;
