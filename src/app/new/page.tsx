'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { parseChat } from '@/lib/parser';
import { createConversation } from '@/lib/db';

export default function NewChatPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [chatName, setChatName] = useState('');
  const [chatDescription, setChatDescription] = useState('');
  const [fileContent, setFileContent] = useState<{content: string, media: Record<string, ArrayBuffer>} | null>(null);

  const { toast } = useToast();
  const router = useRouter();


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      setFileName(file.name);
      
      try {
        if (file.type === 'text/plain') {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            setFileContent({ content, media: {} });
            setIsProcessing(false);
          };
          reader.onerror = () => {
            throw new Error('There was an error reading your file.');
          };
          reader.readAsText(file);
        } else if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          const chatFile = Object.values(zip.files).find(f => f.name.endsWith('.txt') && !f.dir);
          
          if (chatFile) {
            const chatContent = await chatFile.async('string');
            const mediaFiles: Record<string, ArrayBuffer> = {};
            
            const mediaFilePromises = [];
            for (const fileName in zip.files) {
              if (!zip.files[fileName].dir && !fileName.endsWith('.txt')) {
                 mediaFilePromises.push(
                    zip.files[fileName].async('arraybuffer').then(buffer => {
                        mediaFiles[fileName] = buffer;
                    })
                 );
              }
            }
            await Promise.all(mediaFilePromises);
            setFileContent({ content: chatContent, media: mediaFiles });
          } else {
            throw new Error('The ZIP file does not contain a chat text file (.txt).');
          }
        } else {
          throw new Error('Please upload a .txt or .zip file exported from WhatsApp.');
        }
      } catch (error) {
         toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: (error as Error).message,
          });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartConversation = async () => {
    if (!fileContent || !chatName.trim()) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please provide a chat name and upload a file.',
        });
        return;
    }

    setIsProcessing(true);

    try {
        const mediaFiles = Object.keys(fileContent.media);
        const parsed = parseChat(fileContent.content, mediaFiles);

        if (parsed.length === 0) {
            throw new Error('The file appears to be empty or in an unsupported format.');
        }
        
        const mediaData: Record<string, { url: string; buffer: ArrayBuffer }> = {};
        for (const fName in fileContent.media) {
            const buffer = fileContent.media[fName];
            // We won't generate blob URLs here to avoid memory leaks. They'll be generated on-the-fly when needed.
            mediaData[fName] = { url: '', buffer: buffer };
        }
        
        const newConversationId = await createConversation({
            name: chatName.trim(),
            description: chatDescription.trim(),
            chatText: fileContent.content,
            parsedChat: parsed,
            mediaContent: mediaData,
        });

        toast({
            title: 'Conversation Created',
            description: 'Your new chat is ready to be analyzed.',
        });

        router.push(`/chat/${newConversationId}`);

    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Processing Error',
            description: (error as Error).message || 'Could not process the chat file.',
        });
        setIsProcessing(false);
    }
  }

  if (!fileContent) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900/10 p-4">
        <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in-50 zoom-in-95 duration-500">
            <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Create New Conversation</CardTitle>
            <CardDescription className="text-muted-foreground">
                Upload your exported WhatsApp chat file (.txt or .zip) to begin.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.zip,application/zip"
                disabled={isProcessing}
            />
            <Button onClick={handleButtonClick} className="w-full" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Select Chat File'}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
                Your chat file is processed and stored locally in your browser.
            </p>
            </CardContent>
        </Card>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900/10 p-4">
        <Card className="w-full max-w-lg shadow-2xl animate-in fade-in-50 duration-500">
            <CardHeader>
                <CardTitle>Conversation Details</CardTitle>
                <CardDescription>Provide a name and optional description for your new conversation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className='space-y-2'>
                    <Label htmlFor='chat-name'>Conversation Name</Label>
                    <Input id="chat-name" value={chatName} onChange={e => setChatName(e.target.value)} placeholder="e.g., Family Group Chat Q1 2024" />
                </div>
                 <div className='space-y-2'>
                    <Label htmlFor='chat-description'>Description (Optional)</Label>
                    <Textarea id="chat-description" value={chatDescription} onChange={e => setChatDescription(e.target.value)} placeholder="A brief summary of what this chat is about." />
                </div>
                 <div className='space-y-2'>
                    <Label>Uploaded File</Label>
                    <p className='text-sm text-muted-foreground p-2 border rounded-md bg-muted'>{fileName}</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setFileContent(null)}>Choose another file</Button>
                <Button onClick={handleStartConversation} disabled={isProcessing || !chatName.trim()}>
                    {isProcessing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    Start Conversation
                </Button>
            </CardFooter>
        </Card>
    </div>
  )

}
