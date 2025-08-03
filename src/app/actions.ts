'use server';

import { analyzeWhatsappChat, type AnalyzeWhatsappChatInput } from "@/ai/flows/analyze-whatsapp-chat";
import { textToSpeech as ttsFlow, type TextToSpeechInput, type TextToSpeechOutput } from "@/ai/flows/text-to-speech";
import { transcribeAudio as transcribeAudioFlow, type TranscribeAudioInput } from "@/ai/flows/transcribe-audio";
import type { ParsedMessage } from "@/lib/parser";


export async function getAiResponse(input: AnalyzeWhatsappChatInput): Promise<string> {
  try {
    const result = await analyzeWhatsappChat(input);
    return result.answer;
  } catch (error) {
    console.error("Error in getAiResponse:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
}

export async function getContextualAiResponse(message: ParsedMessage, mediaDataUri: string | null, query: string): Promise<string> {
    try {
        let chatLog = `An user has selected a specific message from a WhatsApp chat to discuss.\n\n`;
        chatLog += `Message Author: ${message.author}\n`;
        chatLog += `Message Timestamp: ${message.timestamp}\n`;
        
        const input: AnalyzeWhatsappChatInput = {
            chatLog: chatLog,
            query: query,
            images: [],
            audioTranscriptions: [],
        };

        if (message.type === 'text' && message.content) {
            input.chatLog += `Message Content: "${message.content}"\n\n`;
        }
        if (message.type === 'image' && message.fileName && mediaDataUri) {
            input.chatLog += `The user has selected an image named "${message.fileName}". The image is provided below.\n\n`;
            input.images!.push({ fileName: message.fileName, dataUri: mediaDataUri });
        }
        if (message.type === 'audio' && message.fileName && mediaDataUri) {
            input.chatLog += `The user has selected an audio message named "${message.fileName}". The transcription is provided below.\n\n`;
            const transcriptionResult = await transcribeAudio({ audioDataUri, language: 'ar' });
            input.audioTranscriptions!.push({ fileName: message.fileName, transcription: transcriptionResult });
        }
        if (message.type === 'video' && message.fileName) {
            input.chatLog += `The user has selected a video file named "${message.fileName}". Analysis of video content is not yet supported, but you can comment on the context if available.\n\n`;
        }
        if (message.type === 'file' && message.fileName) {
            input.chatLog += `The user has selected a file named "${message.fileName}". Analysis of file content is not yet supported, but you can comment on the context if available.\n\n`;
        }


        const result = await analyzeWhatsappChat(input);
        return result.answer;

    } catch (error) {
        console.error("Error in getContextualAiResponse:", error);
        throw new Error("Failed to get a contextual response from the AI model.");
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

export async function transcribeAudio(input: TranscribeAudioInput): Promise<string> {
    try {
        const result = await transcribeAudioFlow(input);
        return result.transcription;
    } catch (error) {
        console.error("Error in transcribeAudio action:", error);
        // Re-throw the error to be caught by the calling function
        throw new Error("Audio transcription failed.");
    }
}
