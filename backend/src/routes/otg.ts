import express from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { otgAdapter } from '../services/otgAdapter';

const router = express.Router();

// Sincronizar afiliados manualmente (apenas admin)
router.post('/sync/affiliates', authenticate, requireAdmin, async (req, res) => {
  try {
    await otgAdapter.syncAffiliates();
    res.json({ message: 'Afiliados sincronizados com sucesso' });
  } catch (error: any) {
    console.error('Error syncing affiliates:', error);
    res.status(500).json({ error: error.message || 'Erro ao sincronizar afiliados' });
  }
});

// Sincronizar resultados manualmente (apenas admin)
router.post('/sync/results', authenticate, requireAdmin, async (req, res) => {
  try {
    await otgAdapter.syncResults();
    res.json({ message: 'Resultados sincronizados com sucesso' });
  } catch (error: any) {
    console.error('Error syncing results:', error);
    res.status(500).json({ error: error.message || 'Erro ao sincronizar resultados' });
  }
});

// Testar conexão com API OTG (apenas admin)
router.get('/test', authenticate, requireAdmin, async (req, res) => {
  try {
    const affiliates = await otgAdapter.fetchAffiliates();
    const campaigns = await otgAdapter.fetchCampaigns();
    
    res.json({
      success: true,
      message: 'Conexão com API OTG estabelecida com sucesso',
      affiliatesCount: affiliates.length,
      campaignsCount: campaigns.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao conectar com API OTG',
    });
  }
});

export default router;
