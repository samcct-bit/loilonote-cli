import { AuthManager } from './auth.js';
import { getToken } from './config.js';
import type { Notebook, Card, PaginatedResponse } from './types.js';

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
}

export class LoilonoteClient {
  private baseUrl: string;
  private timeout: number;
  private auth: AuthManager;

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl ?? process.env.LOILONOTE_BASE_URL ?? 'https://loilonote.app';
    this.timeout = timeout ?? 30000;
    this.auth = new AuthManager();
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = new URL(path, this.baseUrl);
    if (options.params) {
      Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: options.method ?? 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      return response.json() as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // --- Notebooks ---
  async listNotebooks(): Promise<PaginatedResponse<Notebook>> {
    // TODO: 以實際 API endpoint 替換
    return this.request('/api/notebooks');
  }

  async getNotebook(id: string): Promise<Notebook> {
    return this.request(`/api/notebooks/${id}`);
  }

  async createNotebook(title: string): Promise<Notebook> {
    return this.request('/api/notebooks', { method: 'POST', body: { title } });
  }

  // --- Cards ---
  async listCards(notebookId: string): Promise<PaginatedResponse<Card>> {
    return this.request(`/api/notebooks/${notebookId}/cards`);
  }

  async getCard(cardId: string): Promise<Card> {
    return this.request(`/api/cards/${cardId}`);
  }

  async createCard(notebookId: string, content: unknown): Promise<Card> {
    return this.request(`/api/notebooks/${notebookId}/cards`, {
      method: 'POST',
      body: { content },
    });
  }

  async updateCard(cardId: string, content: unknown): Promise<Card> {
    return this.request(`/api/cards/${cardId}`, {
      method: 'PUT',
      body: { content },
    });
  }

  // --- Search ---
  async search(query: string): Promise<{ notebooks: Notebook[]; cards: Card[] }> {
    return this.request('/api/search', { params: { q: query } });
  }
}
