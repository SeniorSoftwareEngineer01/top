'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { textToSpeech } from '@/app/actions';
import { Loader2 } from 'lucide-react';

interface TtsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  textToSpeak: string;
}

export function TtsDialog({ isOpen, onOpenChange, textToSpeak }: TtsDialogProps) {
  const [voice, setVoice] = useState('Algenib');
  const [language, setLanguage] = useState('ar');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSpeech = async () => {
    if (!textToSpeak) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No text available to convert to speech.',
      });
      return;
    }

    setIsLoading(true);
    setAudioUrl(null);

    try {
      const result = await textToSpeech({
        text: textToSpeak,
        voice,
        language,
      });
      if (result.audioDataUri) {
        setAudioUrl(result.audioDataUri);
      } else {
        throw new Error('No audio data received.');
      }
    } catch (error) {
      console.error('TTS Error:', error);
      toast({
        variant: 'destructive',
        title: 'Speech Generation Failed',
        description: 'Could not generate audio. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Text-to-Speech Settings</DialogTitle>
          <DialogDescription>
            Convert the last AI response to speech. Choose the voice and language.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="voice" className="text-right">
              Voice
            </Label>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger id="voice" className="col-span-3">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Algenib">Algenib</SelectItem>
                <SelectItem value="Achernar">Achernar</SelectItem>
                <SelectItem value="Antares">Antares</SelectItem>
                <SelectItem value="Canopus">Canopus</SelectItem>
                <SelectItem value="Deneb">Deneb</SelectItem>
                <SelectItem value="Fomalhaut">Fomalhaut</SelectItem>
                <SelectItem value="Hadar">Hadar</SelectItem>
                <SelectItem value="Miaplacidus">Miaplacidus</SelectItem>
                <SelectItem value="Pollux">Pollux</SelectItem>
                <SelectItem value="Procyon">Procyon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              Language
            </Label>
             <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="col-span-3">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
           {audioUrl && (
            <div className="mt-4">
                <audio controls autoPlay className="w-full">
                    <source src={audioUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                </audio>
            </div>
           )}
        </div>
        <DialogFooter>
          <Button onClick={handleGenerateSpeech} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Generating...' : 'Generate Speech'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
