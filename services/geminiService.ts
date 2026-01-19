
import { GoogleGenAI, Type } from "@google/genai";
import { ForecastRow, SalesPersonProfile, User } from "../types";

export const geminiService = {
  // Analisa o pipeline e usa Google Search para contexto externo
  async generateManagerAdvice(forecast: ForecastRow[], profile: SalesPersonProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = `
      Persona: Gerente de Vendas com mais de 20 anos de experiência.
      Dados Atuais: ${forecast.length} oportunidades.
      Empresas Principais: ${Array.from(new Set(forecast.map(r => r.CUSTOMER))).slice(0, 5).join(', ')}.
    `;

    const prompt = `
      Analise os dados e use a pesquisa do Google para encontrar notícias recentes sobre estas empresas.
      Sugerir abordagens de vendas personalizadas.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context + prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || '';
    
    // Extrai URLs do Grounding de Pesquisa conforme as diretrizes
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const links = chunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => `\n- [${c.web.title || 'Ver Fonte'}](${c.web.uri})`)
        .join('');
      if (links) {
        text += `\n\n### Referências de Pesquisa:\n${links}`;
      }
    }

    return text;
  },

  // Gera um relatório de visita técnico para uma oportunidade específica
  async generateVisitReport(row: ForecastRow, profile: SalesPersonProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Crie um relatório de visita técnico para ${row.CUSTOMER}. Oportunidade: ${row.DESCRIPTION}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  },

  // Gera rascunho de e-mail de boas-vindas para novos consultores
  async generateWelcomeEmail(user: User) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `E-mail de boas-vindas para o novo consultor ${user.name}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  },

  // Planeja visitas usando a ferramenta Google Maps Grounding
  // Correção para o erro no MapTab.tsx: Adicionando o método planVisitsWithMaps
  async planVisitsWithMaps(forecast: ForecastRow[], location?: { latitude: number; longitude: number }) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = `Oportunidades em aberto: ${forecast.map(f => `${f.CUSTOMER} em ${f.UF}`).join(', ')}.`;
    const prompt = `Como um especialista em logística, analise a localização dos clientes e planeje o melhor roteiro de visitas. Use o Google Maps para validar endereços e clusters geográficos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest', // Mapas são suportados na série 2.5
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
    
    // Extrai URLs do Grounding de Mapas conforme as diretrizes
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const links = chunks
        .filter((c: any) => c.maps?.uri)
        .map((c: any) => `\n- [${c.maps.title || 'Localizar no Mapa'}](${c.maps.uri})`)
        .join('');
      if (links) {
        text += `\n\n### Destinos Encontrados:\n${links}`;
      }
    }

    return text;
  }
};
