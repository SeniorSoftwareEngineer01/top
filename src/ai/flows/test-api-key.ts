'use server';
/**
 * @fileOverview A flow for testing if a Gemini API key is valid.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

const TestApiKeyInputSchema = z.object({
  apiKey: z.string().describe('The API key to test.'),
});

export const testApiKeyFlow = ai.defineFlow(
  {
    name: 'testApiKeyFlow',
    inputSchema: TestApiKeyInputSchema,
    outputSchema: z.void(),
  },
  async input => {
    const testPlugin = googleAI({apiKey: input.apiKey});
    const model = testPlugin.model('gemini-2.0-flash');

    // A simple and fast request to check for authentication errors.
    await ai.generate({
      model,
      prompt: 'test',
    });
  }
);
