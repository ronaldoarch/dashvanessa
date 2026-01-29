import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import SuperbetAdapter from '../services/superbetAdapter';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Inicializar adapter Superbet (configurar via env)
const superbetAdapter = new SuperbetAdapter({
  apiKey: process.env.SUPERBET_API_KEY || '',
  baseURL: process.env.SUPERBET_API_URL || 'https://api.superbet.com/v1',
});

// Cadastro público de afiliado (sem convite)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, company } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
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

    // Enviar dados para Superbet via API
    let superbetRequestId: string | null = null;
    let superbetAffiliateId: string | null = null;
    let superbetAffiliateLink: string | null = null;
    
    try {
      console.log('📡 Enviando dados do afiliado para Superbet API...');
      const superbetResponse = await superbetAdapter.registerAffiliate({
        email,
        name,
        phone,
        company,
      });

      superbetRequestId = superbetResponse.requestId;
      
      // Se foi aprovado imediatamente pela Superbet, salvar dados
      if (superbetResponse.status === 'approved' && superbetResponse.affiliateLink) {
        superbetAffiliateId = superbetResponse.affiliateId || null;
        superbetAffiliateLink = superbetResponse.affiliateLink;
        console.log('✅ Afiliado aprovado imediatamente pela Superbet');
      } else {
        console.log('⏳ Afiliado pendente na Superbet (requestId:', superbetRequestId, ')');
      }
    } catch (superbetError: any) {
      console.error('⚠️ Erro ao enviar dados para Superbet:', superbetError.message);
      // Continuar mesmo se Superbet falhar - o cadastro será criado localmente
      // O admin pode cadastrar manualmente depois
    }

    // Criar afiliado com status PENDING (aguardando aprovação do admin)
    // Mesmo que Superbet tenha aprovado, mantemos PENDING até admin aprovar no sistema
    const affiliate = await prisma.affiliate.create({
      data: {
        name,
        userId: user.id,
        status: 'PENDING',
        siteIds: [],
        superbetAffiliateId: superbetAffiliateId,
        superbetAffiliateLink: superbetAffiliateLink,
      },
    });

    // Criar registro de invite para rastrear o requestId da Superbet (se necessário)
    if (superbetRequestId) {
      try {
        await prisma.affiliateInvite.create({
          data: {
            code: crypto.randomBytes(8).toString('hex').toUpperCase(),
            email,
            name,
            status: superbetAffiliateLink ? 'APPROVED' : 'PENDING',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            superbetRequestId: superbetRequestId,
            affiliateId: affiliate.id,
          },
        });
      } catch (inviteError: any) {
        // Ignorar erro se já existir invite ou outro problema
        console.log('Nota: Não foi possível criar registro de invite:', inviteError.message);
      }
    }

    // Atualizar user com affiliateId
    await prisma.user.update({
      where: { id: user.id },
      data: { affiliateId: affiliate.id },
    });

    res.status(201).json({
      message: 'Cadastro realizado com sucesso! Dados enviados para Superbet. Sua conta está aguardando aprovação do administrador.',
      affiliate: {
        id: affiliate.id,
        email: user.email,
        name: affiliate.name,
        status: affiliate.status,
        superbetRequestId: superbetRequestId,
        superbetApproved: !!superbetAffiliateLink,
      },
    });
  } catch (error: any) {
    console.error('Register affiliate error:', error);
    res.status(500).json({ error: 'Erro ao realizar cadastro' });
  }
});

// Listar todos os afiliados (admin) ou apenas o próprio (afiliado)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'ADMIN') {
      const { status } = req.query;
      const where: any = {};
      
      if (status && typeof status === 'string' && status !== 'all') {
        where.status = status;
      }

      const affiliates = await prisma.affiliate.findMany({
        where,
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

// Aprovar afiliado (apenas admin)
router.put('/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!affiliate) {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }

    await prisma.affiliate.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    res.json({ message: 'Afiliado aprovado com sucesso' });
  } catch (error: any) {
    console.error('Approve affiliate error:', error);
    res.status(500).json({ error: 'Erro ao aprovar afiliado' });
  }
});

// Rejeitar afiliado (apenas admin)
router.put('/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
    });

    if (!affiliate) {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }

    await prisma.affiliate.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    res.json({ message: 'Afiliado rejeitado' });
  } catch (error: any) {
    console.error('Reject affiliate error:', error);
    res.status(500).json({ error: 'Erro ao rejeitar afiliado' });
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

// Cadastrar link da Superbet de uma afiliada (apenas admin)
// Usado quando a afiliada envia seu link da Superbet para o admin cadastrar
router.post('/register-superbet-link', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { email, name, superbetLink } = req.body;

    if (!email || !name || !superbetLink) {
      return res.status(400).json({ error: 'Email, nome e link da Superbet são obrigatórios' });
    }

    // Verificar se já existe afiliado com este email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criar registro pendente (será aprovado quando Superbet enviar webhook)
    // Não criamos usuário ainda, apenas registramos o link
    const invite = await prisma.affiliateInvite.create({
      data: {
        code: crypto.randomBytes(8).toString('hex').toUpperCase(),
        email,
        name,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        superbetRequestId: null, // Será preenchido quando Superbet aprovar
      },
    });

    res.status(201).json({
      message: 'Link da Superbet cadastrado. Aguardando aprovação da Superbet.',
      invite: {
        id: invite.id,
        email: invite.email,
        name: invite.name,
        status: invite.status,
        superbetLink, // Link que será usado quando aprovar
      },
    });
  } catch (error: any) {
    console.error('Register superbet link error:', error);
    res.status(500).json({ error: 'Erro ao cadastrar link da Superbet' });
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
