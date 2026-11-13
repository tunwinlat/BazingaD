import { z } from 'zod';
import { resolveAIEndpoint, type AIConfig } from './ai-config';

export async function requestAIText(prompt: string, config: AIConfig): Promise<string> {
  const { url, format } = resolveAIEndpoint(config.endpoint, config.apiFormat);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(format === 'anthropic'
        ? { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' }
        : { Authorization: `Bearer ${config.apiKey}` }),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      // Anthropic requires this; OpenAI-compatible servers can use their defaults.
      // Omitting optional sampling/token parameters also supports reasoning models.
      ...(format === 'anthropic' && { max_tokens: 1024 }),
    }),
    signal: AbortSignal.timeout(30000),
    redirect: 'error',
  });

  if (!response.ok) {
    // Do not log provider bodies: they can contain credentials or article content.
    throw new Error(`AI request failed with status ${response.status}`);
  }

  let text: string;
  try {
    const data = await response.json();
    text = format === 'anthropic'
      ? z.object({
        content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
      }).parse(data).content.filter(block => block.type === 'text').map(block => block.text ?? '').join('\n')
      : z.object({
        choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
      }).parse(data).choices[0].message.content;
  } catch {
    // JSON/validation errors can include snippets from the provider's response.
    throw new Error('AI response was not valid text in the expected API format');
  }

  if (!text.trim()) {
    throw new Error('AI response did not contain text');
  }
  return text;
}
