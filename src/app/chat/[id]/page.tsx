'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatView } from '@/components/chat-view';
import { QueryInterface, type AIMessage } from '@/components/query-interface';
import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import type { ParsedMessage } from '@/lib/parser';
import { getAiResponse, getContextualAiResponse } from '../../actions';
import { getConversation, saveAiConversation, type Conversation } from '@/lib/db';
import { SelectedMessageView } from '@/components/selected-message-view';
import { PanelLeft, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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


export default function ChatPage() {
  const [conversationData, setConversationData] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [queryInputValue, setQueryInputValue] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ParsedMessage | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const conversationId = Number(params.id);

  // Memoize media content with Object URLs
  const mediaContent = useMemo(() => {
    if (!conversationData?.mediaContent) return {};
    const newMediaContent: Record<string, { url: string; buffer: ArrayBuffer }> = {};
    for (const fileName in conversationData.mediaContent) {
      const media = conversationData.mediaContent[fileName];
      if (media.buffer) {
        const mimeType = getMimeType(fileName);
        const blob = new Blob([media.buffer], { type: mimeType });
        newMediaContent[fileName] = {
            url: URL.createObjectURL(blob),
            buffer: media.buffer
        };
      }
    }
    return newMediaContent;
  }, [conversationData?.mediaContent]);


  useEffect(() => {
    async function loadConversation() {
      if (isNaN(conversationId)) {
        toast({
          variant: 'destructive',
          title: 'Invalid URL',
          description: 'The conversation ID is not valid.',
        });
        router.push('/');
        return;
      }

      try {
        const convo = await getConversation(conversationId);
        if (convo) {
          setConversationData(convo);
          if (!convo.aiConversation || convo.aiConversation.length === 0) {
            getInitialSummary(convo.chatText, conversationId);
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Not Found',
            description: 'This conversation could not be found.',
          });
          router.push('/');
        }
      } catch (error) {
        console.error("Failed to load conversation from DB", error);
        toast({
          variant: "destructive",
          title: "Database Error",
          description: "Could not load the conversation.",
        });
        router.push('/');
      } finally {
        setIsDbLoaded(true);
      }
    }
    loadConversation();
  // We only want to run this once on mount for a given ID.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, router, toast]);


  const updateAndSaveConversation = async (newAiMessages: AIMessage[]) => {
      setConversationData(prev => prev ? { ...prev, aiConversation: newAiMessages } : null);
      await saveAiConversation(conversationId, newAiMessages);
  }

  
  const getInitialSummary = async (content: string, convoId: number) => {
    setIsLoading(true);
    try {
      const summaryContent = content.length > 12000 ? content.substring(0, 12000) : content;
      const result = await getAiResponse({ chatLog: summaryContent, query: "قدم ملخصًا موجزًا ​​ومرقمًا للنقاط الرئيسية في هذه الدردشة. ابدأ بـ 'إليك ملخص الدردشة:'"});
      const initialMessage: AIMessage = { role: 'assistant', content: result.answer, chartData: result.chartData };
      await updateAndSaveConversation([initialMessage]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'The AI could not provide an initial summary.',
      });
      const errorMessage: AIMessage = { role: 'assistant', content: "I'm sorry, I couldn't generate a summary for this chat. You can still ask me questions about it." };
      await updateAndSaveConversation([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async (query: string) => {
    if (!conversationData) return;
    
    if (query.trim().toLowerCase() === '.ex') {
        router.push('/');
        return;
    }

    const currentAiConvo = conversationData.aiConversation || [];
    const userMessage: AIMessage = { role: 'user', content: query };
    const newConversationHistory: AIMessage[] = [...currentAiConvo, userMessage];
    
    setConversationData(prev => prev ? { ...prev, aiConversation: newConversationHistory } : null);
    setIsLoading(true);
    setQueryInputValue('');

    try {
      let result;
      let assistantMessage: AIMessage;

      if (selectedMessage) {
         const mediaDataUri = (selectedMessage.fileName && mediaContent[selectedMessage.fileName])
            ? arrayBufferToDataUri(mediaContent[selectedMessage.fileName].buffer, getMimeType(selectedMessage.fileName))
            : null;
        result = await getContextualAiResponse(selectedMessage, mediaDataUri, query);
        
        assistantMessage = { role: 'assistant', content: result.answer, chartData: result.chartData, contextMessage: selectedMessage };

        // Deselect the message after asking a question about it
        setSelectedMessage(null); 
      } else {
        const imagesToAnalyze = conversationData.parsedChat
          .filter(msg => msg.type === 'image' && msg.fileName && mediaContent[msg.fileName])
          .slice(0, 10) // Limit to first 10 images to avoid large payloads
          .map(msg => {
              const media = mediaContent[msg.fileName!];
              const mimeType = getMimeType(msg.fileName!);
              return {
                  fileName: msg.fileName!,
                  dataUri: arrayBufferToDataUri(media.buffer, mimeType)
              }
          });
                
        result = await getAiResponse({
            chatLog: conversationData.chatText,
            query,
            images: imagesToAnalyze,
        });
        assistantMessage = { role: 'assistant', content: result.answer, chartData: result.chartData };
      }

      const finalConversation = [...newConversationHistory, assistantMessage];
      await updateAndSaveConversation(finalConversation);

    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Failed to get a response from the AI.',
      });
      const errorMessage: AIMessage = { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." };
      const finalConversation = [...newConversationHistory, errorMessage];
      await updateAndSaveConversation(finalConversation);
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

  if (!isDbLoaded || !conversationData) {
    return <div className="flex h-screen w-full items-center justify-center">Loading conversation...</div>;
  }

  return (
    <SidebarProvider>
        <div className="flex min-h-screen bg-muted/30">
            <Sidebar side="left" className="md:w-1/3 lg:w-1/4 xl:w-1/5">
              <ChatView 
                chat={conversationData.parsedChat} 
                mediaContent={mediaContent} 
                onMessageSelect={handleMessageSelection}
                selectedMessage={selectedMessage}
              />
            </Sidebar>
            <main className="flex-1 flex flex-col h-screen">
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5"/>
                        <span className="sr-only">Back</span>
                    </Button>
                     <SidebarTrigger className='hidden md:flex'>
                        <PanelLeft className="h-5 w-5"/>
                        <span className="sr-only">Toggle sidebar</span>
                    </SidebarTrigger>
                    <h1 className="text-lg font-semibold truncate">{conversationData.name}</h1>
                </header>
               <QueryInterface
                    conversation={conversationData.aiConversation || []}
                    onQuery={handleQuery}
                    isLoading={isLoading}
                    inputValue={queryInputValue}
                    setInputValue={setQueryInputValue}
                    mediaContent={mediaContent}
                  >
                    {selectedMessage && (
                      <SelectedMessageView 
                        message={selectedMessage}
                        mediaContent={mediaContent}
                        onClose={() => setSelectedMessage(null)} 
                      />
                    )}
                  </QueryInterface>
            </main>
        </div>
    </SidebarProvider>
  );
}
