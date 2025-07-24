export interface ChatMessage {
  timestamp: string;
  author: string;
  message: string;
}

/**
 * Parses a raw string of WhatsApp chat text into an array of message objects.
 * Handles multi-line messages and different timestamp formats, including Arabic RTL formats.
 * @param text The raw string content from the WhatsApp .txt export.
 * @returns An array of ChatMessage objects.
 */
export function parseChat(text: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  // Regex inspired by the user's Python code to handle Arabic date/time format.
  // It handles dates like "DD/MM/YYYY، HH:MM" and potential RTL characters.
  // Example: "25‏/7‏/2024، 10:53 - شخص ما: رسالة"
  const messageRegex = /^(?:[\u200E\u200F]?\d{1,2}[\u200E\u200F]?\/[\u200E\u200F]?\d{1,2}[\u200E\u200F]?\/\d{2,4}[\u200E\u200F]?،? \d{1,2}:\d{2})\s-\s([^:]+):\s([\s\S]+)/;
  
  // A more generic regex for various "[timestamp] author: message" formats
  const genericMessageRegex = /^\[([^\]]+)\]\s*([^:]+):\s*([\s\S]+)/;

  const lines = text.split('\n');
  let currentMessage: ChatMessage | null = null;

  for (const line of lines) {
    let match = line.match(messageRegex);
    let isGenericMatch = false;
    
    // If the Arabic-specific regex doesn't match, try the generic one.
    if (!match) {
      match = line.match(genericMessageRegex);
      isGenericMatch = true;
    }

    if (match) {
      // Push the previous message if it exists
      if (currentMessage) {
        messages.push({ ...currentMessage, message: currentMessage.message.trim() });
      }

      if (isGenericMatch) {
         currentMessage = {
          timestamp: match[1].trim(),
          author: match[2].trim(),
          message: match[3].trim(),
        };
      } else {
        // This block is for the arabic-specific regex which doesn't capture the timestamp itself
        // but uses it as a delimiter. We need to extract it differently.
        const firstDashIndex = line.indexOf(' - ');
        const timestamp = line.substring(0, firstDashIndex).trim();
        
        currentMessage = {
          timestamp: timestamp,
          author: match[1].trim(),
          message: match[2].trim(),
        };
      }
    } else if (currentMessage) {
      // If the line does not match, it's a continuation of the previous message.
      currentMessage.message += '\n' + line;
    }
  }

  // Add the last message
  if (currentMessage) {
    messages.push({ ...currentMessage, message: currentMessage.message.trim() });
  }

  return messages;
}
