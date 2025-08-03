'use client';

import { useState, useEffect } from 'react';
import { ChatUpload } from '@/components/chat-upload';
import { ChatView } from '@/components/chat-view';
import { QueryInterface, type AIMessage } from '@/components/query-interface';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { parseChat, type ParsedMessage } from '@/lib/parser';
import { getAiResponse, transcribeAudio, getContextualAiResponse } from './actions';
import { AnalysisView } from '@/components/analysis-view';
import { saveChatArchive, getLatestChatArchive, saveAiConversation, getLatestAiConversation, clearDb } from '@/lib/db';

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
  const [selectedMessage, setSelectedMessage] = useState<ParsedMessage | null>(null);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  useEffect(() => {
    async function loadFromDb() {
      try {
        const archive = await getLatestChatArchive();
        if (archive) {
          setChatText(archive.chatText);
          setParsedChat(archive.parsedChat);
          setMediaContent(archive.mediaContent);
        }

        const aiConversation = await getLatestAiConversation();
        if (aiConversation) {
          setConversation(aiConversation);
        }
      } catch (error) {
        console.error("Failed to load from DB", error);
        toast({
          variant: "destructive",
          title: "Database Error",
          description: "Could not load previous session.",
        });
      } finally {
        setIsDbLoaded(true);
      }
    }
    loadFromDb();
  }, [toast]);


  const handleUpload = async (fileContent: string, media: Record<string, ArrayBuffer>, fileName: string) => {
    try {
      // Clear previous chat data and start fresh
      await clearDb();
      setChatText(null);
      setParsedChat([]);
      setConversation([]);
      setMediaContent({});
      setSelectedMessage(null);

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
      for (const fName in media) {
        const buffer = media[fName];
        const mimeType = getMimeType(fName);
        const blob = new Blob([buffer], { type: mimeType });
        mediaData[fName] = {
            url: URL.createObjectURL(blob),
            buffer: buffer
        };
      }
      
      await saveChatArchive(fileName, fileContent, parsed, mediaData);

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
      const summaryContent = content.length > 12000 ? content.substring(0, 12000) : content;
      const result = await getAiResponse({ chatLog: summaryContent, query: "قدم ملخصًا موجزًا ​​ومرقمًا للنقاط الرئيسية في هذه الدردشة. ابدأ بـ 'إليك ملخص الدردشة:'"});
      const initialMessage: AIMessage = { role: 'assistant', content: result };
      setConversation([initialMessage]);
      await saveAiConversation([initialMessage]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'The AI could not provide an initial summary.',
      });
      const errorMessage: AIMessage = { role: 'assistant', content: "I'm sorry, I couldn't generate a summary for this chat. You can still ask me questions about it." };
      setConversation([errorMessage]);
       await saveAiConversation([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async (query: string) => {
    if (!chatText) return;

    const userMessage: AIMessage = { role: 'user', content: query };
    const newConversation: AIMessage[] = [...conversation, userMessage];
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
          try {
            const media = mediaContent[msg.fileName!];
            const mimeType = getMimeType(msg.fileName!);
            const audioDataUri = arrayBufferToDataUri(media.buffer, mimeType);
            const transcription = await transcribeAudio({ audioDataUri: audioDataUri, language: 'ar' });
            return {
                fileName: msg.fileName!,
                transcription: transcription,
            };
          } catch (error) {
             console.error(`Transcription failed for ${msg.fileName}:`, error);
             // Return a placeholder if transcription fails for a single file
             return {
                 fileName: msg.fileName!,
                 transcription: `[Transcription failed for ${msg.fileName}]`,
             };
          }
        })
      );


      const result = await getAiResponse({
          chatLog: chatText,
          query,
          images: imagesToAnalyze,
          audioTranscriptions: audioTranscriptions,
      });

      const assistantMessage: AIMessage = { role: 'assistant', content: result };
      const finalConversation = [...newConversation, assistantMessage];
      setConversation(finalConversation);
      await saveAiConversation(finalConversation);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from the AI.',
      });
      const errorMessage: AIMessage = { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." };
      const finalConversation = [...newConversation, errorMessage];
      setConversation(finalConversation);
      await saveAiConversation(finalConversation);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMessageSelection = (message: ParsedMessage) => {
    if (selectedMessage && selectedMessage.timestamp === message.timestamp && selectedMessage.content === message.content) {
      setSelectedMessage(null); // Deselect if the same message is clicked again
    } else {
      setSelectedMessage(message);
    }
  };

  if (!isDbLoaded) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }


  if (!chatText) {
    return <ChatUpload onUpload={handleUpload} />;
  }

  return (
    <SidebarProvider>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-h-screen">
        <div className="lg:col-span-2 flex flex-col">
           <QueryInterface
                conversation={conversation}
                onQuery={handleQuery}
                isLoading={isLoading}
                inputValue={queryInputValue}
                setInputValue={setQueryInputValue}
              />
        </div>
        
        <div className="relative flex flex-col bg-muted/20">
            {selectedMessage ? (
              <AnalysisView 
                message={selectedMessage}
                mediaContent={mediaContent}
                onClose={() => setSelectedMessage(null)}
              />
            ) : (
               <div className="flex flex-1 items-center justify-center text-center p-4">
                  <p className="text-muted-foreground">Double-click a message in the chat to start a detailed analysis here.</p>
               </div>
            )}
        </div>

      </div>

      <Sidebar side="right">
          <ChatView 
            chat={parsedChat} 
            mediaContent={mediaContent} 
            onMessageSelect={handleMessageSelection}
            selectedMessage={selectedMessage}
          />
        </Sidebar>
      <Toaster />
    </SidebarProvider>
  );
}
