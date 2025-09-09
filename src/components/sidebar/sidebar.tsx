"use client";

import React, { useState, useRef } from 'react';
import { useApiAce } from '@/hooks/use-api-ace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CollectionItem } from './collection-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '../theme-toggle';
import { AuthDialog } from '../auth/auth-dialog';

export function Sidebar() {
  const { state, createCollection, importCollections } = useApiAce();
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim());
      setNewCollectionName('');
      setCreateDialogOpen(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json') {
        importCollections(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please select a valid JSON file.",
        });
      }
    }
    event.target.value = '';
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-headline font-bold text-primary">API Ace</h1>
        <p className="text-sm text-muted-foreground">Client-Side API Tester</p>
      </div>

      <div className="p-2 grid grid-cols-2 gap-2">
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex-1">
              <Plus className="mr-2 h-4 w-4" /> New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Collection name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
            />
            <DialogFooter>
              <Button onClick={handleCreateCollection}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button size="sm" variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" /> Import (Local)
        </Button>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            className="hidden"
            accept=".json,application/json"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {state.collections.map((collection) => (
            <CollectionItem key={collection.id} collection={collection} />
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t mt-auto flex flex-col gap-2">
        <AuthDialog />
        <ThemeToggle />
      </div>
    </div>
  );
}
