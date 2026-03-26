import { describe, it, expect } from 'vitest';
import { discoverFiles } from '../file-discovery.js';
import { DEFAULT_CONFIG } from '../types.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('discoverFiles', () => {
  it('finds JS/TS files in a directory', async () => {
    const dir = join(tmpdir(), `guardrail-disc-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'a.js'), '');
    writeFileSync(join(dir, 'b.ts'), '');
    writeFileSync(join(dir, 'c.txt'), '');

    const files = await discoverFiles(dir, DEFAULT_CONFIG);
    expect(files).toHaveLength(2);
    expect(files.every((f) => /\.(js|ts)$/.test(f))).toBe(true);

    rmSync(dir, { recursive: true });
  });

  it('handles a single file path', async () => {
    const dir = join(tmpdir(), `guardrail-disc-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'test.js');
    writeFileSync(file, '');

    const files = await discoverFiles(file, DEFAULT_CONFIG);
    expect(files).toHaveLength(1);

    rmSync(dir, { recursive: true });
  });

  it('excludes node_modules', async () => {
    const dir = join(tmpdir(), `guardrail-disc-${Date.now()}`);
    mkdirSync(join(dir, 'node_modules'), { recursive: true });
    writeFileSync(join(dir, 'a.js'), '');
    writeFileSync(join(dir, 'node_modules', 'b.js'), '');

    const files = await discoverFiles(dir, DEFAULT_CONFIG);
    expect(files).toHaveLength(1);

    rmSync(dir, { recursive: true });
  });
});
