'use client';

import { useState } from 'react';
import { ChatUpload } from '@/components/chat-upload';
import { ChatView } from '@/components/chat-view';
import { QueryInterface, type AIMessage } from '@/components/query-interface';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { parseChat, type ChatMessage as ParsedChatMessage } from '@/lib/parser';
import { getAiResponse } from './actions';

export default function Home() {
  const [chatText, setChatText] = useState<string | null>(null);
  const [parsedChat, setParsedChat] = useState<ParsedChatMessage[]>([]);
  const [conversation, setConversation] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpload = (fileContent: string) => {
    try {
      const parsed = parseChat(fileContent);
      if (parsed.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'The file appears to be empty or in an unsupported format. Please check the file and try again.',
        });
        return;
      }
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
      const result = await getAiResponse(summaryContent, "قدم ملخصًا موجزًا ​​ومرقمًا للنقاط الرئيسية في هذه الدردشة. ابدأ بـ 'إليك ملخص الدردشة:'");
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

    try {
      const result = await getAiResponse(chatText, query);
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
          />
        </SidebarInset>
        <Sidebar side="right">
          <ChatView chat={parsedChat} />
        </Sidebar>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
