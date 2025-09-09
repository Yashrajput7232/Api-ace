
"use client";

import { Auth } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AuthPanelProps {
  auth: Auth;
  onUpdate: (auth: Auth) => void;
}

export function AuthPanel({ auth, onUpdate }: AuthPanelProps) {
  const handleTypeChange = (type: 'no-auth' | 'api-key' | 'bearer' | 'basic') => {
    let newAuth: Auth = { type };
    if (type === 'api-key') {
        newAuth.apiKey = auth.apiKey ?? { key: 'Authorization', value: '', in: 'header' };
    }
    if (type === 'bearer') {
        newAuth.bearer = auth.bearer ?? { token: '' };
    }
    if (type === 'basic') {
        newAuth.basic = auth.basic ?? { username: '', password: '' };
    }
    onUpdate(newAuth);
  };

  const handleApiKeyChange = (field: 'key' | 'value' | 'in', value: string) => {
    onUpdate({ ...auth, apiKey: { ...auth.apiKey!, [field]: value } });
  }

  const handleBearerChange = (token: string) => {
    onUpdate({ ...auth, bearer: { token } });
  }

  const handleBasicChange = (field: 'username' | 'password', value: string) => {
    onUpdate({ ...auth, basic: { ...auth.basic!, [field]: value } });
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Label htmlFor="auth-type" className="w-24">Auth Type</Label>
        <Select value={auth.type} onValueChange={handleTypeChange}>
          <SelectTrigger id="auth-type" className="w-[200px]">
            <SelectValue placeholder="Select auth type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-auth">No Auth</SelectItem>
            <SelectItem value="api-key">API Key</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {auth.type === 'api-key' && (
        <div className="p-4 border rounded-md space-y-4">
            <h3 className="font-medium">API Key</h3>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="api-key-key">Key</Label>
                    <Input id="api-key-key" value={auth.apiKey?.key} onChange={e => handleApiKeyChange('key', e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="api-key-value">Value</Label>
                    <Input id="api-key-value" type="password" value={auth.apiKey?.value} onChange={e => handleApiKeyChange('value', e.target.value)} />
                 </div>
            </div>
             <div className="space-y-2">
                <Label>Add to</Label>
                <RadioGroup value={auth.apiKey?.in} onValueChange={(val: 'header' | 'query') => handleApiKeyChange('in', val)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="header" id="in-header" />
                        <Label htmlFor="in-header">Header</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="query" id="in-query" />
                        <Label htmlFor="in-query">Query Params</Label>
                    </div>
                </RadioGroup>
             </div>
        </div>
      )}

      {auth.type === 'bearer' && (
         <div className="p-4 border rounded-md space-y-2">
            <h3 className="font-medium">Bearer Token</h3>
            <Label htmlFor="bearer-token">Token</Label>
            <Input id="bearer-token" type="password" value={auth.bearer?.token} onChange={e => handleBearerChange(e.target.value)} />
        </div>
      )}

      {auth.type === 'basic' && (
         <div className="p-4 border rounded-md space-y-4">
             <h3 className="font-medium">Basic Auth</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="basic-username">Username</Label>
                    <Input id="basic-username" value={auth.basic?.username} onChange={e => handleBasicChange('username', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="basic-password">Password</Label>
                    <Input id="basic-password" type="password" value={auth.basic?.password} onChange={e => handleBasicChange('password', e.target.value)} />
                </div>
             </div>
        </div>
      )}

    </div>
  );
}
