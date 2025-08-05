'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Bot, Send, User } from 'lucide-react';
import React, { useEffect, useRef, useState, useId } from 'react';
import { TtsDialog } from './tts-dialog';
import type { ParsedMessage } from '@/lib/parser';
import { MediaMessage } from './media-message';

// Make mermaid available globally
declare global {
    interface Window {
        mermaid: any;
    }
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  contextMessage?: ParsedMessage;
}

interface QueryInterfaceProps {
  conversation: AIMessage[];
  onQuery: (query: string) => void;
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  children?: React.ReactNode;
  mediaContent: Record<string, { url: string; buffer: ArrayBuffer }>;
}

const LoadingIndicator = () => (
  <div className="flex items-center gap-2">
    <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
  </div>
);

const ContextMessageDisplay = ({ message, mediaContent }: { message: ParsedMessage, mediaContent: QueryInterfaceProps['mediaContent'] }) => {
  const mediaUrl = message.fileName ? mediaContent[message.fileName]?.url : undefined;
  return (
    <div className="mb-2 rounded-md border border-dashed border-border bg-muted/50 p-2">
        <p className="text-xs text-muted-foreground mb-1">Replying to message from {message.author}:</p>
        <div className="max-h-24 overflow-auto rounded-sm bg-background/50 p-1">
             {message.type === 'text' ? (
                <p className="text-sm whitespace-pre-wrap" dir="auto">{message.content}</p>
            ) : (
                <MediaMessage message={message} mediaUrl={mediaUrl} />
            )}
        </div>
    </div>
  )
}


const AssistantMessage = ({ msg }: { msg: AIMessage }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [diagramHtml, setDiagramHtml] = useState('');
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const mermaidRegex = /(<pre\s+class="mermaid">[\s\S]*?<\/pre>)/;
    const match = msg.content.match(mermaidRegex);
    const mainText = msg.content.replace(mermaidRegex, '').trim();
    setTextContent(mainText);

    if (match) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = match[1];
      const mermaidCode = tempDiv.querySelector('.mermaid')?.textContent || '';

      if (mermaidCode && mermaidRef.current) {
        try {
          window.mermaid.render(`mermaid-svg-${mermaidRef.current.id}`, mermaidCode, (svgCode: string) => {
            setDiagramHtml(svgCode);
          });
        } catch (err: any) {
           console.error("Mermaid rendering error:", err);
           setError("Failed to render diagram.");
        }
      }
    } else {
        setDiagramHtml(''); // Clear previous diagrams if new content doesn't have one
    }
  }, [msg.content]);

  return (
      <div className="prose prose-sm max-w-none prose-p:m-0 [&_table]:my-2 [&_table]:w-full [&_th]:border [&_th]:p-2 [&_td]:border [&_td]:p-2">
          {textContent && <div dangerouslySetInnerHTML={{ __html: textContent }} />}
          
          <div ref={mermaidRef} id={useId()} className="flex justify-center p-4" dangerouslySetInnerHTML={{ __html: diagramHtml }} />
          
          {error && <div className="text-destructive p-2">{error}</div>}
      </div>
  );
};


export function QueryInterface({ conversation, onQuery, isLoading, inputValue, setInputValue, children, mediaContent }: QueryInterfaceProps) {
  const [isTtsDialogOpen, setIsTtsDialogOpen] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Scroll to bottom
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);


  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = inputValue.trim();
    if (!trimmedQuery || isLoading) return;

    if (trimmedQuery === '.stt') {
      setIsTtsDialogOpen(true);
      setInputValue('');
    } else {
      onQuery(trimmedQuery);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuerySubmit(e as unknown as React.FormEvent);
    }
  };
  
  const lastAssistantMessage = conversation.filter(m => m.role === 'assistant').pop()?.content || '';

  return (
    <>
    <TtsDialog 
      isOpen={isTtsDialogOpen}
      onOpenChange={setIsTtsDialogOpen}
      textToSpeak={lastAssistantMessage}
    />
    <div className="flex h-screen flex-col bg-muted/30">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-3xl p-4 md:p-8 space-y-6">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={cn('flex items-start gap-4', {
                  'justify-end': msg.role === 'user',
                })}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-2xl rounded-xl px-4 py-3 w-full',
                    msg.role === 'assistant'
                      ? 'bg-card text-card-foreground shadow-sm'
                      : 'bg-primary text-primary-foreground whitespace-pre-wrap ml-auto'
                  )}
                >
                  {msg.contextMessage && <ContextMessageDisplay message={msg.contextMessage} mediaContent={mediaContent} />}
                  
                  {msg.role === 'assistant' ? (
                      <AssistantMessage msg={msg} />
                  ) : (
                      <p className='whitespace-pre-wrap'>{msg.content}</p>
                  )}
                </div>
                 {msg.role === 'user' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className='bg-accent text-accent-foreground'><User size={20}/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4">
                <Avatar className="h-8 w-8 border">
                   <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                </Avatar>
                <div className="max-w-md rounded-xl px-4 py-3 bg-card text-card-foreground shadow-sm">
                  <LoadingIndicator />
                </div>
              </div>
            )}
             <div ref={conversationEndRef} />
          </div>
        </ScrollArea>
      </div>
      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl p-4 space-y-2">
          {children}
          <form onSubmit={handleQuerySubmit} className="relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the chat..."
              className="pr-20 min-h-[52px] resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
