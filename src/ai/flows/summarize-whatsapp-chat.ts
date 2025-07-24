'use server';

/**
 * @fileOverview A flow for summarizing WhatsApp chat histories.
 *
 * - summarizeWhatsappChat - A function that summarizes a WhatsApp chat based on user queries.
 * - SummarizeWhatsappChatInput - The input type for the summarizeWhatsappChat function.
 * - SummarizeWhatsappChatOutput - The return type for the summarizeWhatsappChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeWhatsappChatInputSchema = z.object({
  chatText: z
    .string()
    .describe('The complete text content of the WhatsApp chat history.'),
  query: z
    .string()
    .describe(
      'The user query specifying what to summarize from the chat, or the time period to focus on.'
    ),
});
export type SummarizeWhatsappChatInput = z.infer<
  typeof SummarizeWhatsappChatInputSchema
>;

const SummarizeWhatsappChatOutputSchema = z.object({
  summary: z.string().describe('The summarized content of the WhatsApp chat.'),
});
export type SummarizeWhatsappChatOutput = z.infer<
  typeof SummarizeWhatsappChatOutputSchema
>;

export async function summarizeWhatsappChat(
  input: SummarizeWhatsappChatInput
): Promise<SummarizeWhatsappChatOutput> {
  return summarizeWhatsappChatFlow(input);
}

const summarizeWhatsappChatPrompt = ai.definePrompt({
  name: 'summarizeWhatsappChatPrompt',
  input: {schema: SummarizeWhatsappChatInputSchema},
  output: {schema: SummarizeWhatsappChatOutputSchema},
  prompt: `You are an AI assistant specializing in summarizing WhatsApp chat histories.

  Given a WhatsApp chat history and a specific query from the user, your task is to provide a concise and informative summary.

  Consider the user's query to identify the key points or time period they are interested in.

  Chat History: {{{chatText}}}

  User Query: {{{query}}}

  Summary:`,
});

const summarizeWhatsappChatFlow = ai.defineFlow(
  {
    name: 'summarizeWhatsappChatFlow',
    inputSchema: SummarizeWhatsappChatInputSchema,
    outputSchema: SummarizeWhatsappChatOutputSchema,
  },
  async input => {
    const {output} = await summarizeWhatsappChatPrompt(input);
    return output!;
  }
);
