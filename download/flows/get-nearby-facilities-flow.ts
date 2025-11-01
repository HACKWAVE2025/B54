'use server';
/**
 * @fileOverview A Genkit flow for finding nearby medical facilities.
 *
 * This file defines:
 * - getNearbyFacilities: A function to find nearby facilities.
 * - GetNearbyFacilitiesInput: The Zod schema for the input.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetNearbyFacilitiesInputSchema = z.object({
  location: z.string().describe("The user's current location (e.g., 'Hyderabad, India' or latitude,longitude)."),
  facilityType: z.string().describe("The type of facility to search for (e.g., 'Hospitals', 'Pharmacies')."),
});

export type GetNearbyFacilitiesInput = z.infer<typeof GetNearbyFacilitiesInputSchema>;

export async function getNearbyFacilities(input: GetNearbyFacilitiesInput): Promise<string> {
  const llmResponse = await getNearbyFacilitiesFlow(input);
  return llmResponse;
}

const getNearbyFacilitiesFlow = ai.defineFlow(
  {
    name: 'getNearbyFacilitiesFlow',
    inputSchema: GetNearbyFacilitiesInputSchema,
    outputSchema: z.string(),
  },
  async ({ location, facilityType }) => {
    const prompt = `
      You are a helpful local search assistant.
      A user is looking for the top 3 rated '${facilityType}' near '${location}'.

      Based on your knowledge, provide a list of the top 3 facilities.
      For each facility, provide the following details:
      - name: The name of the facility.
      - rating: The public rating, as a number (e.g., 4.5).
      - address: The full street address.

      Return the answer ONLY as a valid, minified JSON array.
      Do not include any other text, explanations, or markdown formatting.
      The JSON array should look like this:
      [{"name":"Facility Name 1","rating":4.8,"address":"123 Main St, City"}, {"name":"..."}, {"name":"..."}]
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
    });

    return llmResponse.text;
  }
);
