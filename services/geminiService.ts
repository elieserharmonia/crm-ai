
import { GoogleGenAI, Modality } from "@google/genai";
import { ForecastRow, SalesPersonProfile, User } from "../types";

/**
 * Initializes the GoogleGenAI client using the provided environment variable.
 * The API key is managed externally and provided via process.env.API_KEY.
 * We create a fresh instance per call to ensure we use the updated key from the selector dialog.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Chave de API não configurada. Por favor, utilize o botão de configuração no painel.");
  }
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  // Generates strategic advice for sales managers based on current forecast data
  async generateManagerAdvice(forecast: ForecastRow[], profile: SalesPersonProfile) {
    const ai = getAI();
    
    // Summary of data for context
    const topOpportunities = [...forecast]
      .sort((a, b) => b.AMOUNT - a.AMOUNT)
      .slice(0, 15)
      .map(r => `- ${r.CUSTOMER}: R$ ${r.AMOUNT} (${r.Confidence}% conf.)`)
      .join('\n');

    const context = `
      Persona: Você é o Gerente Estratégico de Vendas (AI Sales Manager).
      Especialista sendo aconselhado: ${profile.name || 'Consultor'}.
      Setor de Atuação: Indústria Automotiva e Linha Amarela.
      Dados do Pipeline Atual (Principais Oportunidades):
      ${topOpportunities}
      Total de Oportunidades: ${forecast.length}.
    `;

    const prompt = `
      Como Gerente IA, forneça um plano de ação estratégico. 
      Analise o volume financeiro vs confiança. 
      Sugira 3 ações imediatas para fechar os negócios acima de 80% e como recuperar os negócios 'sonho' (abaixo de 30%).
      Seja direto, profissional e motivador.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // High-quality reasoning model
        contents: [{ parts: [{ text: context + prompt }] }],
      });

      return response.text || "A IA não retornou um conteúdo válido.";
    } catch (e: any) {
      console.error("Gemini Advice Error:", e);
      throw e;
    }
  },

  // Generates a technical visit report for a specific customer/opportunity
  async generateVisitReport(row: ForecastRow, profile: SalesPersonProfile) {
    const ai = getAI();
    const prompt = `Gere um relatório de visita técnica para o cliente ${row.CUSTOMER}. Oportunidade: ${row.DESCRIPTION}. Consultor: ${profile.name}.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });
      return response.text;
    } catch (e: any) {
      console.error("Gemini Report Error:", e);
      throw e;
    }
  },

  // Generates a welcome email for newly registered users
  async generateWelcomeEmail(user: User) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Escreva um e-mail de boas-vindas para ${user.name}.` }] }],
      });
      return response.text;
    } catch (e) {
      return `Bem-vindo ao CRM-IA!`;
    }
  },

  // Implemented planVisitsWithMaps method required by MapTab.tsx
  // Uses Google Maps grounding which is exclusive to Gemini 2.5 series models.
  async planVisitsWithMaps(forecast: ForecastRow[], location?: { latitude: number; longitude: number }) {
    const ai = getAI();
    const companies = [...new Set(forecast.map(r => r.CUSTOMER))].filter(Boolean).join(', ');
    const prompt = `Planeje um roteiro de visitas logístico otimizado para as seguintes empresas: ${companies}. Considere a melhor rota saindo da minha localização atual se disponível.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Required model for Maps Grounding
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleMaps: {} }],
          ...(location && {
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              }
            }
          })
        },
      });

      let text = response.text || "Não foi possível gerar o roteiro logístico.";
      
      // Mandatory: Extract and display URLs from groundingChunks when using Google Maps tool
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && groundingChunks.length > 0) {
        const links = groundingChunks
          .filter((chunk: any) => chunk.maps && chunk.maps.uri)
          .map((chunk: any) => `- [${chunk.maps.title || 'Ver Localização'}](${chunk.maps.uri})`)
          .join('\n');
          
        if (links) {
          text += "\n\n### Referências do Google Maps:\n" + links;
        }
      }
      
      return text;
    } catch (e: any) {
      console.error("Gemini Maps Grounding Error:", e);
      throw e;
    }
  }
};
