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

    res.json({
      cpaValue: parseFloat(cpaValue),
      revSharePercentage: parseFloat(revSharePercentage),
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Erro ao obter configurações' });
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
