'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const LessonTutorInputSchema = z.object({
  lessonTitle: z.string().describe('The title of the current lesson or project.'),
  lessonContent: z.string().describe('The content or instructions of the current lesson or project.'),
  query: z.string().describe('The student\'s question about the lesson.'),
  history: z.array(MessageSchema).optional().describe('Previous messages in the conversation.'),
});

export type LessonTutorInput = z.infer<typeof LessonTutorInputSchema>;

const LessonTutorOutputSchema = z.object({
  answer: z.string().describe('The AI tutor\'s response to the student.'),
});

export type LessonTutorOutput = z.infer<typeof LessonTutorOutputSchema>;

export async function lessonTutor(input: LessonTutorInput): Promise<LessonTutorOutput> {
  return lessonTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lessonTutorPrompt',
  input: { schema: LessonTutorInputSchema },
  output: { schema: LessonTutorOutputSchema },
  prompt: `You are a helpful and encouraging AI Study Buddy on EduVerse.
  Your goal is to help students understand the current lesson material without just giving them the direct answers if it's a project or task.

  CURRENT LESSON: {{lessonTitle}}
  LESSON CONTENT:
  """
  {{lessonContent}}
  """

  {{#if history}}
  CONVERSATION HISTORY:
  {{#each history}}
  - {{this.role}}: {{this.content}}
  {{/each}}
  {{/if}}

  Student's Question: "{{query}}"

  Provide a clear, helpful, and contextual response that refers back to the lesson content when appropriate.`,
});

const lessonTutorFlow = ai.defineFlow(
  {
    name: 'lessonTutorFlow',
    inputSchema: LessonTutorInputSchema,
    outputSchema: LessonTutorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate tutor response');
    }
    return output;
  }
);
