'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { ParsedMessage } from '@/lib/parser';
import { MessageSquareText } from 'lucide-react';
import { MediaMessage } from './media-message';

interface ChatViewProps {
  chat: ParsedMessage[];
  mediaContent: Record<string, { url: string; buffer: ArrayBuffer }>;
  onMessageSelect: (message: ParsedMessage) => void;
  selectedMessage: ParsedMessage | null;
}

export function ChatView({ chat, mediaContent, onMessageSelect, selectedMessage }: ChatViewProps) {
  // A simple way to assign a color to each author
  const authorColors = new Map<string, string>();
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'];
  let colorIndex = 0;

  const getAuthorColor = (author: string) => {
    if (!authorColors.has(author)) {
      authorColors.set(author, colors[colorIndex % colors.length]);
      colorIndex++;
    }
    return authorColors.get(author);
  };

  const isUser = (author: string) => {
    // This is a simple heuristic. A more robust solution might be needed.
    return author.toLowerCase() === 'you' || author === 'أنت';
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <MessageSquareText className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Chat History</h2>
        </div>
        <Separator />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full px-4 bg-background">
          <div className="space-y-2 py-4">
            {chat.map((msg, index) => {
              const userMessage = isUser(msg.author);
              const mediaUrl = msg.fileName ? mediaContent[msg.fileName]?.url : undefined;
              const isSelected = selectedMessage?.timestamp === msg.timestamp && selectedMessage?.content === msg.content;
              
              return (
                <div
                  key={index}
                  className={cn('flex w-full items-end gap-2', {
                    'justify-end': userMessage,
                    'justify-start': !userMessage,
                  })}
                  onDoubleClick={() => onMessageSelect(msg)}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg px-3 py-2 shadow-sm flex flex-col cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                      userMessage
                        ? 'rounded-br-none bg-[hsl(var(--chat-bubble-user-background))] text-[hsl(var(--chat-bubble-user-foreground))]'
                        : 'rounded-bl-none bg-[hsl(var(--chat-bubble-other-background))] text-[hsl(var(--chat-bubble-other-foreground))]',
                      isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                  >
                    {!userMessage && (
                       <p className="text-xs font-bold" style={{ color: getAuthorColor(msg.author) }}>
                         {msg.author}
                       </p>
                    )}
                    
                    {(msg.type !== 'text' && msg.fileName) ? (
                        <div className='pt-1'>
                             <MediaMessage message={msg} mediaUrl={mediaUrl} />
                        </div>
                    ) : null}
                    
                    {msg.content && (
                        <p className="text-base whitespace-pre-wrap" dir="auto">{msg.content}</p>
                    )}

                    <p className="mt-1 text-right text-xs text-foreground/50 self-end">{msg.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SidebarContent>
    </>
  );
}
