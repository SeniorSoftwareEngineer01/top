'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import type { ParsedMessage } from '@/lib/parser';
import { File, MessageSquareText, Mic, Video } from 'lucide-react';
import Image from 'next/image';

interface ChatViewProps {
  chat: ParsedMessage[];
  mediaContent: Record<string, string>;
}

const MediaMessage = ({ message, mediaUrl }: { message: ParsedMessage, mediaUrl?: string }) => {
  if (message.type === 'text') {
    return <p className="text-foreground/90 whitespace-pre-wrap text-right">{message.content}</p>;
  }

  if (!mediaUrl) {
    return (
       <div className="flex items-center gap-2 rounded-md bg-muted p-3">
          <File className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="font-semibold">{message.fileName}</p>
            <p className="text-xs text-muted-foreground">Media not available</p>
          </div>
       </div>
    );
  }
  
  switch (message.type) {
    case 'image':
      return <Image src={mediaUrl} alt={message.fileName || 'Chat image'} width={250} height={250} className="rounded-lg object-cover" />;
    case 'audio':
      return <audio controls src={mediaUrl} className="w-full" />;
    case 'video':
      return <video controls src={mediaUrl} className="max-w-full rounded-lg" />;
    default:
       return (
         <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <File className="h-6 w-6 text-muted-foreground" />
            <div>
                <p className="font-semibold">{message.fileName}</p>
                 <a href={mediaUrl} download={message.fileName} className="text-sm text-primary hover:underline">Download</a>
            </div>
         </div>
       );
  }
};


export function ChatView({ chat, mediaContent }: ChatViewProps) {
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
        <ScrollArea className="h-full px-4">
          <div className="space-y-4 py-4">
            {chat.map((msg, index) => (
              <div key={index} className="text-sm" dir="rtl">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-primary/80 truncate">{msg.author}</p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{msg.timestamp}</p>
                </div>
                 <MediaMessage message={msg} mediaUrl={msg.fileName ? mediaContent[msg.fileName] : undefined} />
              </div>
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>
    </>
  );
}
