import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Violation } from './types.js';

const CACHE_DIR = join('node_modules', '.cache', 'guardrail');
const CACHE_FILE = 'scan-cache.json';

// Bump this when rules change to auto-invalidate cache
const CACHE_VERSION = '0.2.2';

interface CacheEntry {
  hash: string;
  violations: Violation[];
}

interface CacheData {
  version: string;
  entries: Record<string, CacheEntry>;
}

export class ScanCache {
  private data: CacheData;
  private cachePath: string;
  private dirty = false;

  constructor(basePath: string) {
    const cacheDir = join(basePath, CACHE_DIR);
    this.cachePath = join(cacheDir, CACHE_FILE);

    if (existsSync(this.cachePath)) {
      try {
        const raw = JSON.parse(readFileSync(this.cachePath, 'utf-8'));
        // Invalidate cache if version changed (rules updated)
        if (raw.version !== CACHE_VERSION) {
          this.data = { version: CACHE_VERSION, entries: {} };
          this.dirty = true;
        } else {
          this.data = raw;
        }
      } catch {
        this.data = { version: CACHE_VERSION, entries: {} };
      }
    } else {
      this.data = { version: CACHE_VERSION, entries: {} };
    }
  }

  hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  get(filePath: string, content: string): Violation[] | null {
    const entry = this.data.entries[filePath];
    if (!entry) return null;

    const hash = this.hashContent(content);
    if (entry.hash !== hash) return null;

    return entry.violations;
  }

  set(filePath: string, content: string, violations: Violation[]): void {
    this.data.entries[filePath] = {
      hash: this.hashContent(content),
      violations,
    };
    this.dirty = true;
  }

  save(): void {
    if (!this.dirty) return;

    const dir = join(this.cachePath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(this.cachePath, JSON.stringify(this.data));
  }
}
