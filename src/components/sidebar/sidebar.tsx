"use client";

import React, { useState, useRef } from 'react';
import { useApiAce } from '@/hooks/use-api-ace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CollectionItem } from './collection-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Upload, Download, CloudDownload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '../theme-toggle';

export function Sidebar() {
  const { state, createCollection, importCollections, importFromCloud } = useApiAce();
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
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
    // Reset file input
    event.target.value = '';
  };

  const handleCloudImport = async () => {
    if (!accessCode.trim()) {
      toast({ variant: 'destructive', title: 'Access code is required.' });
      return;
    }
    setIsImporting(true);
    const success = await importFromCloud(accessCode);
    setIsImporting(false);
    if(success) {
      setImportDialogOpen(false);
      setAccessCode('');
    }
  }


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

        <Dialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="col-span-2">
                <CloudDownload className="mr-2 h-4 w-4" /> Import from Cloud
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import from Cloud</DialogTitle>
              <DialogDescription>Enter the access code for the collection you want to import.</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Access Code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCloudImport()}
            />
            <DialogFooter>
              <Button onClick={handleCloudImport} disabled={isImporting}>
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {state.collections.map((collection) => (
            <CollectionItem key={collection.id} collection={collection} />
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t mt-auto">
        <ThemeToggle />
      </div>
    </div>
  );
}
