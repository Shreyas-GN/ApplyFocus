import OpenAI from 'openai';

export function createAiClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not configured. Please add it to .env.local to enable AI features.'
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://applypilot.app',
      'X-Title': 'ApplyPilot',
    },
  });
}

export function getAiModel(): string {
  return process.env.OPENROUTER_MODEL ?? 'openrouter/free';
}
