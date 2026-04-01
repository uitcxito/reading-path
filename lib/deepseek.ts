const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface DeepseekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepseekOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Call Deepseek API with messages
 */
export async function callDeepseek(
  messages: DeepseekMessage[],
  options?: DeepseekOptions
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepseek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Safely parse JSON from Deepseek response
 * Handles cases where the response might be wrapped in markdown code blocks
 */
export function safeParseJSON<T>(text: string): T {
  let cleaned = text.trim();

  // Remove markdown code block wrapper if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  try {
    return JSON.parse(cleaned.trim());
  } catch (error) {
    console.error('Failed to parse JSON:', cleaned.substring(0, 500));
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Call Deepseek with retry logic
 */
export async function callDeepseekWithRetry<T>(
  messages: DeepseekMessage[],
  options?: DeepseekOptions,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callDeepseek(messages, options);
      return safeParseJSON<T>(response);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}
