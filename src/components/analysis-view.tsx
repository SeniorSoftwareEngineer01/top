'use client';

import { useState, useEffect, useRef } from 'react';
import type { ParsedMessage } from '@/lib/parser';
import { getContextualAiResponse, textToSpeech, transcribeAudio } from '@/app/actions';
import { AIMessage, QueryInterface } from './query-interface';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MediaMessage } from './media-message';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface AnalysisViewProps {
  message: ParsedMessage;
  mediaContent: Record<string, { url: string; buffer: ArrayBuffer }>;
  onClose: () => void;
}

export function AnalysisView({ message, mediaContent, onClose }: AnalysisViewProps) {
  const [conversation, setConversation] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queryInputValue, setQueryInputValue] = useState('');
  const { toast } = useToast();
  const mediaUrl = message.fileName ? mediaContent[message.fileName]?.url : undefined;
  const viewRef = useRef<HTMLDivElement>(null);

  const getInitialAnalysis = async (msg: ParsedMessage) => {
    setIsLoading(true);
    setConversation([]);
    try {
      const mediaDataUri = (msg.fileName && mediaContent[msg.fileName])
        ? arrayBufferToDataUri(mediaContent[msg.fileName].buffer, getMimeType(msg.fileName))
        : null;
        
      const result = await getContextualAiResponse(msg, mediaDataUri, "Analyze this message in detail. What is it, who sent it, and what is its content or appearance? Provide a comprehensive summary.");
      setConversation([{ role: 'assistant', content: result }]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: (error as Error).message || 'The AI could not provide an initial analysis.',
      });
      setConversation([{ role: 'assistant', content: "I'm sorry, I couldn't analyze this message. You can still ask me questions about it." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (message) {
      // Add a simple animation on message change
      viewRef.current?.classList.remove('animate-in', 'fade-in');
      void viewRef.current?.offsetWidth; // Trigger reflow
      viewRef.current?.classList.add('animate-in', 'fade-in');
      getInitialAnalysis(message);
    }
  }, [message]);


  const handleQuery = async (query: string) => {
    const newConversation: AIMessage[] = [...conversation, { role: 'user', content: query }];
    setConversation(newConversation);
    setIsLoading(true);
    setQueryInputValue('');

    try {
        const mediaDataUri = (message.fileName && mediaContent[message.fileName])
            ? arrayBufferToDataUri(mediaContent[message.fileName].buffer, getMimeType(message.fileName))
            : null;
      const result = await getContextualAiResponse(message, mediaDataUri, query);
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

  return (
    <div ref={viewRef} className="flex flex-1 flex-col h-full relative border-l">
      <div className="absolute top-2 right-2 z-10">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close Analysis</span>
        </Button>
      </div>
      <div className="p-4 border-b">
         <Card className="max-w-md mx-auto shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Selected Message</CardTitle>
            </CardHeader>
            <CardContent>
                <p className='text-sm text-muted-foreground'>From: {message.author} at {message.timestamp}</p>
                <div className="mt-2">
                {message.type === 'text' ? (
                    <p className="text-base whitespace-pre-wrap" dir="auto">{message.content}</p>
                ) : (
                    <MediaMessage message={message} mediaUrl={mediaUrl} />
                )}
                </div>
            </CardContent>
         </Card>
      </div>
       <QueryInterface
            conversation={conversation}
            onQuery={handleQuery}
            isLoading={isLoading}
            inputValue={queryInputValue}
            setInputValue={setQueryInputValue}
          />
    </div>
  );
}
