
'use server';
/**
 * @fileOverview A Genkit flow for handling the AI assistant chat.
 *
 * This file defines:
 * - assistantChat: A function to handle a multi-turn chat conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { type Message } from '@/lib/types';
import { AssistantChatInputSchema, type AssistantChatInput } from './assistant-chat-types';


export async function assistantChat(input: AssistantChatInput): Promise<string> {
  return assistantChatFlow(input);
}


const assistantChatFlow = ai.defineFlow(
  {
    name: 'assistantChatFlow',
    inputSchema: AssistantChatInputSchema,
    outputSchema: z.string(),
  },
  async ({ messages, text, imageDataUri }) => {

    // The history should only contain messages *before* the current one.
    const history = messages.slice(0, -1).map((msg: Message) => ({
      role: msg.role,
      content: [{ text: msg.text }] // History content is just text
    }));

    // The latest prompt from the user, which can include text and an image.
    const latestContent = [
        { text: text || '(No text provided, please describe the image)' },
        ...(imageDataUri ? [{ media: { url: imageDataUri } }] : [])
    ];
    
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-pro-vision',
      history,
      prompt: {
          role: 'user',
          content: latestContent
      },
    });

    const responseText = llmResponse.text;
    if (!responseText) {
      throw new Error('Chat flow failed to produce a text result.');
    }
    return responseText;
  }
);
