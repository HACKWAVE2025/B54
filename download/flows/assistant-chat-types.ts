
import { z } from 'genkit';
import { type Message } from '@/lib/types';

export const AssistantChatInputSchema = z.object({
  messages: z.array(z.custom<Message>()),
  text: z.string(),
  imageDataUri: z.string().optional(),
});
export type AssistantChatInput = z.infer<typeof AssistantChatInputSchema>;
