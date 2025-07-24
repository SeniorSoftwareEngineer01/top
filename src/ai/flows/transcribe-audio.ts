'use server';

/**
 * @fileOverview A flow for transcribing audio files using the Gemini model.
 *
 * - transcribeAudio - Transcribes an audio file buffer.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z.string().describe("The audio file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  language: z.string().describe('The language of the audio.').optional().default('ar'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;


export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcriptionPrompt = ai.definePrompt({
    name: 'transcriptionPrompt',
    input: { schema: TranscribeAudioInputSchema },
    prompt: `Transcribe the following audio file. The language is {{language}}. Respond only with the transcribed text.
  
  Audio: {{media url=audioDataUri}}`,
});


const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    try {
      const { text } = await ai.generate({
        prompt: `Transcribe the following audio file. The language is ${input.language}. Respond only with the transcribed text.`,
        media: { url: input.audioDataUri }
      });
      return { transcription: text };
    } catch (error) {
      console.error('Error in transcribeAudioFlow:', error);
      return { transcription: '[Audio transcription failed]' };
    }
  }
);
