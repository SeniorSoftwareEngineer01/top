'use server';

/**
 * @fileOverview A flow for transcribing audio files using the Gemini model.
 *
 * - transcribeAudio - Transcribes an audio file buffer.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {type GenkitError} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';
import {ai} from '../genkit';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z
    .string()
    .describe('The language of the audio (e.g., "en-US", "ar").')
    .optional()
    .default('ar'),
  apiKey: z.string().optional().describe('The API key for the Google AI service.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async input => {
    try {
      const model = googleAI.model('gemini-2.0-flash', { apiKey: input.apiKey });

      const {text} = await ai.generate({
        model,
        prompt: [
          {
            text: `Transcribe the following audio file. The language is ${input.language}. Respond ONLY with the transcribed text.`,
          },
          {media: {url: input.audioDataUri}},
        ],
      });

      if (!text || text.trim() === '') {
        throw new Error('Transcription from model was empty.');
      }
      return {transcription: text};
    } catch (e) {
      const err = e as GenkitError;
      console.error('Error in transcribeAudioFlow:', err.message, err.stack);
      throw new Error(`Audio transcription failed: ${err.message}`);
    }
  }
);
