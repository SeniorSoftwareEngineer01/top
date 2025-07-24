import { createClient, type DeepgramClient } from "@deepgram/sdk";

let deepgramClient: DeepgramClient | null = null;

function getClient(): DeepgramClient {
  if (deepgramClient) {
    return deepgramClient;
  }
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is not set in environment variables.");
  }
  deepgramClient = createClient(apiKey);
  return deepgramClient;
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const client = getClient();
  try {
    const { result, error } = await client.listen.prerecorded.transcribeFile(
        audioBuffer,
        { model: "nova-2", smart_format: true, language: "ar" }
    );

    if (error) {
        console.error("Deepgram API Error:", error);
        throw error;
    }
    
    return result.results.channels[0].alternatives[0].transcript;
  } catch (err) {
    console.error("Error transcribing audio from buffer:", err);
    throw new Error("Failed to transcribe audio.");
  }
}
