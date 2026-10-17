import type { WebSearchProvider, WebSearchResult } from '#/agent/tools/web-search/web-search';
import { Error2, ErrorCodes } from '#/errors';

export interface BearerTokenProvider {
  getAccessToken(options?: { readonly force?: boolean | undefined }): Promise<string>;
}

export interface DeepSeekWebSearchProviderOptions {
  tokenProvider?: BearerTokenProvider;
  apiKey?: string;
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  customHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

interface DeepSeekSearchResult {
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
  summary?: string | null;
  site_name?: string | null;
  date?: string | null;
}

interface DeepSeekSearchResponse {
  results?: DeepSeekSearchResult[];
}

export class DeepSeekWebSearchProvider implements WebSearchProvider {
  private readonly tokenProvider: BearerTokenProvider | undefined;
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly customHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: DeepSeekWebSearchProviderOptions) {
    this.tokenProvider = options.tokenProvider;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.customHeaders = options.customHeaders ?? {};
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async search(
    query: string,
    options?: {
      toolCallId?: string;
      signal?: AbortSignal;
    },
  ): Promise<WebSearchResult[]> {
    const bodyJson = JSON.stringify({ query });
    const response = await this.post(bodyJson, options?.toolCallId, options?.signal);

    if (response.status !== 200) {
      const detail = await safeReadText(response);
      throw new Error2(
        ErrorCodes.WEB_FETCH_FAILED,
        `DeepSeek search request failed: HTTP ${String(response.status)}. ${detail}`.trim(),
        { details: { status: response.status } },
      );
    }

    const json = (await response.json()) as DeepSeekSearchResponse;
    const raw = Array.isArray(json.results) ? json.results : [];

    return raw.map((result): WebSearchResult => {
      const out: WebSearchResult = {
        title: result.title ?? '',
        url: result.url ?? '',
        snippet: nonEmpty(result.summary) ?? nonEmpty(result.snippet) ?? '',
      };
      const date = nonEmpty(result.date);
      if (date !== undefined) out.date = date;
      const siteName = nonEmpty(result.site_name);
      if (siteName !== undefined) out.siteName = siteName;
      return out;
    });
  }

  private async post(
    bodyJson: string,
    toolCallId: string | undefined,
    signal: AbortSignal | undefined,
  ): Promise<Response> {
    const accessToken = await this.resolveApiKey();
    return this.fetchImpl(this.baseUrl, {
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(toolCallId !== undefined && toolCallId.length > 0
          ? { 'X-Msh-Tool-Call-Id': toolCallId }
          : {}),
        ...this.customHeaders,
      },
      body: bodyJson,
      signal,
    });
  }

  private async resolveApiKey(): Promise<string> {
    if (this.tokenProvider !== undefined) {
      try {
        return await this.tokenProvider.getAccessToken();
      } catch (error) {
        if (this.apiKey !== undefined && this.apiKey.length > 0) return this.apiKey;
        throw error;
      }
    }
    if (this.apiKey !== undefined && this.apiKey.length > 0) return this.apiKey;
    throw new Error2(
      ErrorCodes.AUTH_TOKEN_MISSING,
      'DeepSeek search service is not configured: missing API key or token provider.',
    );
  }
}

function nonEmpty(value: string | null | undefined): string | undefined {
  return value !== null && value !== undefined && value.length > 0 ? value : undefined;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}
