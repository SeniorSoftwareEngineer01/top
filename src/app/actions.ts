'use server';

import { analyzeWhatsappChat, type AnalyzeWhatsappChatInput, type AnalyzeWhatsappChatOutput } from "@/ai/flows/analyze-whatsapp-chat";
import { textToSpeech as ttsFlow, type TextToSpeechInput, type TextToSpeechOutput } from "@/ai/flows/text-to-speech";
import { transcribeAudio as transcribeAudioFlow, type TranscribeAudioInput, type TranscribeAudioOutput } from "@/ai/flows/transcribe-audio";
import type { ParsedMessage } from "@/lib/parser";


export async function getAiResponse(input: AnalyzeWhatsappChatInput): Promise<AnalyzeWhatsappChatOutput> {
    // This action now directly calls the main analysis flow, which handles audio transcription internally.
    try {
        const result = await analyzeWhatsappChat(input);
        return result;
    } catch (error) {
        console.error("Error in getAiResponse:", error);
        throw new Error("Failed to get a response from the AI model.");
    }
}

export async function getContextualAiResponse(message: ParsedMessage, mediaDataUri: string | null, query: string, language: string): Promise<AnalyzeWhatsappChatOutput> {
    try {
        let chatLog = `An user has selected a specific message from a WhatsApp chat to discuss.\n\n`;
        chatLog += `Message Author: ${message.author}\n`;
        chatLog += `Message Timestamp: ${message.timestamp}\n`;
        
        const input: AnalyzeWhatsappChatInput = {
            chatLog: chatLog,
            query: query,
            images: [],
            language: language,
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
             // The main flow will handle the transcription and analysis together.
             // We adjust the query to give context to the AI about the selected audio.
             input.query = `The user has selected a specific audio message. Analyze it in the context of this query: "${query}"`;
        }
        if (message.type === 'video' && message.fileName) {
            input.chatLog += `The user has selected a video file named "${message.fileName}". Analysis of video content is not yet supported, but you can comment on the context if available.\n\n`;
        }
        if (message.type === 'file' && message.fileName) {
            input.chatLog += `The user has selected a file named "${message.fileName}". Analysis of file content is not yet supported, but you can comment on the context if available.\n\n`;
        }

        // Use the main analysis flow for all contextual responses.
        const result = await analyzeWhatsappChat(input);
        return result;

    } catch (error)
    {
        console.error("Error in getContextualAiResponse:", error);
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
        throw new Error("I'm sorry, but I was unable to transcribe the selected audio message. Please try another message.");
    }
}
