import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Registrar evento de clique em link (público - para rastreamento)
 */
router.post('/link-event', async (req, res) => {
  try {
    const { affiliateId, linkType, linkUrl, eventType = 'CLICK', metadata } = req.body;

    if (!linkType || !linkUrl) {
      return res.status(400).json({ error: 'linkType e linkUrl são obrigatórios' });
    }

    // Obter informações da requisição para rastreamento
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'];

    const event = await prisma.linkEvent.create({
      data: {
        affiliateId: affiliateId || null,
        linkType,
        linkUrl,
        eventType: eventType || 'CLICK',
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
        userAgent,
        referer,
        metadata: metadata || {},
      },
    });

    res.json({ success: true, eventId: event.id });
  } catch (error: any) {
    console.error('Track link event error:', error);
    res.status(500).json({ error: 'Erro ao registrar evento' });
  }
});

/**
 * Listar eventos de links (apenas admin)
 */
router.get('/link-events', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { affiliateId, linkType, eventType, startDate, endDate } = req.query;

    const where: any = {};
    if (affiliateId) where.affiliateId = affiliateId as string;
    if (linkType) where.linkType = linkType as string;
    if (eventType) where.eventType = eventType as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const events = await prisma.linkEvent.findMany({
      where,
      include: {
        affiliate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limitar a 1000 eventos por vez
    });

    res.json(events);
  } catch (error: any) {
    console.error('List link events error:', error);
    res.status(500).json({ error: 'Erro ao listar eventos' });
  }
});

/**
 * Estatísticas de eventos por afiliado (apenas admin)
 */
router.get('/link-events/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { affiliateId, linkType, startDate, endDate } = req.query;

    const where: any = {};
    if (affiliateId) where.affiliateId = affiliateId as string;
    if (linkType) where.linkType = linkType as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [totalClicks, totalViews, totalConversions, clicksByType] = await Promise.all([
      prisma.linkEvent.count({ where: { ...where, eventType: 'CLICK' } }),
      prisma.linkEvent.count({ where: { ...where, eventType: 'VIEW' } }),
      prisma.linkEvent.count({ where: { ...where, eventType: 'CONVERSION' } }),
      prisma.linkEvent.groupBy({
        by: ['linkType'],
        where: { ...where, eventType: 'CLICK' },
        _count: true,
      }),
    ]);

    res.json({
      totalClicks,
      totalViews,
      totalConversions,
      clicksByType: clicksByType.map((item) => ({
        linkType: item.linkType,
        count: item._count,
      })),
    });
  } catch (error: any) {
    console.error('Get link events stats error:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

export default router;
