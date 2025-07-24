'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import type { ChatMessage } from '@/lib/parser';
import { MessageSquareText } from 'lucide-react';

interface ChatViewProps {
  chat: ChatMessage[];
}

export function ChatView({ chat }: ChatViewProps) {
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
              <div key={index} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-primary/80 truncate">{msg.author}</p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{msg.timestamp}</p>
                </div>
                <p className="text-foreground/90 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>
    </>
  );
}
