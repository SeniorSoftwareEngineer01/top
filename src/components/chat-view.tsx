'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { ParsedMessage } from '@/lib/parser';
import { File, MessageSquareText } from 'lucide-react';
import Image from 'next/image';

interface ChatViewProps {
  chat: ParsedMessage[];
  mediaContent: Record<string, string>;
}

const MediaMessage = ({ message, mediaUrl }: { message: ParsedMessage; mediaUrl?: string }) => {
  if (!mediaUrl) {
    if (message.type === 'media_missing') {
       return <p className="text-sm italic text-muted-foreground">{message.content}</p>;
    }
    return (
      <div className="flex items-center gap-2 rounded-md bg-black/10 p-3 dark:bg-white/10">
        <File className="h-6 w-6" />
        <div>
          <p className="font-semibold">{message.fileName}</p>
          <p className="text-xs">Media not available</p>
        </div>
      </div>
    );
  }

  switch (message.type) {
    case 'image':
      return <Image src={mediaUrl} alt={message.fileName || 'Chat image'} width={300} height={300} className="rounded-lg object-cover" />;
    case 'audio':
      return <audio controls src={mediaUrl} className="w-full" />;
    case 'video':
      return <video controls src={mediaUrl} className="max-w-full rounded-lg" />;
    default:
      return (
        <div className="flex items-center gap-2 rounded-md bg-black/10 p-3 dark:bg-white/10">
          <File className="h-6 w-6" />
          <div>
            <p className="font-semibold">{message.fileName}</p>
            <a href={mediaUrl} download={message.fileName} className="text-sm text-primary hover:underline">Download</a>
          </div>
        </div>
      );
  }
};

export function ChatView({ chat, mediaContent }: ChatViewProps) {
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
              return (
                <div
                  key={index}
                  className={cn('flex items-end gap-2', {
                    'justify-end': userMessage,
                    'justify-start': !userMessage,
                  })}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg px-3 py-2 shadow-sm',
                      userMessage
                        ? 'rounded-br-none bg-[hsl(var(--chat-bubble-user-background))] text-[hsl(var(--chat-bubble-user-foreground))]'
                        : 'rounded-bl-none bg-[hsl(var(--chat-bubble-other-background))] text-[hsl(var(--chat-bubble-other-foreground))]'
                    )}
                  >
                    {!userMessage && (
                       <p className="text-xs font-bold" style={{ color: getAuthorColor(msg.author) }}>
                         {msg.author}
                       </p>
                    )}
                    
                    {msg.type === 'text' && (
                        <p className="text-base whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {(msg.type !== 'text' && msg.fileName) && (
                        <div className='pt-1'>
                             <MediaMessage message={msg} mediaUrl={mediaContent[msg.fileName]} />
                        </div>
                    )}

                    <p className="mt-1 text-right text-xs text-foreground/50">{msg.timestamp}</p>
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
