'use server';

/**
 * @fileOverview A flow for transcribing audio files using the Deepgram API.
 *
 * - transcribeAudio - Transcribes an audio file buffer.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import { ai } from '@/ai/genkit';
import { transcribeAudio as transcribeAudioService } from '@/services/deepgram';
import { z } from 'genkit';

const TranscribeAudioInputSchema = z.object({
  audioBuffer: z.string().describe("The audio file's ArrayBuffer encoded as a Base64 string."),
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
      const buffer = Buffer.from(input.audioBuffer, 'base64');
      const transcription = await transcribeAudioService(buffer);
      return { transcription };
    } catch (error) {
      console.error('Error in transcribeAudioFlow:', error);
      return { transcription: '[Audio transcription failed]' };
    }
  }
);
