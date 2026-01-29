import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getSystemConfig, setSystemConfig } from '../services/config';

const router = express.Router();
const prisma = new PrismaClient();

// Obter configurações do sistema
router.get('/', authenticate, async (req, res) => {
  try {
    const cpaValue = await getSystemConfig('CPA_VALUE', '300');
    const revSharePercentage = await getSystemConfig('REVENUE_SHARE_PERCENTAGE', '25');
    const adminSuperbetLink = await getSystemConfig('ADMIN_SUPERBET_LINK', '');

    res.json({
      cpaValue: parseFloat(cpaValue),
      revSharePercentage: parseFloat(revSharePercentage),
      adminSuperbetLink,
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Erro ao obter configurações' });
  }
});

// Obter link da Superbet do admin
router.get('/admin-superbet-link', authenticate, requireAdmin, async (req, res) => {
  try {
    const link = await getSystemConfig('ADMIN_SUPERBET_LINK', '');
    res.json({ link });
  } catch (error) {
    console.error('Get admin superbet link error:', error);
    res.status(500).json({ error: 'Erro ao obter link da Superbet' });
  }
});

// Atualizar link da Superbet do admin
router.put('/admin-superbet-link', authenticate, requireAdmin, async (req, res) => {
  try {
    const { link } = req.body;

    if (!link || typeof link !== 'string') {
      return res.status(400).json({ error: 'Link é obrigatório' });
    }

    await setSystemConfig('ADMIN_SUPERBET_LINK', link);
    res.json({ link, message: 'Link da Superbet atualizado com sucesso' });
  } catch (error) {
    console.error('Update admin superbet link error:', error);
    res.status(500).json({ error: 'Erro ao atualizar link da Superbet' });
  }
});

// Atualizar configurações (apenas admin)
router.put('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { cpaValue, revSharePercentage } = req.body;

    if (cpaValue !== undefined) {
      await setSystemConfig('CPA_VALUE', cpaValue.toString());
    }

    if (revSharePercentage !== undefined) {
      await setSystemConfig('REVENUE_SHARE_PERCENTAGE', revSharePercentage.toString());
    }

    const updatedConfig = {
      cpaValue: parseFloat(await getSystemConfig('CPA_VALUE', '300')),
      revSharePercentage: parseFloat(await getSystemConfig('REVENUE_SHARE_PERCENTAGE', '25')),
    };

    res.json(updatedConfig);
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

export default router;
