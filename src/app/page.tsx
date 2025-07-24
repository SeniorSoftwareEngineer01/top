'use client';

import { useState } from 'react';
import { ChatUpload } from '@/components/chat-upload';
import { ChatView } from '@/components/chat-view';
import { QueryInterface, type AIMessage } from '@/components/query-interface';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { parseChat, type ParsedMessage, type MessageType } from '@/lib/parser';
import { getAiResponse, transcribeAudio } from './actions';

// Helper to convert ArrayBuffer to Base64 Data URI
const arrayBufferToDataUri = (buffer: ArrayBuffer, type: string) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${type};base64,${base64}`;
}

const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'mp3':
      return 'audio/mpeg';
    case 'ogg':
        return 'audio/ogg';
    case 'wav':
        return 'audio/wav';
    case 'opus':
        return 'audio/opus';
    case 'm4a':
        return 'audio/mp4';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
};


export default function Home() {
  const [chatText, setChatText] = useState<string | null>(null);
  const [parsedChat, setParsedChat] = useState<ParsedMessage[]>([]);
  const [conversation, setConversation] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaContent, setMediaContent] = useState<Record<string, { url: string; buffer: ArrayBuffer }>>({});
  const [queryInputValue, setQueryInputValue] = useState('');
  const { toast } = useToast();

  const handleUpload = (fileContent: string, media: Record<string, ArrayBuffer>) => {
    try {
      const mediaFiles = Object.keys(media);
      const parsed = parseChat(fileContent, mediaFiles);

      if (parsed.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'The file appears to be empty or in an unsupported format. Please check the file and try again.',
        });
        return;
      }
      
      const mediaData: Record<string, { url: string; buffer: ArrayBuffer }> = {};
      for (const fileName in media) {
        const buffer = media[fileName];
        const mimeType = getMimeType(fileName);
        const blob = new Blob([buffer], { type: mimeType });
        mediaData[fileName] = {
            url: URL.createObjectURL(blob),
            buffer: buffer
        };
      }
      setMediaContent(mediaData);

      setChatText(fileContent);
      setParsedChat(parsed);
      getInitialSummary(fileContent);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Parsing Error',
        description: 'Could not parse the chat file. Please ensure it is a valid WhatsApp export.',
      });
      console.error('Parsing error:', error);
    }
  };
  
  const getInitialSummary = async (content: string) => {
    setIsLoading(true);
    setConversation([]);
    try {
      // Use a smaller portion of the chat for the initial summary to avoid context length issues.
      const summaryContent = content.length > 12000 ? content.substring(0, 12000) : content;
      const result = await getAiResponse({ chatLog: summaryContent, query: "قدم ملخصًا موجزًا ​​ومرقمًا للنقاط الرئيسية في هذه الدردشة. ابدأ بـ 'إليك ملخص الدردشة:'"});
      setConversation([{ role: 'assistant', content: result }]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'The AI could not provide an initial summary.',
      });
      setConversation([{ role: 'assistant', content: "I'm sorry, I couldn't generate a summary for this chat. You can still ask me questions about it." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async (query: string) => {
    if (!chatText) return;

    const newConversation: AIMessage[] = [...conversation, { role: 'user', content: query }];
    setConversation(newConversation);
    setIsLoading(true);
    setQueryInputValue('');

    try {
      const imagesToAnalyze = parsedChat
        .filter(msg => msg.type === 'image' && msg.fileName && mediaContent[msg.fileName])
        .map(msg => {
            const media = mediaContent[msg.fileName!];
            const mimeType = getMimeType(msg.fileName!);
            return {
                fileName: msg.fileName!,
                dataUri: arrayBufferToDataUri(media.buffer, mimeType)
            }
        });

      const audioMessages = parsedChat.filter(msg => msg.type === 'audio' && msg.fileName && mediaContent[msg.fileName]);
      const audioTranscriptions = await Promise.all(
        audioMessages.map(async (msg) => {
            const media = mediaContent[msg.fileName!];
            const mimeType = getMimeType(msg.fileName!);
            const audioDataUri = arrayBufferToDataUri(media.buffer, mimeType);
            const transcription = await transcribeAudio({ audioDataUri: audioDataUri, language: 'ar' });
            return {
                fileName: msg.fileName!,
                transcription: transcription,
            };
        })
      );


      const result = await getAiResponse({
          chatLog: chatText,
          query,
          images: imagesToAnalyze,
          audioTranscriptions: audioTranscriptions,
      });

      setConversation([...newConversation, { role: 'assistant', content: result }]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from the AI.',
      });
      setConversation([...newConversation, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMessageDoubleClick = (message: ParsedMessage) => {
    let quote = '';
    if (message.content) {
      quote = `"${message.content}"`;
    } else if (message.fileName) {
      quote = `[${message.type} file: ${message.fileName}]`;
    }
    
    if (quote) {
      setQueryInputValue(prev => prev ? `${prev}\n${quote}` : `${quote} `);
    }
  };


  if (!chatText) {
    return <ChatUpload onUpload={handleUpload} />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
         <SidebarInset>
          <QueryInterface
            conversation={conversation}
            onQuery={handleQuery}
            isLoading={isLoading}
            inputValue={queryInputValue}
            setInputValue={setQueryInputValue}
          />
        </SidebarInset>
        <Sidebar side="right">
          <ChatView 
            chat={parsedChat} 
            mediaContent={mediaContent} 
            onMessageDoubleClick={handleMessageDoubleClick}
          />
        </Sidebar>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
