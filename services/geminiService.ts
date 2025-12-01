import { GoogleGenAI, Type } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key is missing!");
      throw new Error("API Key is missing. Please check your environment configuration.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

export interface AIProjectSuggestion {
  description: string;
  suggestedTasks: string[];
}

export const generateProjectPlan = async (projectName: string, goal: string): Promise<AIProjectSuggestion> => {
  try {
    const ai = getGenAI();
    const prompt = `
      I am planning a new project named "${projectName}".
      The main goal is: "${goal}".
      
      Please generate a professional project description and a list of 5-7 high-level initial tasks to get started.
      Return the result in JSON format with "description" and "suggestedTasks" fields.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            suggestedTasks: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIProjectSuggestion;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};