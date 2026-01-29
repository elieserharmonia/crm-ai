import { GoogleGenAI } from "@google/genai";
import { ForecastRow, SalesPersonProfile, User } from "../types";

/**
 * Inicializa o cliente GoogleGenAI.
 * A chave de API é gerenciada externamente via process.env.API_KEY.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Chave de API não configurada.");
  }
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  // Gera um e-mail de boas-vindas simples para novos usuários
  async generateWelcomeEmail(user: User) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        // Fix: Use simple string for text prompt as per guidelines
        contents: `Escreva um e-mail de boas-vindas curto para o vendedor ${user.name} que acabou de entrar no CRM.`,
      });
      return response.text;
    } catch (e) {
      return `Bem-vindo ao CRM-IA, ${user.name}!`;
    }
  },

  // Analisa os dados do forecast e gera conselhos estratégicos de gestão
  async generateManagerAdvice(data: ForecastRow[], profile: SalesPersonProfile) {
    const ai = getAI();
    // Prepara um prompt detalhado com os dados do pipeline para análise estratégica
    const prompt = `
      Você é um Gerente Estratégico de Vendas experiente e mentor de negócios.
      Analise o seguinte pipeline de vendas (Forecast) para o ano de 2026 e forneça um plano de ação detalhado para o vendedor ${profile.name}.
      
      Dados do Pipeline:
      ${JSON.stringify(data.map(r => ({
        cliente: r.CUSTOMER,
        fornecedor: r.SUPPLIER,
        descricao: r.DESCRIPTION,
        valor: r.AMOUNT,
        confianca: r.Confidence,
        followUp: r['FOLLOW-UP']
      })), null, 2)}
      
      Por favor, identifique e apresente em Markdown:
      1. **Prioridades Imediatas**: As 3 oportunidades com maior potencial de fechamento rápido.
      2. **Análise de Risco**: Riscos identificados em contas de alto valor (ex: falta de follow-up).
      3. **Sugestões Táticas**: Próximos passos específicos para melhorar a taxa de conversão.
      4. **Mensagem de Liderança**: Uma nota motivacional curta e direta.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        // Fix: Use simple string for text prompt as per guidelines
        contents: prompt,
      });
      return response.text || "Não foi possível gerar os conselhos estratégicos no momento.";
    } catch (e: any) {
      console.error("Gemini Manager Advice Error:", e);
      throw e;
    }
  },

  // Planejamento logístico via Maps (Mantido para a aba de Mapas se ativa)
  async planVisitsWithMaps(forecast: ForecastRow[], location?: { latitude: number; longitude: number }) {
    const ai = getAI();
    const companies = [...new Set(forecast.map(r => r.CUSTOMER))].filter(Boolean).join(', ');
    const prompt = `Planeje um roteiro de visitas otimizado para: ${companies}.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        // Fix: Use simple string for text prompt as per guidelines
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          ...(location && {
            toolConfig: {
              retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } }
            }
          })
        },
      });

      let text = response.text || "Não foi possível gerar o roteiro.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && groundingChunks.length > 0) {
        const links = groundingChunks
          .filter((chunk: any) => chunk.maps && chunk.maps.uri)
          .map((chunk: any) => `- [${chunk.maps.title || 'Ver Localização'}](${chunk.maps.uri})`)
          .join('\n');
        if (links) text += "\n\n### Referências:\n" + links;
      }
      return text;
    } catch (e: any) {
      console.error("Gemini Maps Error:", e);
      throw e;
    }
  }
};