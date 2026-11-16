export interface AiMessagesClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      system: string;
      messages: { role: 'user'; content: string }[];
    }): Promise<{
      content: Array<{ type: string; text?: string }>;
    }>;
  };
}

function createOpenRouterClient(apiKey: string): AiMessagesClient {
  return {
    messages: {
      async create(params) {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://applyfocus.app',
            'X-Title': 'ApplyFocus',
          },
          body: JSON.stringify({
            model: params.model,
            max_tokens: params.max_tokens,
            messages: [
              { role: 'system', content: params.system },
              ...params.messages,
            ],
          }),
          signal: AbortSignal.timeout(55_000),
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error');
          throw new Error(`OpenRouter API error ${res.status}: ${errorText}`);
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content ?? '';
        return { content: [{ type: 'text', text }] };
      },
    },
  };
}

export function resolveAiClient(injected?: AiMessagesClient): {
  client: AiMessagesClient;
  model: string;
} {
  if (injected) {
    return {
      client: injected,
      model: process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3.5-sonnet',
    };
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not configured. Add it to your environment to enable AI features.'
    );
  }
  return {
    client: createOpenRouterClient(apiKey),
    model: process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3.5-sonnet',
  };
}
