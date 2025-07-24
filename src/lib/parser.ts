export interface ChatMessage {
  timestamp: string;
  author: string;
  message: string;
}

/**
 * Parses a raw string of WhatsApp chat text into an array of message objects.
 * Handles multi-line messages and different timestamp formats.
 * @param text The raw string content from the WhatsApp .txt export.
 * @returns An array of ChatMessage objects.
 */
export function parseChat(text: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  // Regex to detect a new message line. This is a more flexible regex.
  // It handles LTR and RTL markers, and different date/time formats.
  const messageRegex = /^(?:\u200E|\u200F)*\[([^\]]+)\]\s*([^:]+):\s*([\s\S]*)/;

  const lines = text.split('\n');
  let currentMessage: ChatMessage | null = null;

  for (const line of lines) {
    // We need to handle the case where the line might start with a Right-to-Left mark.
    const sanitizedLine = line.trim().replace(/^[\u200E\u200F]/, '');
    const match = sanitizedLine.match(messageRegex);
    
    if (match) {
      if (currentMessage) {
        messages.push({ ...currentMessage, message: currentMessage.message.trim() });
      }
      currentMessage = {
        timestamp: match[1],
        author: match[2].trim(),
        message: match[3].trim(),
      };
    } else if (currentMessage) {
      // If the line does not match, it's a continuation of the previous message.
      // We append the original line, not the sanitized one.
      currentMessage.message += '\n' + line;
    }
  }

  if (currentMessage) {
    messages.push({ ...currentMessage, message: currentMessage.message.trim() });
  }

  return messages;
}
