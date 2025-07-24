'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing WhatsApp chat logs.
 *
 * - analyzeWhatsappChat - Analyzes a WhatsApp chat log and answers questions about it.
 * - AnalyzeWhatsappChatInput - The input type for the analyzeWhatsappChat function.
 * - AnalyzeWhatsappChatOutput - The return type for the analyzeWhatsappChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeWhatsappChatInputSchema = z.object({
  chatLog: z
    .string()
    .describe('The complete WhatsApp chat log as a single string.'),
  query: z.string().describe('The question about the chat log.'),
  images: z.array(z.object({
    fileName: z.string(),
    dataUri: z.string().describe("An image from the chat, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  })).describe('An array of images present in the chat.').optional(),
  audioTranscriptions: z.array(z.object({
      fileName: z.string(),
      transcription: z.string(),
  })).describe('An array of audio transcriptions from the chat.').optional(),
});
export type AnalyzeWhatsappChatInput = z.infer<typeof AnalyzeWhatsappChatInputSchema>;

const AnalyzeWhatsappChatOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the chat log.'),
});
export type AnalyzeWhatsappChatOutput = z.infer<typeof AnalyzeWhatsappChatOutputSchema>;

export async function analyzeWhatsappChat(input: AnalyzeWhatsappChatInput): Promise<AnalyzeWhatsappChatOutput> {
  return analyzeWhatsappChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeWhatsappChatPrompt',
  input: {schema: AnalyzeWhatsappChatInputSchema},
  output: {schema: AnalyzeWhatsappChatOutputSchema},
  prompt: `You are an expert in analyzing WhatsApp chat logs, including text, images, and audio transcriptions.

  Based on the provided chat log and any included media, answer the following question as accurately as possible.

  Chat Log:
  {{chatLog}}

  {{#if images}}
  Images included in the chat:
  {{#each images}}
  - {{fileName}}: {{media url=dataUri}}
  {{/each}}
  {{/if}}

  {{#if audioTranscriptions}}
  Audio Transcriptions from the chat:
  {{#each audioTranscriptions}}
  - Transcription for {{fileName}}: {{transcription}}
  {{/each}}
  {{/if}}

  Question:
  {{query}}
  `,
});

const analyzeWhatsappChatFlow = ai.defineFlow(
  {
    name: 'analyzeWhatsappChatFlow',
    inputSchema: AnalyzeWhatsappChatInputSchema,
    outputSchema: AnalyzeWhatsappChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
