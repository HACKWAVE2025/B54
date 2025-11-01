
import { z } from 'genkit';

export const AnalyzeWellnessLogInputSchema = z.object({
  foodIntake: z.string().describe("A description of the food the user ate."),
  activityType: z.string().optional().describe("The type of physical activity performed."),
  activityDuration: z.number().optional().describe("The duration of the activity in minutes."),
});
export type AnalyzeWellnessLogInput = z.infer<typeof AnalyzeWellnessLogInputSchema>;

const ImpactSchema = z.object({
    level: z.enum(['Positive', 'Neutral', 'Negative']).describe("The predicted impact level."),
    explanation: z.string().describe("A brief explanation for the prediction.")
});

export const AnalyzeWellnessLogOutputSchema = z.object({
  diabetesImpact: ImpactSchema.describe("Prediction of the short-term impact on blood sugar levels."),
  bloodPressureImpact: ImpactSchema.describe("Prediction of the short-term impact on blood pressure."),
  cholesterolImpact: ImpactSchema.describe("Prediction of the short-term impact on cholesterol."),
  summary: z.string().describe("A brief, encouraging, and actionable overall summary of the analysis.")
});
export type AnalyzeWellnessLogOutput = z.infer<typeof AnalyzeWellnessLogOutputSchema>;
