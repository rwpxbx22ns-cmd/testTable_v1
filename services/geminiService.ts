
import { GoogleGenAI, Type } from "@google/genai";
import { DataRow } from "../types";

export const getAIAnalysis = async (data: DataRow[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `請分析以下表格數據，包含成員的姓名、職位、績效與「薪資」。
  請以「繁體中文」提供 3 個關鍵洞察（例如：薪資與績效的投報率、預算分配建議或薪資異常值）。
  數據內容：${JSON.stringify(data)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { 
                type: Type.STRING,
                description: "其一：'info', 'warning', 或 'success'"
              },
            },
            required: ["title", "description", "type"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const generateMoreRows = async (existingData: DataRow[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `請根據現有架構生成 3 筆全新的「中文」模擬數據。
  包含薪資欄位（數值約為 40000 到 120000 之間）。
  確保 ID 是唯一且遞增的（從 ${existingData.length + 1} 開始）。
  現有數據範例：${JSON.stringify(existingData[0])}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              role: { type: Type.STRING },
              status: { type: Type.STRING },
              lastActive: { type: Type.STRING },
              performance: { type: Type.NUMBER },
              salary: { type: Type.NUMBER },
            },
            required: ["id", "name", "email", "role", "status", "lastActive", "performance", "salary"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};
