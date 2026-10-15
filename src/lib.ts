import { useEffect, useState } from 'react';

export interface VocabularyItem {
  word: string;
  type: string;
  level: string;
  meaning: string;
  ipa?: string;
  example?: string;
}

export interface SavedWord extends VocabularyItem {
  savedAt: number;
  known?: boolean;
}

// Persists state in localStorage; falls back to memory when storage is blocked.
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function toCsv(words: SavedWord[]) {
  const esc = (v: string | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const rows = words.map((w) => [w.word, w.ipa, w.type, w.level, w.meaning, w.example].map(esc).join(','));
  return ['word,ipa,type,level,meaning,example', ...rows].join('\n');
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Yêu cầu thất bại (HTTP ${response.status}).`);
  }
  return response.json();
}
