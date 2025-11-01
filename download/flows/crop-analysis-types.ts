
import { z } from 'genkit';

export const AnalyzeCropInputSchema = z.object({
  imageDataUri: z.string().describe("An image of the crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  description: z.string().optional().describe('A description of the crop or any observed symptoms.'),
  cropPart: z.string().describe('The part of the crop being analyzed (e.g., Leaf, Stem, Fruit, Soil).'),
  language: z.string().describe('The language for the analysis output.'),
});
export type AnalyzeCropInput = z.infer<typeof AnalyzeCropInputSchema>;

const DiseaseSchema = z.object({
    name: z.string().describe("The common name of the potential disease."),
    explanation: z.string().describe("A brief explanation of what the disease is and its common symptoms.")
});

const FertilizerSchema = z.object({
    name: z.string().describe("The name of the suggested fertilizer (e.g., 'Nitrogen-rich fertilizer', 'Potassium supplement')."),
    reason: z.string().describe("The reason why this fertilizer is being suggested based on the visual analysis.")
});

const PesticideSchema = z.object({
    name: z.string().describe("The name of the suggested pesticide or type of treatment (e.g., 'Neem oil', 'Fungicide spray')."),
    reason: z.string().describe("The reason why this pesticide is being suggested, linked to a specific pest or disease identified.")
});

export const AnalyzeCropOutputSchema = z.object({
  summary: z.string().describe("A farmer-friendly summary of the overall crop health and key findings, written in the requested language."),
  potentialDiseases: z.array(DiseaseSchema).describe("An array of potential diseases identified from the image and description."),
  fertilizerSuggestions: z.array(FertilizerSchema).describe("An array of fertilizer suggestions to improve crop health."),
  pesticideSuggestions: z.array(PesticideSchema).describe("An array of pesticide suggestions to combat identified issues.")
});
export type AnalyzeCropOutput = z.infer<typeof AnalyzeCropOutputSchema>;
