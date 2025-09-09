"use client";

import { suggestAPIParameters } from "@/ai/flows/suggest-api-parameters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";

interface SuggestParametersProps {
  onSelect: (parameter: string) => void;
}

export function SuggestParameters({ onSelect }: SuggestParametersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuggest = async () => {
    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: "Description is empty",
        description: "Please describe the data you are looking for.",
      });
      return;
    }
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await suggestAPIParameters({ dataDescription: description });
      setSuggestions(result.suggestedParameters);
    } catch (error) {
      console.error("AI suggestion failed:", error);
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectParameter = (param: string) => {
    onSelect(param);
    setIsOpen(false);
    toast({
        title: "Parameter Added",
        description: `"${param}" has been added to your request params.`,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Suggest Parameters with AI">
          <Sparkles className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Suggest API Parameters</DialogTitle>
          <DialogDescription>
            Describe the data you're looking for, and AI will suggest relevant
            API parameters. For example: "A list of products in the 'electronics' category".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Type your data description here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
           {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="ml-2">Generating suggestions...</p>
            </div>
          )}
          {suggestions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Suggestions:</h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((param) => (
                    <Button key={param} variant="secondary" size="sm" onClick={() => handleSelectParameter(param)}>
                        {param}
                    </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSuggest} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Suggest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
