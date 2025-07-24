'use server';

import { analyzeWhatsappChat } from "@/ai/flows/analyze-whatsapp-chat";

export async function getAiResponse(chatLog: string, query: string): Promise<string> {
  try {
    const result = await analyzeWhatsappChat({ chatLog, query });
    return result.answer;
  } catch (error) {
    console.error("Error in getAiResponse:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
}
