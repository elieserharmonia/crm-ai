
import { GoogleGenAI, Modality } from "@google/genai";
import { ForecastRow, SalesPersonProfile, User } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

export const geminiService = {
  async generateManagerAdvice(forecast: ForecastRow[], profile: SalesPersonProfile) {
    try {
      const ai = getAI();
      const context = `
        Persona: Strategic Sales Manager with 20+ years experience.
        Current Data: ${forecast.length} opportunities.
        Main Customers: ${Array.from(new Set(forecast.map(r => r.CUSTOMER))).slice(0, 5).join(', ')}.
      `;

      const prompt = `Analyze the data and suggest personalized sales approaches for these customers.`;

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
          .map((c: any) => `\n- [${c.web.title || 'View Source'}](${c.web.uri})`)
          .join('');
        if (links) text += `\n\n### Research References:\n${links}`;
      }
      return text;
    } catch (e) {
      console.error("Gemini Advice Error:", e);
      return "Não foi possível gerar conselhos no momento.";
    }
  },

  async generateVisitReport(row: ForecastRow, profile: SalesPersonProfile) {
    try {
      const ai = getAI();
      const prompt = `Generate a technical visit report for ${row.CUSTOMER}. Opportunity details: ${row.DESCRIPTION}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      return "Erro ao gerar relatório.";
    }
  },

  async generateWelcomeEmail(user: User) {
    try {
      const ai = getAI();
      const prompt = `Draft a welcome email for the new consultant ${user.name}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      return "Bem-vindo ao CRM-IA!";
    }
  },

  async planVisitsWithMaps(forecast: ForecastRow[], location?: { latitude: number; longitude: number }) {
    try {
      const ai = getAI();
      const context = `Active opportunities: ${forecast.map(f => `${f.CUSTOMER} in ${f.UF}`).join(', ')}.`;
      const prompt = `Plan the best visit route for these customers based on their locations.`;

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
          .map((c: any) => `\n- [${c.maps.title || 'Locate on Map'}](${c.maps.uri})`)
          .join('');
        if (links) text += `\n\n### Found Locations:\n${links}`;
      }
      return text;
    } catch (e) {
      return "Erro ao planejar rotas.";
    }
  }
};
