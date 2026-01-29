import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Listar todos os deals (admin) ou deal do próprio afiliado
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'ADMIN') {
      const deals = await prisma.deal.findMany({
        include: {
          affiliates: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(deals);
    }

    // Afiliado vê apenas seu deal
    if (req.user?.affiliateId) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { id: req.user.affiliateId },
        include: {
          deal: true,
        },
      });

      if (affiliate?.deal) {
        return res.json([affiliate.deal]);
      }
    }

    res.json([]);
  } catch (error) {
    console.error('List deals error:', error);
    res.status(500).json({ error: 'Erro ao listar deals' });
  }
});

// Obter deal específico
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        affiliates: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal não encontrado' });
    }

    // Afiliados só podem ver seus próprios deals
    if (req.user?.role === 'AFFILIATE') {
      const affiliate = await prisma.affiliate.findFirst({
        where: {
          id: req.user.affiliateId,
          dealId: id,
        },
      });

      if (!affiliate) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }

    res.json(deal);
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ error: 'Erro ao obter deal' });
  }
});

// Criar deal (apenas admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, cpaValue, revSharePercentage, description, active } = req.body;

    if (!name || cpaValue === undefined || revSharePercentage === undefined) {
      return res.status(400).json({ error: 'Nome, CPA e RevShare são obrigatórios' });
    }

    const deal = await prisma.deal.create({
      data: {
        name,
        cpaValue: parseFloat(cpaValue),
        revSharePercentage: parseFloat(revSharePercentage),
        description,
        active: active !== undefined ? active : true,
      },
      include: {
        affiliates: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(deal);
  } catch (error: any) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Erro ao criar deal' });
  }
});

// Atualizar deal (apenas admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cpaValue, revSharePercentage, description, active } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (cpaValue !== undefined) updateData.cpaValue = parseFloat(cpaValue);
    if (revSharePercentage !== undefined) updateData.revSharePercentage = parseFloat(revSharePercentage);
    if (description !== undefined) updateData.description = description;
    if (active !== undefined) updateData.active = active;

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        affiliates: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(deal);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Deal não encontrado' });
    }
    console.error('Update deal error:', error);
    res.status(500).json({ error: 'Erro ao atualizar deal' });
  }
});

// Associar deal a afiliado (apenas admin)
// Gera automaticamente senha e URL do dashboard quando o deal é associado
router.post('/:dealId/affiliate/:affiliateId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { dealId, affiliateId } = req.params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        deal: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!affiliate) {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }

    // Gerar senha automática se ainda não tiver uma senha definida
    // (usuários criados via webhook têm senha temporária)
    let generatedPassword: string | null = null;
    const user = await prisma.user.findUnique({
      where: { id: affiliate.userId },
    });

    // Se o usuário foi criado via webhook (senha temporária), gerar nova senha
    if (user) {
      // Verificar se a senha é temporária (gerada pelo webhook)
      // Vamos gerar uma nova senha sempre que associar um deal
      generatedPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    // Associar deal
    const updatedAffiliate = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: { dealId },
      include: {
        deal: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Obter link da Superbet do admin (não geramos links próprios - apenas espelhamos)
    const { getSystemConfig } = await import('../services/config');
    const adminSuperbetLink = await getSystemConfig('ADMIN_SUPERBET_LINK', '');

    // Gerar URLs
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${frontendUrl}/dashboard`;
    
    // O link de referral é o link da Superbet (não geramos links próprios)
    // Prioridade: link próprio do afiliado > link do admin cadastrado
    const referralLink = updatedAffiliate.superbetAffiliateLink || adminSuperbetLink;

    res.json({
      ...updatedAffiliate,
      referralLink,
      credentials: {
        email: updatedAffiliate.user.email,
        password: generatedPassword, // Senha gerada automaticamente
        loginUrl: `${frontendUrl}/login`,
        dashboardUrl: dashboardUrl,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Deal ou afiliado não encontrado' });
    }
    console.error('Associate deal error:', error);
    res.status(500).json({ error: 'Erro ao associar deal' });
  }
});

// Remover associação de deal (apenas admin)
router.delete('/:dealId/affiliate/:affiliateId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { affiliateId } = req.params;

    const affiliate = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: { dealId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(affiliate);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }
    console.error('Remove deal association error:', error);
    res.status(500).json({ error: 'Erro ao remover associação' });
  }
});

// Deletar deal (apenas admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se há afiliados associados
    const affiliatesCount = await prisma.affiliate.count({
      where: { dealId: id },
    });

    if (affiliatesCount > 0) {
      return res.status(400).json({ 
        error: `Não é possível deletar. Existem ${affiliatesCount} afiliado(s) associado(s) a este deal.` 
      });
    }

    await prisma.deal.delete({
      where: { id },
    });

    res.json({ message: 'Deal deletado com sucesso' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Deal não encontrado' });
    }
    console.error('Delete deal error:', error);
    res.status(500).json({ error: 'Erro ao deletar deal' });
  }
});

export default router;
