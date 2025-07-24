export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'media_missing';

export interface ParsedMessage {
  timestamp: string;
  author: string;
  content: string;
  type: MessageType;
  fileName?: string;
}

const getMessageType = (fileName: string): MessageType => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return 'file';

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'opus', 'aac'];
  const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

  if (imageExtensions.includes(extension)) return 'image';
  if (audioExtensions.includes(extension)) return 'audio';
  if (videoExtensions.includes(extension)) return 'video';
  
  return 'file';
};

/**
 * Parses a raw string of WhatsApp chat text into an array of message objects.
 * Handles multi-line messages and different timestamp formats, including Arabic RTL formats.
 * It also identifies media messages and extracts file names.
 * @param text The raw string content from the WhatsApp .txt export.
 * @param mediaFileNames An array of media file names from the zip archive.
 * @returns An array of ParsedMessage objects.
 */
export function parseChat(text: string, mediaFileNames: string[] = []): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  // Regex to match the start of a message line with Arabic or standard date formats.
  // It captures the timestamp, author, and the rest of the line (content).
  const messageStartRegex = new RegExp(
    /^(?:[\u200E\u200F]?\d{1,2}[\u200E\u200F]?\/[\u200E\u200F]?\d{1,2}[\u200E\u200F]?\/\d{2,4}[\u200E\u200F]?،? \d{1,2}:\d{2})\s-\s([^:]+):\s([\s\S]+)/
  );

  // Regex to find an attached file name in the message content.
  // Catches patterns like "(file attached)", "<attached: ...>", and the filename itself.
  const mediaPattern = /(?:\(الملف مرفق\)|<ملف مرفق:>|<Media omitted>|تم حذف هذه الرسالة)\s*([\w\-\s]+\.(jpg|jpeg|png|gif|bmp|mp3|wav|ogg|m4a|opus|mp4|webm|mov|avi))?/i;
  
  const lines = text.split('\n');
  let currentMessage: ParsedMessage | null = null;
  let mediaQueue = [...mediaFileNames];

  for (const line of lines) {
    const match = line.match(messageStartRegex);

    if (match) {
      if (currentMessage) {
        messages.push({ ...currentMessage, content: currentMessage.content.trim() });
      }

      const firstDashIndex = line.indexOf(' - ');
      const timestamp = line.substring(0, firstDashIndex).trim();
      const author = match[1].trim();
      let content = match[2].trim();
      
      const mediaMatch = content.match(mediaPattern);
      
      if (mediaMatch) {
        // Case 1: Media file name is explicitly in the message.
        const fileName = mediaMatch[1] ? mediaMatch[1].trim() : mediaQueue.shift();
        if (fileName) {
          currentMessage = {
            timestamp,
            author,
            content: content.replace(mediaPattern, '').trim(),
            type: getMessageType(fileName),
            fileName: fileName,
          };
        } else {
           // Case 2: Media omitted, but no file in queue.
           currentMessage = {
            timestamp,
            author,
            content,
            type: 'media_missing',
          };
        }
      } else {
         // Case 3: A regular text message.
        currentMessage = {
          timestamp,
          author,
          content,
          type: 'text',
        };
      }
    } else if (currentMessage) {
      // Line is a continuation of the previous message.
      currentMessage.content += '\n' + line;
    }
  }

  if (currentMessage) {
    messages.push({ ...currentMessage, content: currentMessage.content.trim() });
  }

  return messages;
}
