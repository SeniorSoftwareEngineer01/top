'use server';

import { analyzeWhatsappChat, type AnalyzeWhatsappChatInput, type AnalyzeWhatsappChatOutput } from "@/ai/flows/analyze-whatsapp-chat";
import { textToSpeech as ttsFlow, type TextToSpeechInput, type TextToSpeechOutput } from "@/ai/flows/text-to-speech";
import { transcribeAudio as transcribeAudioFlow, type TranscribeAudioInput, type TranscribeAudioOutput } from "@/ai/flows/transcribe-audio";
import type { ParsedMessage } from "@/lib/parser";


export async function getAiResponse(input: AnalyzeWhatsappChatInput): Promise<AnalyzeWhatsappChatOutput> {
    try {
        const result = await analyzeWhatsappChat(input);
        return result;
    } catch (error) {
        console.error("Error in getAiResponse:", error);
        // Provide a more specific error message if the API key is likely invalid
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
            throw new Error("Your API key is not valid. Please check it and try again. You can set a new key by typing `.key`.");
        }
        throw new Error("Failed to get a response from the AI model.");
    }
}

export async function getContextualAiResponse(message: ParsedMessage, mediaDataUri: string | null, query: string, language: string, apiKey: string): Promise<AnalyzeWhatsappChatOutput> {
    try {
        let chatLog = `An user has selected a specific message from a WhatsApp chat to discuss.\n\n`;
        chatLog += `Message Author: ${message.author}\n`;
        chatLog += `Message Timestamp: ${message.timestamp}\n`;
        
        const input: AnalyzeWhatsappChatInput = {
            chatLog: chatLog,
            query: query,
            images: [],
            language: language,
            apiKey: apiKey,
        };

        if (message.type === 'text' && message.content) {
            input.chatLog += `Message Content: "${message.content}"\n\n`;
        }
        if (message.type === 'image' && message.fileName && mediaDataUri) {
            input.chatLog += `The user has selected an image named "${message.fileName}". The image is provided below.\n\n`;
            input.images!.push({ fileName: message.fileName, dataUri: mediaDataUri });
        }
        if (message.type === 'audio' && message.fileName && mediaDataUri) {
             input.audioDataUri = mediaDataUri;
             input.query = `The user has selected a specific audio message. Analyze it in the context of this query: "${query}"`;
        }
        if (message.type === 'video' && message.fileName) {
            input.chatLog += `The user has selected a video file named "${message.fileName}". Analysis of video content is not yet supported, but you can comment on the context if available.\n\n`;
        }
        if (message.type === 'file' && message.fileName) {
            input.chatLog += `The user has selected a file named "${message.fileName}". Analysis of file content is not yet supported, but you can comment on the context if available.\n\n`;
        }

        const result = await analyzeWhatsappChat(input);
        return result;

    } catch (error) {
        console.error("Error in getContextualAiResponse:", error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
             throw new Error("Your API key is not valid. Please check it and try again. You can set a new key by typing `.key`.");
        }
        if ((error as Error).message.includes('transcribe')) {
             return { answer: (error as Error).message };
        }
        return { answer: "I'm sorry, but an unexpected error occurred while analyzing the message. Please try again." };
    }
}


export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
      const result = await ttsFlow(input);
      return result;
    } catch (error) {
        console.error("Error in textToSpeech action:", error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
             throw new Error("Your API key is not valid. Please check it and try again.");
        }
        throw new Error("Failed to convert text to speech.");
    }
}

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
     try {
        const { transcription } = await transcribeAudioFlow(input);
        if (!transcription || transcription.trim() === '') {
             throw new Error("Transcription result was empty.");
        }
        return { transcription };
    } catch (error) {
        console.error("Error in transcribeAudio action:", error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
             throw new Error("Your API key is not valid. Please check it and try again.");
        }
        throw new Error("I'm sorry, but I was unable to transcribe the selected audio message. Please try another message.");
    }
}


export async function testApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    try {
        // We use a simple, low-cost text-only generation to test the key.
        const testFlow = (await import('@/ai/flows/test-api-key')).testApiKeyFlow;
        await testFlow({ apiKey });
        return { valid: true, message: 'API Key is valid and working correctly.' };
    } catch (error) {
        console.error("API Key test failed:", error);
        return { valid: false, message: 'API Key is invalid or expired. Please check the key and try again.' };
    }
}
