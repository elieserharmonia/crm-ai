
import { GoogleGenAI, Type } from "@google/genai";
import { ForecastRow, SalesPersonProfile, User } from "../types";

export const geminiService = {
  async generateManagerAdvice(forecast: ForecastRow[], profile: SalesPersonProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = `
      Persona: Gerente de Vendas com mais de 20 anos de experiência. Especialista em fabricantes automotivos e linha amarela.
      Dados Atuais: ${forecast.length} oportunidades.
      Principais Clientes: ${Array.from(new Set(forecast.map(r => r.CUSTOMER))).slice(0, 5).join(', ')}.
    `;

    const prompt = `
      Use a pesquisa do Google para encontrar notícias recentes e tendências sobre as empresas listadas.
      Com base nessas notícias e nos meus dados de forecast:
      1. Crie um resumo de inteligência de mercado (o que está acontecendo no setor agora).
      2. Priorize 3 abordagens de vendas usando os fatos novos encontrados.
      3. Forneça rascunhos de mensagens que citem essas notícias recentes.
      
      Importante: Liste as URLs das notícias consultadas ao final.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context + prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let text = response.text || "";
    
    if (groundingChunks.length > 0) {
      text += "\n\n### Fontes de Pesquisa:\n";
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) text += `- [${chunk.web.title}](${chunk.web.uri})\n`;
      });
    }

    return text;
  },

  async planVisitsWithMaps(forecast: ForecastRow[], latLng?: { latitude: number, longitude: number }) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = `
      Lista de Clientes e UF: ${forecast.map(r => `${r.CUSTOMER} (${r.UF})`).join(', ')}.
    `;

    const prompt = `
      Aja como um assistente de logística de vendas. 
      Com base na localização do usuário e na lista de clientes, sugira um roteiro de visitas otimizado.
      Use o Google Maps para localizar as sedes dessas empresas e fornecer os links de navegação.
      Agrupe por proximidade regional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context + prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: latLng || { latitude: -23.5505, longitude: -46.6333 }
          }
        }
      },
    });

    let text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    if (groundingChunks.length > 0) {
      text += "\n\n### Localizações e Rotas Encontradas:\n";
      groundingChunks.forEach((chunk: any) => {
        if (chunk.maps) text += `- [Abrir no Maps: ${chunk.maps.title || 'Ver Local'}](${chunk.maps.uri})\n`;
      });
    }

    return text;
  },

  async generateVisitReport(row: ForecastRow, profile: SalesPersonProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Crie um RELATÓRIO DE VISITA profissional para o cliente ${row.CUSTOMER}.
      Oportunidade: ${row.DESCRIPTION}. Fornecedor: ${row.SUPPLIER}.
      Consultor: ${profile.name}.
      Use fatos reais sobre a empresa se possível usando pesquisa.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    return response.text;
  },

  async generateWelcomeEmail(user: User) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `E-mail de boas-vindas para ${user.name} no CRM-IA.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  }
};
