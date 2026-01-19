
import { GoogleGenAI, Type } from "@google/genai";
import { ForecastRow, SalesPersonProfile, User } from "../types";

export const geminiService = {
  async generateManagerAdvice(forecast: ForecastRow[], profile: SalesPersonProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = `
      Persona: Strategic Sales Manager with 20+ years experience.
      Current Data: ${forecast.length} opportunities.
      Main Customers: ${Array.from(new Set(forecast.map(r => r.CUSTOMER))).slice(0, 5).join(', ')}.
    `;

    const prompt = `
      Analyze the data and suggest personalized sales approaches for these customers.
    `;

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
      if (links) {
        text += `\n\n### Research References:\n${links}`;
      }
    }

    return text;
  },

  async generateVisitReport(row: ForecastRow, profile: SalesPersonProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a technical visit report for ${row.CUSTOMER}. Opportunity details: ${row.DESCRIPTION}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  },

  async generateWelcomeEmail(user: User) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Draft a welcome email for the new consultant ${user.name}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  },

  async planVisitsWithMaps(forecast: ForecastRow[], location?: { latitude: number; longitude: number }) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
      if (links) {
        text += `\n\n### Found Locations:\n${links}`;
      }
    }

    return text;
  }
};
