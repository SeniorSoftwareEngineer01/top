'use client';

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatUploadProps {
  onUpload: (fileContent: string) => void;
}

export function ChatUpload({ onUpload }: ChatUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/plain') {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a .txt file exported from WhatsApp.',
        });
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUpload(content);
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'File Read Error',
          description: 'There was an error reading your file. Please try again.',
        });
        setIsUploading(false);
      };
      reader.readAsText(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900/10 p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in-50 zoom-in-95 duration-500">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">WhatsAnalyzer</CardTitle>
          <CardDescription className="text-muted-foreground">
            Upload your exported WhatsApp chat file (.txt) to begin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt"
            disabled={isUploading}
          />
          <Button onClick={handleButtonClick} className="w-full" disabled={isUploading}>
            {isUploading ? 'Processing...' : 'Select Chat File'}
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Your chat file is processed locally in your browser and is never sent to our servers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
