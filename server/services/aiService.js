const { GoogleGenAI, Type } = require("@google/genai");
const config = require('../config');

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = config.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing. Please check your environment configuration.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

exports.suggestTaskPlan = async (tasks) => {
  try {
    const ai = getGenAI();
    
    // Create a simplified representation of tasks for the prompt
    const taskDescriptions = tasks.map(t => 
      `ID: ${t.id}, Name: ${t.name}, Current Status: ${t.status}, Project: ${t.job?.project?.name || 'Unknown'}`
    ).join('\n');

    const prompt = `
      I have the following list of tasks available for my team today:
      ${taskDescriptions}

      Please suggest a daily plan for an 8-hour workday. 
      Allocated hours should sum up to approximately 8 hours. 
      Return the result as a JSON array of objects, where each object has "id" (matching the task ID) and "allocatedHours" (number).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              allocatedHours: { type: Type.NUMBER }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};