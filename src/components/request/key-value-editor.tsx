"use client";
import React from 'react';
import type { KeyValue } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';

interface KeyValueEditorProps {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
}

export function KeyValueEditor({ items, onChange }: KeyValueEditorProps) {
  const handleItemChange = (id: string, field: 'key' | 'value', value: string) => {
    onChange(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleToggle = (id: string, enabled: boolean) => {
    onChange(items.map(item => item.id === id ? { ...item, enabled } : item));
  };

  const handleAddItem = () => {
    onChange([...items, { id: crypto.randomUUID(), key: '', value: '', enabled: true }]);
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Checkbox
            checked={item.enabled}
            onCheckedChange={(checked) => handleToggle(item.id, !!checked)}
          />
          <Input
            placeholder="Key"
            value={item.key}
            onChange={(e) => handleItemChange(item.id, 'key', e.target.value)}
          />
          <Input
            placeholder="Value"
            value={item.value}
            onChange={(e) => handleItemChange(item.id, 'value', e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveItem(item.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={handleAddItem}>
        <Plus className="mr-2 h-4 w-4" /> Add
      </Button>
    </div>
  );
}
