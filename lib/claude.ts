import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable');
}

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateClaudeResponse(prompt: string) {
  try {
    const message = await claude.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      temperature: 0.7,
      system: "You are a highly skilled coding assistant. Follow these rules:\n" +
              "1. Write clean, well-documented code\n" +
              "2. Include error handling\n" +
              "3. Follow best practices\n" +
              "4. Provide explanations for complex logic",
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    console.error('Error generating Claude response:', error);
    throw error;
  }
} 