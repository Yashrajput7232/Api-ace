"use client";
import React, { useState } from 'react';
import type { Collection } from '@/types';
import { useApiAce } from '@/hooks/use-api-ace';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HttpMethodBadge } from '../request/http-method-badge';
import { MoreHorizontal, Download, Edit, Trash2, Plus, Check, X, Copy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
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

interface CollectionItemProps {
  collection: Collection;
}

export function CollectionItem({ collection }: CollectionItemProps) {
  const { openRequestInTab, exportCollection, updateCollectionName, deleteCollection, createRequest, deleteRequest } = useApiAce();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(collection.name);
  const [newRequestName, setNewRequestName] = useState('');
  const [isAddingRequest, setIsAddingRequest] = useState(false);
  const { toast } = useToast();

  const handleRename = () => {
    if (newName.trim() && newName !== collection.name) {
      updateCollectionName(collection.id, newName.trim());
    }
    setIsEditing(false);
  };
  
  const handleCreateRequest = () => {
    if (newRequestName.trim()) {
      const updatedCollection = { ...collection, requests: [...collection.requests, {id: crypto.randomUUID(), name: newRequestName, collectionId: collection.id, method: 'GET', url: '', params: [], headers: [], body: ''}]};
      createRequest(collection.id, newRequestName);
      setNewRequestName('');
      setIsAddingRequest(false);
    }
  };

  const copyAccessCode = () => {
    navigator.clipboard.writeText(collection.id);
    toast({ title: 'Access Code Copied', description: 'The collection access code has been copied to your clipboard.' });
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={collection.id} className="border rounded-md">
        <AccordionTrigger className="px-2 hover:no-underline">
          <div className="flex items-center w-full">
            {isEditing ? (
              <div className="flex-1 flex items-center gap-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  className="h-7"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); handleRename();}}><Check className="h-4 w-4"/></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); setIsEditing(false);}}><X className="h-4 w-4"/></Button>
              </div>
            ) : (
              <span className="flex-1 text-left truncate font-semibold">{collection.name}</span>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportCollection(collection.id)}><Download className="mr-2 h-4 w-4" /> Export</DropdownMenuItem>
                <DropdownMenuItem onClick={copyAccessCode}><Copy className="mr-2 h-4 w-4" /> Copy Access Code</DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the collection "{collection.name}" and all its requests. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCollection(collection.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-2 pb-2">
          <div className="space-y-1">
            {collection.requests.map((request) => (
               <div key={request.id} className="group flex items-center justify-between rounded-md hover:bg-muted/50">
                 <button
                   onClick={() => openRequestInTab(request.id)}
                   className="flex-1 flex items-center gap-2 p-1.5 text-left"
                 >
                  <HttpMethodBadge method={request.method} />
                  <span className="truncate text-sm">{request.name}</span>
                 </button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                         <AlertDialogHeader>
                            <AlertDialogTitle>Delete Request?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the request "{request.name}"?
                            </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction onClick={() => deleteRequest(collection.id, request.id)}>Delete</AlertDialogAction>
                         </AlertDialogFooter>
                     </AlertDialogContent>
                 </AlertDialog>
               </div>
            ))}
            {isAddingRequest ? (
                <div className="flex items-center gap-1 p-1">
                    <Input 
                        placeholder="New request name"
                        value={newRequestName}
                        onChange={e => setNewRequestName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateRequest()}
                        className="h-7 text-sm"
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCreateRequest}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsAddingRequest(false)}><X className="h-4 w-4" /></Button>
                </div>
            ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingRequest(true)}
                  className="w-full justify-start mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Request
                </Button>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
