'use client';

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

interface LangDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export function LangDialog({ isOpen, onOpenChange, currentLanguage, onLanguageChange }: LangDialogProps) {
  const { toast } = useToast();

  const handleLanguageChange = (lang: string) => {
    onLanguageChange(lang);
    toast({
        title: 'Language Updated',
        description: `AI responses will now be in ${lang === 'ar' ? 'Arabic' : 'French'}.`
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Language</DialogTitle>
          <DialogDescription>
            Select the language for the AI to respond in.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              Language
            </Label>
             <Select defaultValue={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language" className="col-span-3">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
