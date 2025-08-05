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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { testApiKey } from '@/app/actions';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentApiKey: string;
  onSave: (key: string) => void;
}

type TestState = 'idle' | 'loading' | 'success' | 'error';

export function ApiKeyDialog({ isOpen, onOpenChange, currentApiKey, onSave }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [testState, setTestState] = useState<TestState>('idle');
  const [testMessage, setTestMessage] = useState('');
  const { toast } = useToast();

  const handleTestKey = async () => {
    if (!apiKey) {
      setTestState('error');
      setTestMessage('Please enter an API key to test.');
      return;
    }
    setTestState('loading');
    setTestMessage('');
    try {
      const result = await testApiKey(apiKey);
      if (result.valid) {
        setTestState('success');
      } else {
        setTestState('error');
      }
      setTestMessage(result.message);
    } catch (error) {
      setTestState('error');
      setTestMessage((error as Error).message || 'An unexpected error occurred.');
    }
  };

  const handleSave = () => {
    if (!apiKey) {
        toast({
            variant: 'destructive',
            title: 'API Key Required',
            description: 'Please enter an API key before saving.',
        });
        return;
    }
    onSave(apiKey);
  }

  // Update internal state if the prop changes
  useState(() => {
    setApiKey(currentApiKey);
  });

  const renderTestResult = () => {
    if (testState === 'idle') return null;
    return (
        <Alert variant={testState === 'success' ? 'default' : 'destructive'} className='mt-4'>
            {testState === 'success' && <CheckCircle className='h-4 w-4'/>}
            {testState === 'error' && <XCircle className='h-4 w-4'/>}
            <AlertTitle>
                {testState === 'loading' && 'Testing...'}
                {testState === 'success' && 'Success!'}
                {testState === 'error' && 'Test Failed'}
            </AlertTitle>
            <AlertDescription>
                {testMessage}
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Set Gemini API Key</DialogTitle>
          <DialogDescription>
            Enter your Google AI Gemini API key below. Your key is stored locally in your browser and never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center gap-4">
            <Label htmlFor="api-key" className="text-left">
              API Key
            </Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setTestState('idle'); // Reset test state on change
              }}
              placeholder="Enter your Gemini API Key"
              className="col-span-3"
            />
          </div>
          {renderTestResult()}
        </div>
        <DialogFooter className='sm:justify-between'>
          <Button onClick={handleTestKey} variant="outline" disabled={testState === 'loading'}>
            {testState === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Key
          </Button>
          <Button onClick={handleSave}>
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
