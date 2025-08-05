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
import { transcribeAudio } from './transcribe-audio';

const AnalyzeWhatsappChatInputSchema = z.object({
  chatLog: z
    .string()
    .describe('The complete WhatsApp chat log as a single string.'),
  query: z.string().describe('The question or instruction about the chat log.'),
  images: z.array(z.object({
    fileName: z.string(),
    dataUri: z.string().describe("An image from the chat, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  })).describe('An array of images present in the chat.').optional(),
  audioDataUri: z.string().describe("An audio file to transcribe and analyze, as a data URI.").optional(),
});
export type AnalyzeWhatsappChatInput = z.infer<typeof AnalyzeWhatsappChatInputSchema>;

const AnalyzeWhatsappChatOutputSchema = z.object({
  answer: z.string().describe('The textual answer to the question about the chat log. This can be text, markdown, or HTML for tables.'),
  chartData: z.any().describe('If the user requests a chart or diagram, provide the data for it in a structured JSON format suitable for Recharts. Otherwise, this should be null.').optional(),
});
export type AnalyzeWhatsappChatOutput = z.infer<typeof AnalyzeWhatsappChatOutputSchema>;

export async function analyzeWhatsappChat(input: AnalyzeWhatsappChatInput): Promise<AnalyzeWhatsappChatOutput> {
  return analyzeWhatsappChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeWhatsappChatPrompt',
  input: {schema: z.object({
      chatLog: z.string(),
      query: z.string(),
      images: z.array(z.object({
        fileName: z.string(),
        dataUri: z.string(),
      })).optional(),
      audioTranscription: z.string().optional(),
  })},
  output: {schema: AnalyzeWhatsappChatOutputSchema},
  prompt: `You are an expert data analyst and front-end developer, specializing in analyzing and visualizing WhatsApp chat data.

Your capabilities include:
- Analyzing large volumes of text to identify key themes, topics, and user behaviors.
- Transcribing audio messages to include their content in the analysis.
- Describing the content of images to add context.
- Translating text between languages.
- Generating beautifully styled responses using HTML. Use tags like <p>, <ul>, <li>, and <strong> to structure your answer for clarity.
- Generating beautifully styled tables using HTML and Tailwind CSS classes. Use classes like 'bg-card', 'text-card-foreground', 'border-border', 'bg-muted', 'text-muted-foreground' instead of hardcoded colors.
- IMPORTANT: When asked to create a diagram or chart, DO NOT generate HTML or JavaScript code. Instead, analyze the relevant data and return a structured JSON object in the 'chartData' field. The JSON should be directly usable by the Recharts library. For example, for a bar chart, it might look like: { "type": "bar", "data": [{ "name": "User A", "messages": 25 }, { "name": "User B", "messages": 40 }] }.

You will be given a full chat log, and potentially a set of images and an audio transcription. Use ALL the information provided to fulfill the user's request comprehensively. Think step-by-step.

Data Provided:

Chat Log:
{{chatLog}}

{{#if images}}
Images included in the chat:
You must analyze the content of these images as part of your response.
{{#each images}}
- {{fileName}}: {{media url=dataUri}}
{{/each}}
{{/if}}

{{#if audioTranscription}}
A relevant audio transcription:
"{{audioTranscription}}"
{{/if}}

User's Request:
"{{query}}"

Provide your comprehensive analysis below. 
- For textual answers, use clear language and format the response using HTML (<p>, <ul>, <strong>, etc.) for better readability.
- For tables, format it using HTML with semantic Tailwind CSS classes that adapt to the theme. Use classes like 'bg-card', 'text-card-foreground', 'border-border', 'bg-muted', 'text-muted-foreground' instead of hardcoded colors like 'bg-white' or 'text-gray-500'. For example: <table class="w-full text-sm text-left rtl:text-right text-card-foreground">.
- For charts/diagrams, provide the data in the 'chartData' field and a brief explanation in the 'answer' field.
`,
});

const analyzeWhatsappChatFlow = ai.defineFlow(
  {
    name: 'analyzeWhatsappChatFlow',
    inputSchema: AnalyzeWhatsappChatInputSchema,
    outputSchema: AnalyzeWhatsappChatOutputSchema,
  },
  async (input) => {
    let audioTranscription: string | undefined;

    if (input.audioDataUri) {
      try {
        const transcriptionResult = await transcribeAudio({ audioDataUri: input.audioDataUri, language: 'ar' });
        audioTranscription = transcriptionResult.transcription;
      } catch (e) {
        console.error("Transcription failed within the flow", e);
        return { answer: "I'm sorry, but I was unable to transcribe the selected audio message. Please try another message." };
      }
    }
    
    const {output} = await prompt({
        chatLog: input.chatLog,
        query: input.query,
        images: input.images,
        audioTranscription: audioTranscription,
    });
    return output!;
  }
);
