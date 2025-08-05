'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing WhatsApp chat logs.
 *
 * - analyzeWhatsappChat - Analyzes a WhatsApp chat log and answers questions about it.
 * - AnalyzeWhatsappChatInput - The input type for the analyzeWhatsappChat function.
 * - AnalyzeWhatsappChatOutput - The return type for the analyzeWhatsappChat function.
 */
import {type GenkitError} from 'genkit';
import {z} from 'zod';
import {transcribeAudio} from './transcribe-audio';
import {ai} from '../genkit';
import {googleAI} from '@genkit-ai/googleai';

const AnalyzeWhatsappChatInputSchema = z.object({
  chatLog: z
    .string()
    .describe('The complete WhatsApp chat log as a single string.'),
  query: z.string().describe('The question or instruction about the chat log.'),
  images: z
    .array(
      z.object({
        fileName: z.string(),
        dataUri: z
          .string()
          .describe(
            "An image from the chat, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
          ),
      })
    )
    .describe('An array of images present in the chat.')
    .optional(),
  audioDataUri: z
    .string()
    .describe('An audio file to transcribe and analyze, as a data URI.')
    .optional(),
  language: z
    .string()
    .describe('The language for the AI to respond in (e.g., "ar", "fr").')
    .optional()
    .default('ar'),
  apiKey: z.string().optional().describe('The API key for the Google AI service.'),
});
export type AnalyzeWhatsappChatInput = z.infer<
  typeof AnalyzeWhatsappChatInputSchema
>;

const AnalyzeWhatsappChatOutputSchema = z.object({
  answer: z
    .string()
    .describe(
      'The textual answer to the chat log analysis. This can be text, markdown, or a self-contained HTML snippet for diagrams.'
    ),
});
export type AnalyzeWhatsappChatOutput = z.infer<
  typeof AnalyzeWhatsappChatOutputSchema
>;

export async function analyzeWhatsappChat(
  input: AnalyzeWhatsappChatInput
): Promise<AnalyzeWhatsappChatOutput> {
  return analyzeWhatsappChatFlow(input);
}

const analyzeWhatsappChatFlow = ai.defineFlow(
  {
    name: 'analyzeWhatsappChatFlow',
    inputSchema: AnalyzeWhatsappChatInputSchema,
    outputSchema: AnalyzeWhatsappChatOutputSchema,
  },
  async input => {
    let audioTranscription: string | undefined;

    if (input.audioDataUri) {
      try {
        const transcriptionResult = await transcribeAudio({
          audioDataUri: input.audioDataUri,
          language: input.language,
          apiKey: input.apiKey,
        });
        audioTranscription = transcriptionResult.transcription;
      } catch (e) {
        console.error('Transcription failed within the flow', e);
        audioTranscription = `[Audio transcription failed. I cannot analyze the audio content. Please inform the user that the audio analysis could not be completed and ask them to try again or summarize the audio content for you.]`;
      }
    }

    try {
      const model = googleAI.model('gemini-2.0-flash', { apiKey: input.apiKey });

      const promptParts: (string | {media: {url: string}})[] = [
        `You are an expert data analyst and visualization assistant, specializing in analyzing and visualizing WhatsApp chat data.
You will respond in the language specified by the user, which is: ${input.language}.

Your capabilities include:
- Analyzing large volumes of text to identify key themes, topics, and user behaviors.
- Transcribing audio messages to include their content in the analysis.
- Describing the content of images to add context.
- Translating text between languages.
- Generating beautifully styled responses using HTML. Use tags like <p>, <ul>, <li>, and <strong> to structure your answer for clarity.
- Generating beautifully styled tables using HTML and Tailwind CSS classes. Use classes like 'bg-card', 'text-card-foreground', 'border-border', 'bg-muted', 'text-muted-foreground' instead of hardcoded colors.

**== VERY IMPORTANT: DIAGRAM GENERATION ==**
When asked to create a diagram or chart (like a sequence diagram, flowchart, pie chart, etc.), you MUST generate the diagram code using **Mermaid.js syntax**.
Then, you MUST wrap the Mermaid code in a <pre class="mermaid">...</pre> block.
The application will automatically render this into a visual diagram.

Example for a sequence diagram:
<pre class="mermaid">
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
</pre>

Example for a pie chart:
<pre class="mermaid">
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
</pre>

You will be given a full chat log, and potentially a set of images and an audio transcription. Use ALL the information provided to fulfill the user's request comprehensively. Think step-by-step.

Data Provided:

Chat Log:
${input.chatLog}

${
  input.images && input.images.length > 0
    ? `
Images included in the chat:
You must analyze the content of these images as part of your response.
${input.images.map(img => `- ${img.fileName}: {{media url=${img.dataUri}}}`).join('\n')}
`
    : ''
}

${
  audioTranscription
    ? `
A relevant audio transcription:
"${audioTranscription}"
`
    : ''
}

User's Request:
"${input.query}"

Provide your comprehensive analysis below. Your response MUST be in ${input.language}.
- For textual answers, use clear language and format the response using HTML (<p>, <ul>, <strong>, etc.) for better readability.
- For tables, format it using HTML with semantic Tailwind CSS classes that adapt to the theme. Use classes like 'bg-card', 'text-card-foreground', 'border-border', 'bg-muted', 'text-muted-foreground' instead of hardcoded colors like 'bg-white' or 'text-gray-500'. For example: <table class="w-full text-sm text-left rtl:text-right text-card-foreground">.
- For charts/diagrams, provide the complete, self-contained Mermaid.js code inside a <pre class="mermaid"> block as instructed above.
`,
      ];

      if (input.images) {
        for (const img of input.images) {
          promptParts.push({media: {url: img.dataUri}});
        }
      }

      const {output} = await ai.generate({
        model,
        prompt: promptParts,
        output: {
          schema: AnalyzeWhatsappChatOutputSchema,
        },
      });

      return output!;
    } catch (e) {
      const err = e as GenkitError;
      console.error('Error in analysis flow:', err.message, err.stack);
      throw new Error(err.message || 'An unknown error occurred during analysis.');
    }
  }
);
