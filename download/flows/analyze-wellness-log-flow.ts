'use server';
/**
 * @fileOverview A Genkit flow for analyzing a user's wellness log.
 *
 * This file defines:
 * - analyzeWellnessLog: A function to analyze food and activity for health impacts.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeWellnessLogInputSchema, AnalyzeWellnessLogOutputSchema, type AnalyzeWellnessLogInput, type AnalyzeWellnessLogOutput } from './wellness-analysis-types';

export async function analyzeWellnessLog(input: AnalyzeWellnessLogInput): Promise<AnalyzeWellnessLogOutput> {
  return analyzeWellnessLogFlow(input);
}

const analyzeWellnessLogPrompt = ai.definePrompt({
  name: 'analyzeWellnessLogPrompt',
  input: { schema: AnalyzeWellnessLogInputSchema },
  output: { schema: AnalyzeWellnessLogOutputSchema },
  prompt: `You are an expert AI health and wellness assistant. Your task is to analyze a user's daily food and activity log to predict the likely short-term impact on their key health metrics. Respond ONLY with a valid JSON object matching the defined output schema.

User's Log:
- Food Intake: {{{foodIntake}}}
- Activity Type: {{#if activityType}}"{{{activityType}}}"{{else}}"Not provided"{{/if}}
- Activity Duration: {{#if activityDuration}}{{{activityDuration}}} minutes{{else}}Not provided{{/if}}

Analysis Instructions:
1.  **Analyze the Inputs**: Carefully evaluate the food intake (considering type, quantity, likely carbs, fats, and sugars) and the physical activity (type and duration).
2.  **Predict Impact on Diabetes (Blood Sugar)**: Based on the food's likely glycemic index and the effect of the exercise, predict the short-term effect on blood sugar. The 'level' should be 'Positive', 'Neutral', or 'Negative'. Provide a brief 'explanation'. For example, a sugary meal would have a 'Negative' impact, while a balanced meal and exercise would be 'Positive'.
3.  **Predict Impact on Blood Pressure**: Assess how the food (e.g., high sodium) and activity might influence blood pressure in the short term.
4.  **Predict Impact on Cholesterol**: Assess how the dietary fats (saturated, unsaturated) in the meal could influence cholesterol.
5.  **Overall Summary**: Provide a brief, encouraging, and actionable summary of the analysis.
6.  **JSON Output**: Your entire response must be a single, valid JSON object with the specified keys. Do not include any text or markdown formatting before or after the JSON object.`,
});

const analyzeWellnessLogFlow = ai.defineFlow(
  {
    name: 'analyzeWellnessLogFlow',
    inputSchema: AnalyzeWellnessLogInputSchema,
    outputSchema: AnalyzeWellnessLogOutputSchema,
  },
  async (input) => {
    const llmResponse = await analyzeWellnessLogPrompt(input);
    const output = llmResponse.output;
    if (!output) {
      throw new Error('Wellness log analysis failed to produce a result.');
    }
    return output;
  }
);
