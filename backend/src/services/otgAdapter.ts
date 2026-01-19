import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import { getSystemConfig } from './config';

const prisma = new PrismaClient();

interface OTGAffiliate {
  id: string;
  name: string;
  siteIds: number[];
}

interface OTGCampaign {
  id: string;
  name: string;
}

interface OTGResultGranular {
  affiliateId: string;
  affiliateName: string;
  campaignName: string;
  date: string;
  lucro_tipster: number;
  cpa: number;
  rvs: number;
  registrations: number;
  first_deposits: number;
  qualified_cpa: number;
}

interface OTGResponse<T> {
  data: T[];
  meta?: {
    currentPage: number;
    totalPages: number;
    totalRows: number;
    pageSize: number;
  };
}

class OTGAdapter {
  private api: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OTG_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ OTG_API_KEY não configurada. A sincronização não funcionará.');
    }

    this.api = axios.create({
      baseURL: process.env.OTG_API_BASE_URL || 'https://api-partners.grupootg.com/api/v1',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 segundos
    });

    // Interceptor para log de requisições
    this.api.interceptors.request.use(
      (config) => {
        console.log(`📡 OTG API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ OTG API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para log de respostas
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ OTG API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(`❌ OTG API Error: ${error.response.status} - ${error.response.data?.message || error.message}`);
          console.error('Response data:', error.response.data);
        } else if (error.request) {
          console.error('❌ OTG API: Sem resposta do servidor');
        } else {
          console.error('❌ OTG API Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async fetchAffiliates(): Promise<OTGAffiliate[]> {
    try {
      const response = await this.api.get<any>('/external/affiliates');
      
      if (!response.data) {
        throw new Error('Resposta vazia da API');
      }

      const responseData = response.data;

      // A API OTG retorna no formato:
      // {
      //   "statusCode": 200,
      //   "message": "Success",
      //   "data": {
      //     "data": [...],
      //     "meta": {...}
      //   }
      // }

      // Se a resposta tem a estrutura aninhada { data: { data: [...] } }
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        return responseData.data.data;
      }

      // Se a resposta tem a estrutura { data: [...] }
      if (responseData.data && Array.isArray(responseData.data)) {
        return responseData.data;
      }

      // Se a resposta já é um array diretamente
      if (Array.isArray(responseData)) {
        return responseData;
      }

      // Se não conseguir adaptar, retornar array vazio
      console.warn('⚠️ Formato de resposta de affiliates não reconhecido');
      return [];
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Chave de API inválida ou expirada. Verifique OTG_API_KEY no .env');
      }
      console.error('Error fetching affiliates:', error.message);
      if (error.response?.data) {
        console.error('📦 Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  async fetchCampaigns(): Promise<OTGCampaign[]> {
    try {
      const response = await this.api.get<any>('/external/campaigns');
      
      if (!response.data) {
        throw new Error('Resposta vazia da API');
      }

      const responseData = response.data;

      // Se a resposta tem a estrutura aninhada { data: { data: [...] } }
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        return responseData.data.data;
      }

      // Se a resposta tem a estrutura { data: [...] }
      if (responseData.data && Array.isArray(responseData.data)) {
        return responseData.data;
      }

      // Se a resposta já é um array diretamente
      if (Array.isArray(responseData)) {
        return responseData;
      }

      // Se não conseguir adaptar, retornar array vazio
      console.warn('⚠️ Formato de resposta de campaigns não reconhecido');
      return [];
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Chave de API inválida ou expirada. Verifique OTG_API_KEY no .env');
      }
      console.error('Error fetching campaigns:', error.message);
      if (error.response?.data) {
        console.error('📦 Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  async fetchResults(
    startDate: string,
    endDate: string,
    affiliateIds?: string[],
    campaignIds?: string[],
    page: number = 1,
    limit: number = 50,
    groupBy?: 'affiliate' | 'campaign' | 'date'
  ): Promise<OTGResponse<OTGResultGranular>> {
    try {
      // Validar formato de data (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        throw new Error('Datas devem estar no formato YYYY-MM-DD');
      }

      const params: any = {
        startDate,
        endDate,
        page,
        limit,
      };

      // groupBy é opcional conforme documentação
      if (groupBy) {
        params.groupBy = groupBy;
      }

      // affiliateIds como array de strings
      if (affiliateIds && affiliateIds.length > 0) {
        params.affiliateIds = affiliateIds;
      }

      // campaignIds como array de strings
      if (campaignIds && campaignIds.length > 0) {
        params.campaignIds = campaignIds;
      }

      const response = await this.api.get<OTGResponse<OTGResultGranular>>('/external/results', {
        params,
        // Axios precisa serializar arrays corretamente
        paramsSerializer: {
          indexes: null, // Serializa arrays como affiliateIds[]=value1&affiliateIds[]=value2
        },
      });

      // A API OTG retorna no formato:
      // {
      //   "statusCode": 200,
      //   "message": "Success",
      //   "data": {
      //     "data": [...],
      //     "meta": {...}
      //   },
      //   "timestamp": "..."
      // }

      // Validar resposta
      if (!response.data) {
        throw new Error('Resposta vazia da API');
      }

      const responseData = response.data as any;

      // Se a resposta tem a estrutura aninhada { data: { data: [...], meta: {...} } }
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        return {
          data: responseData.data.data,
          meta: responseData.data.meta,
        };
      }

      // Se a resposta tem a estrutura { data: [...] }
      if (responseData.data && Array.isArray(responseData.data)) {
        return {
          data: responseData.data,
          meta: responseData.meta,
        };
      }

      // Se a resposta já é um array diretamente
      if (Array.isArray(responseData)) {
        return {
          data: responseData,
          meta: undefined,
        };
      }

      // Se não conseguir adaptar, retornar array vazio para não quebrar
      console.warn('⚠️ Formato de resposta não reconhecido');
      return {
        data: [],
        meta: undefined,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Chave de API inválida ou expirada. Verifique OTG_API_KEY no .env');
      }
      if (error.response?.status === 400) {
        throw new Error(`Parâmetros inválidos: ${error.response.data?.message || error.message}`);
      }
      // Log detalhado do erro para debug
      console.error('❌ Error fetching results:', error.message);
      if (error.response?.data) {
        console.error('📦 Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  async syncAffiliates(): Promise<void> {
    try {
      const otgAffiliates = await this.fetchAffiliates();

      for (const otgAffiliate of otgAffiliates) {
        // Verificar se o afiliado já existe pelo externalId
        const existingAffiliate = await prisma.affiliate.findUnique({
          where: { externalId: otgAffiliate.id },
        });

        if (!existingAffiliate) {
          // Criar usuário para o afiliado se não existir
          const bcrypt = await import('bcryptjs');
          const hashedPassword = await bcrypt.default.hash('temp_password_' + otgAffiliate.id, 10);
          
          const user = await prisma.user.create({
            data: {
              email: `affiliate_${otgAffiliate.id}@otg.local`,
              password: hashedPassword,
              name: otgAffiliate.name,
              role: 'AFFILIATE',
            },
          });

          // Criar afiliado
          const affiliate = await prisma.affiliate.create({
            data: {
              externalId: otgAffiliate.id,
              name: otgAffiliate.name,
              siteIds: otgAffiliate.siteIds,
              userId: user.id,
            },
          });

          // Atualizar user com affiliateId (usando o ID do affiliate criado)
          await prisma.user.update({
            where: { id: user.id },
            data: { affiliateId: affiliate.id },
          });

          console.log(`✅ Afiliado criado: ${otgAffiliate.name}`);
        } else {
          // Atualizar dados do afiliado existente
          await prisma.affiliate.update({
            where: { externalId: otgAffiliate.id },
            data: {
              name: otgAffiliate.name,
              siteIds: otgAffiliate.siteIds,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error syncing affiliates:', error);
      throw error;
    }
  }

  async syncResults(): Promise<void> {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ OTG_API_KEY não configurada. Pulando sincronização de resultados.');
        return;
      }

      // Buscar resultados dos últimos 30 dias
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log(`🔄 Sincronizando resultados de ${startDateStr} até ${endDateStr}`);

      let page = 1;
      const limit = 50;
      let hasMore = true;
      let totalProcessed = 0;

      const cpaValue = parseFloat(await getSystemConfig('CPA_VALUE', '300'));
      const revSharePercentage = parseFloat(await getSystemConfig('REVENUE_SHARE_PERCENTAGE', '25'));

      while (hasMore) {
        console.log(`📄 Processando página ${page}...`);
        
        const response = await this.fetchResults(startDateStr, endDateStr, undefined, undefined, page, limit);
        
        // Verificar se há dados
        const results = response.data || [];
        if (!results || results.length === 0) {
          console.log('ℹ️ Nenhum resultado encontrado nesta página');
          break;
        }

        for (const result of results) {
          totalProcessed++;
          // Encontrar ou criar afiliado
          let affiliate = await prisma.affiliate.findUnique({
            where: { externalId: result.affiliateId },
          });

          if (!affiliate) {
            // Se o afiliado não existir, criar primeiro
            await this.syncAffiliates();
            affiliate = await prisma.affiliate.findUnique({
              where: { externalId: result.affiliateId },
            });
          }

          if (!affiliate) {
            console.warn(`Afiliado não encontrado: ${result.affiliateId}`);
            continue;
          }

          const resultDate = new Date(result.date);
          const startOfDay = new Date(resultDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(resultDate);
          endOfDay.setHours(23, 59, 59, 999);

          // Processar FTDs (First Time Deposits)
          for (let i = 0; i < result.first_deposits; i++) {
            // Verificar se já existe FTD para evitar duplicatas
            const existingFTD = await prisma.fTD.findFirst({
              where: {
                affiliateId: affiliate!.id,
                date: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            });

            if (!existingFTD) {
              // Criar player temporário se necessário
              let player = await prisma.player.findFirst({
                where: { affiliateId: affiliate!.id },
              });

              if (!player) {
                player = await prisma.player.create({
                  data: {
                    affiliateId: affiliate!.id,
                    externalId: `player_${affiliate!.id}_${Date.now()}`,
                  },
                });
              }

              // Criar FTD
              const ftd = await prisma.fTD.create({
                data: {
                  affiliateId: affiliate!.id,
                  playerId: player.id,
                  amount: 0, // Valor pode ser atualizado depois
                  date: resultDate,
                },
              });

              // Criar comissão CPA se qualificado
              if (result.qualified_cpa > 0) {
                // Buscar deal do afiliado para usar o valor correto
                const affiliateWithDeal = await prisma.affiliate.findUnique({
                  where: { id: affiliate!.id },
                  include: { deal: true },
                });

                const affiliateCpaValue = affiliateWithDeal?.deal && affiliateWithDeal.deal.active
                  ? Number(affiliateWithDeal.deal.cpaValue)
                  : cpaValue;

                await prisma.commission.create({
                  data: {
                    affiliateId: affiliate!.id,
                    ftdId: ftd.id,
                    amount: affiliateCpaValue,
                    type: 'CPA',
                    date: resultDate,
                  },
                });

                // Criar transação
                await prisma.transaction.create({
                  data: {
                    affiliateId: affiliate!.id,
                    playerId: player.id,
                    amount: affiliateCpaValue,
                    type: 'CPA',
                    status: 'APPROVED',
                    date: resultDate,
                    description: `CPA - ${result.campaignName}`,
                  },
                });
              }
            }
          }

          // Processar Revenue Share
          // O campo 'rvs' indica se há revenue share, mas o valor vem de 'lucro_tipster'
          if (result.rvs > 0 || result.lucro_tipster > 0) {
            // Buscar deal do afiliado para usar a porcentagem correta
            const affiliateWithDeal = await prisma.affiliate.findUnique({
              where: { id: affiliate!.id },
              include: { deal: true },
            });

            const affiliateRevSharePercentage = affiliateWithDeal?.deal && affiliateWithDeal.deal.active
              ? Number(affiliateWithDeal.deal.revSharePercentage)
              : revSharePercentage;

            // O lucro_tipster já vem da API como o valor base para cálculo
            const revenue = result.lucro_tipster || 0;
            // Calcula a comissão baseada na porcentagem do deal ou padrão
            const commission = (revenue * affiliateRevSharePercentage) / 100;

            // Verificar se já existe relatório para evitar duplicatas
            const existingReport = await prisma.revShareReport.findFirst({
              where: {
                affiliateId: affiliate!.id,
                date: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
                campaignId: result.campaignName || null,
              },
            });

            if (!existingReport && commission > 0) {
              await prisma.revShareReport.create({
                data: {
                  affiliateId: affiliate!.id,
                  date: resultDate,
                  revenue,
                  percentage: affiliateRevSharePercentage,
                  commission,
                  campaignId: result.campaignName || null,
                },
              });

              // Criar transação
              await prisma.transaction.create({
                data: {
                  affiliateId: affiliate!.id,
                  amount: commission,
                  type: 'REVENUE_SHARE',
                  status: 'APPROVED',
                  date: resultDate,
                  description: `Revenue Share - ${result.campaignName || 'N/A'}`,
                },
              });

              console.log(`💰 Revenue Share criado: ${commission.toFixed(2)} (${affiliateRevSharePercentage}% de ${revenue.toFixed(2)})`);
            }
          }
        }

        // Verificar se há mais páginas
        if (response.meta) {
          hasMore = page < response.meta.totalPages;
          page++;
          console.log(`📊 Progresso: ${page - 1}/${response.meta.totalPages} páginas processadas`);
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Resultados sincronizados com sucesso. Total processado: ${totalProcessed} registros`);
    } catch (error) {
      console.error('Error syncing results:', error);
      throw error;
    }
  }
}

export const otgAdapter = new OTGAdapter();
