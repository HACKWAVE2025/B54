
'use server';
/**
 * @fileOverview A Genkit flow for analyzing crop health.
 *
 * This file defines:
 * - analyzeCrop: A function to analyze a crop's health from an image and description.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeCropInputSchema, AnalyzeCropOutputSchema, type AnalyzeCropInput, type AnalyzeCropOutput } from './crop-analysis-types';

export async function analyzeCrop(input: AnalyzeCropInput): Promise<AnalyzeCropOutput> {
  return analyzeCropFlow(input);
}

const analyzeCropPrompt = ai.definePrompt({
  name: 'analyzeCropPrompt',
  input: { schema: AnalyzeCropInputSchema },
  output: { schema: AnalyzeCropOutputSchema },
  prompt: `You are an expert agricultural AI assistant specializing in diagnosing crop diseases and recommending treatments. Your task is to analyze the provided information and respond ONLY with a valid JSON object matching the defined output schema.

Analysis Details:
- Language: {{{language}}}
- Crop Part: {{{cropPart}}}
- User Description: {{#if description}}"{{{description}}}"{{else}}"Not provided"{{/if}}
- Crop Image: {{media url=imageDataUri}}

Instructions:
1.  **Analyze the Image and Text**: Carefully examine the user's image and description to identify signs of diseases, nutrient deficiencies, or pest damage.
2.  **Provide a Summary**: Write a clear, concise summary in simple terms that a farmer can easily understand. This should be in the specified language.
3.  **Identify Diseases**: If any diseases are detected, list them in the 'potentialDiseases' array. For each, provide its common name and a brief explanation.
4.  **Suggest Fertilizers**: Based on signs of nutrient deficiencies (e.g., yellowing leaves), suggest appropriate fertilizers in the 'fertilizerSuggestions' array.
5.  **Suggest Pesticides**: If you identify specific pests or diseases that require it, suggest relevant pesticides or treatments in the 'pesticideSuggestions' array.
6.  **Empty Arrays**: If no diseases, fertilizer needs, or pesticides are identified, return empty arrays for the corresponding fields.
7.  **JSON Output**: Your entire response must be a single, valid JSON object with the keys "summary", "potentialDiseases", "fertilizerSuggestions", and "pesticideSuggestions". Do not include any text or markdown formatting before or after the JSON object.`,
});

const analyzeCropFlow = ai.defineFlow(
  {
    name: 'analyzeCropFlow',
    inputSchema: AnalyzeCropInputSchema,
    outputSchema: AnalyzeCropOutputSchema,
  },
  async (input) => {
    const llmResponse = await analyzeCropPrompt(input);
    const output = llmResponse.output;
    if (!output) {
      throw new Error('Crop analysis failed to produce a result.');
    }
    return output;
  }
);
