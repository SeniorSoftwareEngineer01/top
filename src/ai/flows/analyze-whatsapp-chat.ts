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
  prompt: `You are an expert in analyzing WhatsApp chat logs.

  Based on the provided chat log, answer the following question as accurately as possible.

  Chat Log:
  {{chatLog}}

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
