// src/lib/SecureCredentialStorage.ts

const IS_BROWSER = typeof window !== 'undefined';

/**
 * A class to store and retrieve credentials using a combination of
 * localStorage and sessionStorage. This provides a simple layer of obfuscation
 * to make it slightly more difficult for XSS attacks to access stored credentials,
 * but it should not be considered a true security measure.
 *
 * It works by generating a random key, storing it in sessionStorage, and then
 * using that key to "obfuscate" the data in localStorage. This is not
 * true encryption and can be easily bypassed if an attacker can execute JS.
 */
export class ObfuscatedCredentialStorage<T> {
  private key: string;
  private sessionKey: string;

  constructor(key: string) {
    this.key = key;
    this.sessionKey = `${key}-session-key`;
    this.ensureSessionKey();
  }

  private ensureSessionKey(): void {
    if (!IS_BROWSER) return;
    if (!sessionStorage.getItem(this.sessionKey)) {
      const randomKey = this.generateRandomKey();
      sessionStorage.setItem(this.sessionKey, randomKey);
    }
  }

  private generateRandomKey(): string {
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
  }

  private getSessionKey(): string | null {
    if (!IS_BROWSER) return null;
    return sessionStorage.getItem(this.sessionKey);
  }

  private obfuscate(data: string, key: string): string {
    return btoa(data + key);
  }

  private deobfuscate(data: string, key: string): string | null {
    try {
      const decoded = atob(data);
      if (decoded.endsWith(key)) {
        return decoded.slice(0, -key.length);
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  public set(value: T): void {
    if (!IS_BROWSER) return;
    const sessionKey = this.getSessionKey();
    if (sessionKey) {
      const obfuscated = this.obfuscate(JSON.stringify(value), sessionKey);
      localStorage.setItem(this.key, obfuscated);
    }
  }

  public get(): T | null {
    if (!IS_BROWSER) return null;
    const sessionKey = this.getSessionKey();
    const stored = localStorage.getItem(this.key);

    if (sessionKey && stored) {
      const deobfuscated = this.deobfuscate(stored, sessionKey);
      if (deobfuscated) {
        try {
          return JSON.parse(deobfuscated) as T;
        } catch {
          // Ignore errors
        }
      }
    }
    return null;
  }

  public clear(): void {
    if (!IS_BROWSER) return;
    localStorage.removeItem(this.key);
    sessionStorage.removeItem(this.sessionKey);
  }
}
