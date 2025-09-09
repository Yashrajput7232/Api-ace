'use server';

/**
 * @fileOverview A flow that suggests API parameters based on a user's description of the data they're looking for.
 *
 * - suggestAPIParameters - A function that suggests API parameters.
 * - SuggestAPIParametersInput - The input type for the suggestAPIParameters function.
 * - SuggestAPIParametersOutput - The return type for the suggestAPIParameters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAPIParametersInputSchema = z.object({
  dataDescription: z.string().describe('A description of the type of data the user is looking for from an API endpoint.'),
});
export type SuggestAPIParametersInput = z.infer<typeof SuggestAPIParametersInputSchema>;

const SuggestAPIParametersOutputSchema = z.object({
  suggestedParameters: z.array(z.string()).describe('An array of suggested API parameters based on the data description.'),
});
export type SuggestAPIParametersOutput = z.infer<typeof SuggestAPIParametersOutputSchema>;

export async function suggestAPIParameters(input: SuggestAPIParametersInput): Promise<SuggestAPIParametersOutput> {
  return suggestAPIParametersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAPIParametersPrompt',
  input: {schema: SuggestAPIParametersInputSchema},
  output: {schema: SuggestAPIParametersOutputSchema},
  prompt: `You are an API expert.  Based on the user's description of the data they are looking for, suggest relevant API parameters.

Data Description: {{{dataDescription}}}

Suggest a list of parameters that would be appropriate for this API.`,
});

const suggestAPIParametersFlow = ai.defineFlow(
  {
    name: 'suggestAPIParametersFlow',
    inputSchema: SuggestAPIParametersInputSchema,
    outputSchema: SuggestAPIParametersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
