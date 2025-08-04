'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Bot, Send, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { TtsDialog } from './tts-dialog';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface QueryInterfaceProps {
  conversation: AIMessage[];
  onQuery: (query: string) => void;
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  children?: React.ReactNode;
}

const LoadingIndicator = () => (
  <div className="flex items-center gap-2">
    <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
  </div>
);

export function QueryInterface({ conversation, onQuery, isLoading, inputValue, setInputValue, children }: QueryInterfaceProps) {
  const [isTtsDialogOpen, setIsTtsDialogOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation, isLoading]);

  useEffect(() => {
    if (inputValue && textAreaRef.current) {
      textAreaRef.current.focus();
      // Move cursor to the end
      const len = inputValue.length;
      textAreaRef.current.setSelectionRange(len, len);
    }
  }, [inputValue]);


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
        <ScrollArea className="h-full" ref={scrollAreaRef}>
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
                    'max-w-md rounded-xl px-4 py-3 whitespace-pre-wrap',
                    msg.role === 'assistant'
                      ? 'bg-card text-card-foreground shadow-sm'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {msg.content}
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
          </div>
        </ScrollArea>
      </div>
      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl p-4 space-y-2">
          {children}
          <form onSubmit={handleQuerySubmit} className="relative">
            <Textarea
              ref={textAreaRef}
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
