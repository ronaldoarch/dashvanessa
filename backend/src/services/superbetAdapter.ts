import axios, { AxiosInstance } from 'axios';

interface SuperbetConfig {
  apiKey: string;
  baseURL: string;
}

interface SuperbetRegisterRequest {
  email: string;
  name: string;
  phone?: string;
  company?: string;
}

interface SuperbetRegisterResponse {
  requestId: string;
  status: 'pending' | 'approved' | 'rejected';
  affiliateLink?: string;
  affiliateId?: string;
}

class SuperbetAdapter {
  private api: AxiosInstance;
  private apiKey: string;

  constructor(config: SuperbetConfig) {
    this.apiKey = config.apiKey;
    this.api = axios.create({
      baseURL: config.baseURL,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Interceptores para logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`📡 Superbet API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Superbet API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ Superbet API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ Superbet API Error: ${error.response?.status} ${error.config?.url}`);
        if (error.response?.data) {
          console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Registra um novo afiliado na Superbet
   */
  async registerAffiliate(data: SuperbetRegisterRequest): Promise<SuperbetRegisterResponse> {
    try {
      const response = await this.api.post<SuperbetRegisterResponse>('/affiliates/register', {
        email: data.email,
        name: data.name,
        phone: data.phone,
        company: data.company,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Chave de API da Superbet inválida ou expirada');
      }
      if (error.response?.status === 400) {
        throw new Error(`Erro na requisição: ${error.response.data.message || 'Dados inválidos'}`);
      }
      console.error('Error registering affiliate:', error.message);
      throw new Error(`Erro ao registrar afiliado na Superbet: ${error.message}`);
    }
  }

  /**
   * Verifica o status de uma requisição de cadastro
   */
  async checkRequestStatus(requestId: string): Promise<SuperbetRegisterResponse> {
    try {
      const response = await this.api.get<SuperbetRegisterResponse>(`/affiliates/requests/${requestId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Requisição não encontrada');
      }
      console.error('Error checking request status:', error.message);
      throw new Error(`Erro ao verificar status: ${error.message}`);
    }
  }

  /**
   * Webhook para receber notificações de aprovação da Superbet
   * (Este método será chamado quando a Superbet aprovar um afiliado)
   */
  async handleApprovalWebhook(data: {
    requestId: string;
    affiliateId: string;
    affiliateLink: string;
    status: 'approved' | 'rejected';
  }): Promise<void> {
    // Este método será implementado para processar webhooks da Superbet
    // Por enquanto, apenas valida os dados
    if (!data.requestId || !data.affiliateId || !data.affiliateLink) {
      throw new Error('Dados do webhook inválidos');
    }
  }
}

export default SuperbetAdapter;
export type { SuperbetRegisterRequest, SuperbetRegisterResponse };
