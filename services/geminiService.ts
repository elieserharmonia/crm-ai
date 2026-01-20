
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

  // Generates strategic analysis for the sales manager based on forecast data
  async generateManagerAdvice(data: ForecastRow[], profile: SalesPersonProfile): Promise<string> {
    const ai = getAI();
    // Prepare data summary to focus on key info
    const dataSummary = data.map(r => ({
      cliente: r.CUSTOMER,
      fornecedor: r.SUPPLIER,
      descricao: r.DESCRIPTION,
      valor: r.AMOUNT,
      confianca: r.Confidence,
      followUp: r['FOLLOW-UP']
    }));

    const prompt = `Você é um Gerente Estratégico de Vendas de alto nível.
Analise o pipeline de vendas de ${profile.name} para 2026.

Dados do Forecast:
${JSON.stringify(dataSummary).substring(0, 20000)}

Forneça um plano de ação estratégico detalhado em Português (Brasil) contendo:
1. **Visão Executiva**: Análise resumida da saúde geral do pipeline.
2. **Top 3 Oportunidades**: Quais negócios devem ser prioridade máxima agora (baseado em valor e confiança).
3. **Estratégias de Follow-up**: Como destravar negociações com confiança média (30-50%).
4. **Foco em Resultados**: Orientações para garantir que as metas de 2026 sejam batidas.

Responda em Markdown, com tom profissional, direto e encorajador.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // High-quality reasoning for complex tasks
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          topP: 0.9,
        }
      });
      return response.text || "Desculpe, não consegui processar a análise estratégica agora.";
    } catch (e: any) {
      console.error("Gemini Manager Advice Error:", e);
      if (e.message?.includes('Requested entity was not found')) {
        throw new Error("Sua sessão de API expirou ou é inválida. Por favor, selecione a chave novamente.");
      }
      throw new Error("Erro ao gerar análise estratégica. Verifique sua conexão.");
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
