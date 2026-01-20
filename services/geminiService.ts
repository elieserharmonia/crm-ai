
import { GoogleGenAI, Modality } from "@google/genai";
import { ForecastRow, SalesPersonProfile, User } from "../types";

/**
 * Helper seguro para obter a chave de API.
 * Em alguns ambientes, process.env pode não estar definido globalmente.
 */
const getApiKey = (): string => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : "";
  } catch (e) {
    return "";
  }
};

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("CRM-IA: API Key não detectada. As funções de IA podem não responder.");
  }
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  async generateManagerAdvice(forecast: ForecastRow[], profile: SalesPersonProfile) {
    try {
      const ai = getAI();
      const context = `
        Persona: Gerente de Vendas Estratégico com 20 anos de experiência em Indústria e Montadoras.
        Usuário: ${profile.name || 'Consultor'}.
        Dados Atuais: ${forecast.length} oportunidades no pipeline.
        Principais Clientes: ${Array.from(new Set(forecast.map(r => r.CUSTOMER))).slice(0, 5).join(', ')}.
      `;

      const prompt = `Analise os dados fornecidos e sugira abordagens de vendas personalizadas, focando em como aumentar a confiança (Confidence) nos negócios com menor percentual.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: context + prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      let text = response.text || '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const links = chunks
          .filter((c: any) => c.web?.uri)
          .map((c: any) => `\n- [${c.web.title || 'Ver Fonte'}](${c.web.uri})`)
          .join('');
        if (links) text += `\n\n### Referências de Pesquisa:\n${links}`;
      }
      return text;
    } catch (e) {
      console.error("Gemini Advice Error:", e);
      throw new Error("Falha na comunicação com o cérebro da IA.");
    }
  },

  async generateVisitReport(row: ForecastRow, profile: SalesPersonProfile) {
    try {
      const ai = getAI();
      const prompt = `Como Consultor de Vendas ${profile.name}, gere um relatório de visita técnica/comercial estruturado para o cliente ${row.CUSTOMER}. 
      Contexto do Negócio: ${row.DESCRIPTION}. 
      Valor da Oportunidade: R$ ${row.AMOUNT}. 
      Status Atual: ${row.Confidence}% de confiança.
      Inclua: 1. Objetivo da Visita, 2. Pontos Discutidos, 3. Próximos Passos (Next Steps).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      console.error("Gemini Report Error:", e);
      throw new Error("Não foi possível gerar a análise detalhada agora.");
    }
  },

  async generateWelcomeEmail(user: User) {
    try {
      const ai = getAI();
      const prompt = `Escreva um e-mail de boas-vindas motivacional para o novo consultor ${user.name} que acaba de entrar na plataforma CRM-IA.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      return `Bem-vindo ao CRM-IA, ${user.name}! Estamos prontos para acelerar suas vendas.`;
    }
  },

  async planVisitsWithMaps(forecast: ForecastRow[], location?: { latitude: number; longitude: number }) {
    try {
      const ai = getAI();
      const context = `Oportunidades ativas: ${forecast.map(f => `${f.CUSTOMER} em ${f.UF}`).join(', ')}.`;
      const prompt = `Planeje a melhor rota de visitas para esses clientes, considerando que as montadoras ficam em pólos industriais específicos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: context + prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: location ? {
            retrievalConfig: {
              latLng: {
                latitude: location.latitude,
                longitude: location.longitude
              }
            }
          } : undefined
        }
      });

      let text = response.text || '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const links = chunks
          .filter((c: any) => c.maps?.uri)
          .map((c: any) => `\n- [${c.maps.title || 'Ver no Mapa'}](${c.maps.uri})`)
          .join('');
        if (links) text += `\n\n### Locais Encontrados:\n${links}`;
      }
      return text;
    } catch (e) {
      console.error("Gemini Maps Error:", e);
      throw new Error("Erro ao planejar rotas geográficas.");
    }
  }
};
