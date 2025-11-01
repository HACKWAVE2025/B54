
'use server';
/**
 * @fileOverview A Genkit flow for analyzing medicines.
 *
 * This file defines:
 * - analyzeMedicine: A function to analyze a medicine's ingredients and purpose.
 * - MedicineAnalysisInput: The Zod schema for the input.
 * - MedicineAnalysisOutput: The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MedicineAnalysisInputSchema = z.object({
  medicineName: z.string().describe('The name of the medicine to be analyzed.'),
});
export type MedicineAnalysisInput = z.infer<typeof MedicineAnalysisInputSchema>;

const IngredientSchema = z.object({
  name: z.string().describe('The name of the ingredient.'),
  func: z.string().describe('A detailed explanation of how this specific ingredient functions in the body.'),
});

const MedicineAnalysisOutputSchema = z.object({
  usage: z.string().describe('A clear and concise summary of what the medicine is primarily used for. If the medicine is not found, this field should state that.'),
  ingredients: z.array(IngredientSchema).describe('An array of the active ingredients found in the medicine. Should be an empty array if the medicine is not found.'),
});
export type MedicineAnalysisOutput = z.infer<typeof MedicineAnalysisOutputSchema>;


export async function analyzeMedicine(input: MedicineAnalysisInput): Promise<MedicineAnalysisOutput> {
  return analyzeMedicineFlow(input);
}

const analyzeMedicinePrompt = ai.definePrompt({
  name: 'analyzeMedicinePrompt',
  input: { schema: MedicineAnalysisInputSchema },
  output: { schema: MedicineAnalysisOutputSchema },
  prompt: `You are an expert pharmacologist AI assistant. Your task is to provide a detailed analysis of a given medicine, and you must respond ONLY with a valid JSON object matching the defined output schema.

Medicine Name: {{{medicineName}}}

Analysis Instructions:
1.  **Find the Medicine**: Search your knowledge base for the specified medicine.
2.  **Usage (usage)**: Clearly explain the primary medical purpose of this medicine. What conditions or symptoms does it treat?
3.  **Ingredients (ingredients)**: Identify the key active ingredients in the medicine. For each ingredient, provide its name and a detailed but easy-to-understand explanation of its function (i.e., its mechanism of action).
4.  **If Medicine is Not Found**: If you cannot find any information about the medicine, you MUST return a valid JSON object where the 'usage' field contains a message like "Information could not be found for [Medicine Name]." and the 'ingredients' field is an empty array [].
5.  **JSON Output**: Your entire response must be a single, valid JSON object with two keys: "usage" and "ingredients". Do not include any text, explanations, or markdown formatting before or after the JSON object.`,
});

const analyzeMedicineFlow = ai.defineFlow(
  {
    name: 'analyzeMedicineFlow',
    inputSchema: MedicineAnalysisInputSchema,
    outputSchema: MedicineAnalysisOutputSchema,
  },
  async (input) => {
    const llmResponse = await analyzeMedicinePrompt(input);
    const output = llmResponse.output;
    if (!output) {
      throw new Error('Medicine analysis failed to produce a result.');
    }
    return output;
  }
);
