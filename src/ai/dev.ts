import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-whatsapp-chat.ts';
import '@/ai/flows/analyze-whatsapp-chat.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/transcribe-audio.ts';
