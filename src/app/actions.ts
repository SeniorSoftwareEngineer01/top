'use server';

import { analyzeWhatsappChat, type AnalyzeWhatsappChatInput } from "@/ai/flows/analyze-whatsapp-chat";
import { textToSpeech as ttsFlow, type TextToSpeechInput, type TextToSpeechOutput } from "@/ai/flows/text-to-speech";

export async function getAiResponse(input: AnalyzeWhatsappChatInput): Promise<string> {
  try {
    const result = await analyzeWhatsappChat(input);
    return result.answer;
  } catch (error) {
    console.error("Error in getAiResponse:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
}


export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
      const result = await ttsFlow(input);
      return result;
    } catch (error) {
        console.error("Error in textToSpeech action:", error);
        throw new Error("Failed to convert text to speech.");
    }
}
