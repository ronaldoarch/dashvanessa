import cron from 'node-cron';
import { otgAdapter } from './otgAdapter';

export function setupCronJobs() {
  // Sincronizar afiliados a cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Iniciando sincronização de afiliados...');
    try {
      await otgAdapter.syncAffiliates();
      console.log('✅ Sincronização de afiliados concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização de afiliados:', error);
    }
  });

  // Sincronizar resultados a cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Iniciando sincronização de resultados...');
    try {
      await otgAdapter.syncResults();
      console.log('✅ Sincronização de resultados concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização de resultados:', error);
    }
  });

  console.log('⏰ Cron jobs configurados:');
  console.log('   - Sincronização de afiliados: a cada hora');
  console.log('   - Sincronização de resultados: a cada 5 minutos');
}
