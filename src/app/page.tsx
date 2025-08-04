'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  getAllConversations,
  deleteConversation,
  updateConversationName,
  type Conversation,
} from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquarePlus, MoreVertical, Trash2, Pencil } from 'lucide-react';

export default function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadConversations() {
      try {
        const convos = await getAllConversations();
        setConversations(convos);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Database Error',
          description: 'Could not load conversations.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadConversations();
  }, [toast]);

  const handleDelete = async (id: number) => {
    try {
      await deleteConversation(id);
      setConversations(conversations.filter((c) => c.id !== id));
      toast({
        title: 'Conversation Deleted',
        description: 'The conversation has been successfully deleted.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete conversation.',
      });
    }
  };

  const handleRename = async (id: number) => {
    if (!newName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Name',
        description: 'Conversation name cannot be empty.',
      });
      return;
    }
    try {
      await updateConversationName(id, newName.trim());
      setConversations(
        conversations.map((c) =>
          c.id === id ? { ...c, name: newName.trim() } : c
        )
      );
      toast({
        title: 'Conversation Renamed',
        description: `The conversation was renamed to "${newName.trim()}".`,
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to rename conversation.',
      });
    } finally {
        setIsRenaming(false);
        setNewName('');
        setRenamingId(null);
    }
  };
  
  const openRenameDialog = (conversation: Conversation) => {
    setRenamingId(conversation.id);
    setNewName(conversation.name);
    setIsRenaming(true);
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <h1 className="text-2xl font-bold">My Conversations</h1>
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-3/4 rounded bg-muted"></div>
                  <div className="h-4 w-1/2 rounded bg-muted mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full rounded bg-muted"></div>
                </CardContent>
                <CardFooter>
                    <div className="h-8 w-20 rounded bg-muted"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                No conversations yet
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Start a new conversation to analyze your WhatsApp chats.
              </p>
              <Button onClick={() => router.push('/new')}>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                New Conversation
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {conversations.map((convo) => (
              <Card key={convo.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div className='flex-1'>
                        <CardTitle className="truncate">{convo.name}</CardTitle>
                        <CardDescription>
                            Created{' '}
                            {formatDistanceToNow(new Date(convo.createdAt), { addSuffix: true })}
                        </CardDescription>
                    </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openRenameDialog(convo)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                <span className='text-destructive'>Delete</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                conversation and all its associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(convo.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {convo.description || 'No description provided.'}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className='w-full'>
                    <Link href={`/chat/${convo.id}`}>Open Chat</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
       <AlertDialog open={isRenaming} onOpenChange={setIsRenaming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename Conversation</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new name for this conversation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New conversation name"
                    onKeyDown={(e) => e.key === 'Enter' && renamingId && handleRename(renamingId)}
                />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsRenaming(false); setRenamingId(null); setNewName(''); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => renamingId && handleRename(renamingId)} disabled={!newName.trim()}>
                Rename
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Link href="/new" passHref>
            <Button
              className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
              size="icon"
            >
              <MessageSquarePlus className="h-8 w-8" />
              <span className="sr-only">New Conversation</span>
            </Button>
        </Link>
    </div>
  );
}
