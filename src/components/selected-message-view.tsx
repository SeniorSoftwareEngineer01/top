'use client';

import type { ParsedMessage } from '@/lib/parser';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MediaMessage } from './media-message';
import { Button } from './ui/button';
import { X, Paperclip } from 'lucide-react';

interface SelectedMessageViewProps {
  message: ParsedMessage;
  mediaContent: Record<string, { url: string; buffer: ArrayBuffer }>;
  onClose: () => void;
}

export function SelectedMessageView({ message, mediaContent, onClose }: SelectedMessageViewProps) {
  const mediaUrl = message.fileName ? mediaContent[message.fileName]?.url : undefined;

  return (
    <div className="relative rounded-lg border bg-background/70 p-3 animate-in fade-in-50">
      <div className="flex items-start gap-3">
        <Paperclip className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex-1">
            <p className="text-sm font-semibold">Replying to message from {message.author}</p>
            <div className="mt-1 text-sm text-muted-foreground max-h-20 overflow-auto">
                 {message.type === 'text' ? (
                    <p className="whitespace-pre-wrap" dir="auto">{message.content}</p>
                ) : (
                    <MediaMessage message={message} mediaUrl={mediaUrl} />
                )}
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 flex-shrink-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Cancel reply</span>
        </Button>
      </div>
    </div>
  );
}
