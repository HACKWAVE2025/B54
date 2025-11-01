'use server';
/**
 * @fileOverview A Genkit flow for analyzing medical reports.
 *
 * This file defines:
 * - analyzeMedicalReport: A function to analyze a medical report.
 * - AnalyzeMedicalReportInput: The Zod schema for the input.
 * - AnalyzeMedicalReportOutput: The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMedicalReportInputSchema = z.object({
  reportText: z.string().optional().describe('The text of the medical report.'),
  reportType: z.string().describe('The type of medical report (e.g., Lab Report, ECG, Imaging).'),
  language: z.string().describe('The desired language for the analysis output.'),
  imageDataUri: z.string().optional().describe("An image of the report, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AnalyzeMedicalReportInput = z.infer<typeof AnalyzeMedicalReportInputSchema>;

const AnalyzeMedicalReportOutputSchema = z.object({
  patientSummary: z.string().describe("A summary of the analysis in simple, easy-to-understand language for the patient."),
  radiologistAnalysis: z.string().describe('A detailed, technical, radiologist-level analysis of the provided medical report.'),
  isCritical: z.boolean().describe('A boolean flag indicating if a life-threatening condition like a heart attack is detected, especially in an ECG report.'),
});
export type AnalyzeMedicalReportOutput = z.infer<typeof AnalyzeMedicalReportOutputSchema>;

export async function analyzeMedicalReport(input: AnalyzeMedicalReportInput): Promise<AnalyzeMedicalReportOutput> {
  return analyzeMedicalReportFlow(input);
}

const analyzeMedicalReportPrompt = ai.definePrompt({
  name: 'analyzeMedicalReportPrompt',
  input: { schema: AnalyzeMedicalReportInputSchema },
  output: { schema: AnalyzeMedicalReportOutputSchema },
  prompt: `You are an expert AI medical assistant specializing in analyzing various medical reports including text and images (like CT scans or ultrasounds). Your task is to provide a comprehensive analysis based on the provided report, and respond ONLY with a valid JSON object matching the defined output schema.

Report Type: {{{reportType}}}
Desired Language for Analysis: {{{language}}}

Analyze the following medical report information. Prioritize the image if provided, as it is the primary source.
{{#if reportText}}
Report Text:
{{{reportText}}}
{{/if}}

{{#if imageDataUri}}
Report Image:
{{media url=imageDataUri}}
{{/if}}

Analysis Instructions:
1.  **Patient Summary (patientSummary)**: Write a summary of the findings in simple, clear, and non-technical language that a patient can easily understand. Explain what the results mean in general terms.
2.  **Radiologist-Level Analysis (radiologistAnalysis)**: Provide a comprehensive, detailed, and technical analysis of the report, as a radiologist would. Explain the findings, break down results, and note any abnormalities with specific medical terminology. CRITICALLY, you MUST define any complex medical terms you use in parentheses immediately after the term (e.g., "myocardial infarction (the medical term for a heart attack)").
3.  **Critical Condition Check (isCritical)**: If the 'reportType' is 'ECG', you MUST carefully analyze it for any signs of a myocardial infarction (heart attack). If you detect clear signs of a heart attack, set the 'isCritical' flag to true. Otherwise, set it to false. For all other report types, set 'isCritical' to false.
4.  **Kidney Analysis (from any report type)**: Regardless of the 'reportType', you must carefully check the content (text or image) for any information related to the urinary system (kidneys, ureters, bladder). If a kidney stone is detected, your analysis in both 'patientSummary' and 'radiologistAnalysis' MUST explicitly state its exact location (e.g., left kidney, right ureter) and its size with the proper units (e.g., mm, cm).
5.  **Language**: All parts of the analysis must be in the specified language: {{{language}}}.
6.  **JSON Output**: Your entire response must be a single, valid JSON object with three keys: "patientSummary", "radiologistAnalysis", and "isCritical". Do not include any text or markdown formatting before or after the JSON object.`,
});

const analyzeMedicalReportFlow = ai.defineFlow(
  {
    name: 'analyzeMedicalReportFlow',
    inputSchema: AnalyzeMedicalReportInputSchema,
    outputSchema: AnalyzeMedicalReportOutputSchema,
  },
  async (input) => {
    const llmResponse = await analyzeMedicalReportPrompt(input);
    const output = llmResponse.output;
    if (!output) {
      throw new Error('Analysis failed to produce a result.');
    }
    return output;
  }
);
