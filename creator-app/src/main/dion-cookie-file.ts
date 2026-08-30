import * as fs from 'fs/promises';
import { CookieFileContent, DionCredentials } from '../types';
import { DION_AUTH_COOKIE } from '../constants';

export class DionCookieFile {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async hasSession(): Promise<boolean> {
    const content = await this.readContent();
    if (!content) return false;
    if (content.email && content.password) return true;
    return content.cookies.some((cookie) => cookie.name === DION_AUTH_COOKIE && !!cookie.value);
  }

  async readCredentials(): Promise<DionCredentials> {
    const content = await this.readContent();
    return { email: content?.email || '', password: content?.password || '' };
  }

  async writeCredentials(email: string, password: string): Promise<void> {
    const content = await this.readContent();
    const updated: CookieFileContent = {
      email: email || undefined,
      password: password || undefined,
      cookies: content?.cookies || [],
    };
    await fs.writeFile(this.filePath, JSON.stringify(updated));
  }

  async clearTokens(): Promise<void> {
    const content = await this.readContent();
    if (!content) return;
    if (!content.email || !content.password) {
      await fs.unlink(this.filePath).catch(() => {});
      return;
    }
    const credentialsOnly: CookieFileContent = {
      email: content.email,
      password: content.password,
      cookies: [],
    };
    await fs.writeFile(this.filePath, JSON.stringify(credentialsOnly));
  }

  async readContent(): Promise<CookieFileContent | null> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { cookies: parsed };
      return {
        email: typeof parsed.email === 'string' ? parsed.email : undefined,
        password: typeof parsed.password === 'string' ? parsed.password : undefined,
        cookies: Array.isArray(parsed.cookies) ? parsed.cookies : [],
      };
    } catch {
      return null;
    }
  }
}
