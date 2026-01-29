import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getSystemConfig } from '../services/config';

const router = express.Router();
const prisma = new PrismaClient();

// Obter métricas gerais do dashboard
router.get('/metrics', authenticate, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    const affiliateId = req.user?.role === 'AFFILIATE' ? req.user.affiliateId : undefined;
    const isAdmin = req.user?.role === 'ADMIN';

    const where: any = {};
    if (affiliateId) {
      where.affiliateId = affiliateId;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    // Obter valores padrão do sistema
    const defaultCpaValue = parseFloat(await getSystemConfig('CPA_VALUE', '300'));
    const defaultRevSharePercentage = parseFloat(await getSystemConfig('REVENUE_SHARE_PERCENTAGE', '25'));

    // IMPORTANTE: Se for um afiliado individual, usar valores do deal criado pelo admin
    // O deal tem prioridade sobre valores padrão do sistema
    let cpaValue = defaultCpaValue;
    let revSharePercentage = defaultRevSharePercentage;
    let dealName: string | null = null;

    if (affiliateId) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { id: affiliateId },
        include: { deal: true },
      });

      // IMPORTANTE: Usar valores do deal criado pelo admin se existir e estiver ativo
      // O deal tem prioridade sobre valores padrão do sistema
      if (affiliate?.deal && affiliate.deal.active) {
        cpaValue = Number(affiliate.deal.cpaValue);
        revSharePercentage = Number(affiliate.deal.revSharePercentage);
        dealName = affiliate.deal.name;
      }
    }

    // Total de FTDs
    const totalFTDs = await prisma.fTD.count({
      where,
    });

    // Total de CPAs (FTDs qualificados)
    const totalCPAs = await prisma.fTD.count({
      where: {
        ...where,
        // Aqui você pode adicionar lógica adicional para qualificar CPAs
      },
    });

    // Valor total em CPA - calcular usando valores individuais de cada afiliado
    let totalCPAValue = 0;
    
    if (affiliateId) {
      // Se for um afiliado específico, usar o valor dele
      totalCPAValue = totalCPAs * cpaValue;
    } else {
      // Se for admin ou múltiplos afiliados, calcular usando valores individuais
      const ftds = await prisma.fTD.findMany({
        where,
        select: {
          affiliateId: true,
        },
      });

      // Buscar valores de CPA de cada afiliado único
      const uniqueAffiliateIds = [...new Set(ftds.map(ftd => ftd.affiliateId).filter(Boolean))];
      
      const affiliatesWithDeals = await prisma.affiliate.findMany({
        where: {
          id: { in: uniqueAffiliateIds as string[] },
        },
        include: {
          deal: true,
        },
      });

      // Criar mapa de valores de CPA por afiliado
      const cpaValueMap = new Map<string, number>();
      affiliatesWithDeals.forEach(affiliate => {
        const value = affiliate.deal && affiliate.deal.active
          ? Number(affiliate.deal.cpaValue)
          : defaultCpaValue;
        cpaValueMap.set(affiliate.id, value);
      });

      // Calcular total usando valores individuais
      totalCPAValue = ftds.reduce((sum, ftd) => {
        if (ftd.affiliateId) {
          const affiliateCpaValue = cpaValueMap.get(ftd.affiliateId) || defaultCpaValue;
          return sum + affiliateCpaValue;
        }
        return sum;
      }, 0);
    }

    // Valor em Revenue Share - já está calculado corretamente nas comissões
    const revShareReports = await prisma.revShareReport.findMany({
      where,
      select: {
        commission: true,
      },
    });

    const totalRevShare = revShareReports.reduce(
      (sum, report) => sum + Number(report.commission),
      0
    );

    res.json({
      totalFTDs,
      totalCPAs,
      totalCPAValue,
      totalRevShare,
      cpaValue: affiliateId ? cpaValue : undefined, // Só retorna se for afiliado específico
      revSharePercentage: affiliateId ? revSharePercentage : undefined, // Só retorna se for afiliado específico
      dealName: affiliateId ? dealName : undefined, // Só retorna se for afiliado específico
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Erro ao obter métricas' });
  }
});

// Obter métricas por afiliado
router.get('/affiliates', authenticate, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    const isAdmin = req.user?.role === 'ADMIN';

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const where: any = {};
    if (!isAdmin && req.user?.affiliateId) {
      where.affiliateId = req.user.affiliateId;
    }
    if (startDate || endDate) {
      where.date = dateFilter;
    }

    // Buscar afiliados
    // Admin: todos os afiliados cadastrados
    // Afiliado: apenas os que ele indicou (seus referrals)
    const whereClause: any = {};
    
    if (!isAdmin && req.user?.affiliateId) {
      whereClause.referredById = req.user.affiliateId;
    }

    const affiliates = await prisma.affiliate.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        deal: true,
        referredBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Obter valores padrão do sistema
    const defaultCpaValue = parseFloat(await getSystemConfig('CPA_VALUE', '300'));
    const defaultRevSharePercentage = parseFloat(await getSystemConfig('REVENUE_SHARE_PERCENTAGE', '25'));

    const metrics = await Promise.all(
      affiliates.map(async (affiliate) => {
        const affiliateWhere = {
          ...where,
          affiliateId: affiliate.id,
        };

        // IMPORTANTE: Usar valores do deal criado pelo admin para este afiliado
        // O deal tem prioridade sobre valores padrão do sistema
        const affiliateCpaValue = affiliate.deal && affiliate.deal.active 
          ? Number(affiliate.deal.cpaValue) 
          : defaultCpaValue;
        const affiliateRevSharePercentage = affiliate.deal && affiliate.deal.active
          ? Number(affiliate.deal.revSharePercentage)
          : defaultRevSharePercentage;

        // FTDs
        const ftds = await prisma.fTD.count({
          where: affiliateWhere,
        });

        // CPAs
        const cpas = await prisma.fTD.count({
          where: affiliateWhere,
        });

        // Valor CPA usando o valor do deal
        const cpaValueTotal = cpas * affiliateCpaValue;

        // Revenue Share
        const revShareReports = await prisma.revShareReport.findMany({
          where: affiliateWhere,
          select: {
            commission: true,
          },
        });

        const revShareValue = revShareReports.reduce(
          (sum, report) => sum + Number(report.commission),
          0
        );

        return {
          id: affiliate.id,
          name: affiliate.name,
          externalId: affiliate.externalId,
          ftds,
          cpas,
          cpaValue: cpaValueTotal,
          revShareValue,
          cpaValuePerUnit: affiliateCpaValue,
          revSharePercentage: affiliateRevSharePercentage,
          dealName: affiliate.deal?.name || null,
        };
      })
    );

    res.json(metrics);
  } catch (error) {
    console.error('Get affiliates metrics error:', error);
    res.status(500).json({ error: 'Erro ao obter métricas por afiliado' });
  }
});

// Obter histórico de transações
router.get('/transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, status, affiliateId, page = '1', limit = '50' } = req.query;

    const where: any = {};
    
    if (req.user?.role === 'AFFILIATE') {
      where.affiliateId = req.user.affiliateId;
    } else if (affiliateId) {
      where.affiliateId = affiliateId as string;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    if (status) {
      where.status = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          affiliate: {
            select: {
              id: true,
              name: true,
            },
          },
          player: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      data: transactions,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalRows: total,
        pageSize: limitNum,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Erro ao obter transações' });
  }
});

export default router;
