export interface ChatMessage {
  timestamp: string;
  author: string;
  message: string;
}

/**
 * Parses a raw string of WhatsApp chat text into an array of message objects.
 * Handles multi-line messages.
 * @param text The raw string content from the WhatsApp .txt export.
 * @returns An array of ChatMessage objects.
 */
export function parseChat(text: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  // Regex to detect a new message line, e.g., "[1/25/24, 10:00:00 AM] John Doe: Hello"
  const messageRegex = /^\[([^\]]+)\] ([^:]+): ([\s\S]*)/;
  
  // Split the text into lines, but handle the case where messages themselves have newlines
  const lines = text.split('\n');
  let currentMessage: ChatMessage | null = null;

  for (const line of lines) {
    const match = line.match(messageRegex);
    if (match) {
      // If a new message is detected, push the previous one (if it exists)
      if (currentMessage) {
        messages.push({ ...currentMessage, message: currentMessage.message.trim() });
      }
      // Start a new message object
      currentMessage = {
        timestamp: match[1],
        author: match[2],
        message: match[3],
      };
    } else if (currentMessage) {
      // If the line does not match, it's a continuation of the previous message
      currentMessage.message += '\n' + line;
    }
  }

  // Push the last message after the loop finishes
  if (currentMessage) {
    messages.push({ ...currentMessage, message: currentMessage.message.trim() });
  }

  return messages;
}
