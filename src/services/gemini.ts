import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface NewsStory {
  title: string;
  summary: string;
  location: string;
  category: string;
}

export async function fetchDailyNews(): Promise<NewsStory[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide a list of the top 5 international news stories for today. For each story, include a title, a concise summary (max 60 words), a specific location (city/country), and a category.",
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            location: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["title", "summary", "location", "category"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse news:", e);
    return [];
  }
}

export async function generateSpeech(text: string): Promise<string | null> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this news summary clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
}

export async function analyzeNewsImage(base64Data: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Analyze this image in the context of international news. What is happening, and why is it significant?" },
      ],
    },
  });

  return response.text || "Could not analyze image.";
}

export async function getNewsLocationInfo(location: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Tell me about the current situation or significance of ${location} in international news.`,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
  };
}
