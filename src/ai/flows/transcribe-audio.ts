'use server';

/**
 * @fileOverview A flow for transcribing audio files using the Deepgram API.
 *
 * - transcribeAudio - Transcribes an audio file.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import { ai } from '@/ai/genkit';
import { transcribeUrl } from '@/services/deepgram';
import { z } from 'genkit';

const TranscribeAudioInputSchema = z.object({
  audioUrl: z.string().describe('The public URL of the audio file to transcribe.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    try {
      const transcription = await transcribeUrl(input.audioUrl);
      return { transcription };
    } catch (error) {
      console.error('Error in transcribeAudioFlow:', error);
      // Return an empty transcription or a specific error message
      return { transcription: '[Audio transcription failed]' };
    }
  }
);
