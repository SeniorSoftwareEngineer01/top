'use client';

import type { ParsedMessage } from "@/lib/parser";
import { File } from "lucide-react";
import Image from "next/image";

interface MediaMessageProps {
    message: ParsedMessage;
    mediaUrl?: string;
}

export const MediaMessage = ({ message, mediaUrl }: MediaMessageProps) => {
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
