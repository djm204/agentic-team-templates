/**
 * Tests for the shared fragments system.
 *
 * Fragments are reusable prompt blocks stored in a `fragments/` directory.
 * Skills reference them via `{{fragment:name}}` syntax. The composer
 * deduplicates identical fragments so each appears only once in the
 * final composed prompt.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadFragment,
  loadFragments,
  resolveFragments,
  deduplicateFragments,
} from './fragments.js';

// ============================================================================
// Helpers
// ============================================================================

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fragments-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// loadFragment
// ============================================================================

describe('loadFragment', () => {
  it('loads a fragment by name from a directory', () => {
    fs.writeFileSync(path.join(tmpDir, 'ethics.md'), '# Ethics\nBe helpful.');
    const content = loadFragment('ethics', tmpDir);
    expect(content).toBe('# Ethics\nBe helpful.');
  });

  it('throws with a descriptive error when fragment file does not exist', () => {
    expect(() => loadFragment('missing', tmpDir)).toThrow('Fragment not found: "missing"');
  });

  it('throws when the fragments directory does not exist', () => {
    expect(() => loadFragment('foo', path.join(tmpDir, 'nonexistent'))).toThrow();
  });
});

// ============================================================================
// loadFragments
// ============================================================================

describe('loadFragments', () => {
  it('returns all fragment names and content from a directory', () => {
    fs.writeFileSync(path.join(tmpDir, 'ethics.md'), '# Ethics');
    fs.writeFileSync(path.join(tmpDir, 'style.md'), '# Style');
    const fragments = loadFragments(tmpDir);
    expect(Object.keys(fragments).sort()).toEqual(['ethics', 'style']);
    expect(fragments.ethics).toBe('# Ethics');
    expect(fragments.style).toBe('# Style');
  });

  it('ignores non-.md files', () => {
    fs.writeFileSync(path.join(tmpDir, 'ethics.md'), '# Ethics');
    fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'not a fragment');
    fs.writeFileSync(path.join(tmpDir, 'schema.yaml'), 'name: foo');
    const fragments = loadFragments(tmpDir);
    expect(Object.keys(fragments)).toEqual(['ethics']);
  });

  it('returns empty object for empty directory', () => {
    expect(loadFragments(tmpDir)).toEqual({});
  });

  it('returns empty object if directory does not exist', () => {
    expect(loadFragments(path.join(tmpDir, 'missing'))).toEqual({});
  });
});

// ============================================================================
// resolveFragments
// ============================================================================

describe('resolveFragments', () => {
  it('replaces {{fragment:name}} with fragment content wrapped in markers', () => {
    fs.writeFileSync(path.join(tmpDir, 'greeting.md'), 'Hello!');
    const { text } = resolveFragments('Start\n{{fragment:greeting}}\nEnd', tmpDir);
    expect(text).toContain('Hello!');
    expect(text).toContain('Start');
    expect(text).toContain('End');
    expect(text).not.toContain('{{fragment:greeting}}');
  });

  it('wraps resolved fragment in begin/end markers for deduplication', () => {
    fs.writeFileSync(path.join(tmpDir, 'greeting.md'), 'Hello!');
    const { text } = resolveFragments('{{fragment:greeting}}', tmpDir);
    expect(text).toContain('<!-- fragment:greeting -->');
    expect(text).toContain('<!-- /fragment:greeting -->');
    expect(text).toContain('Hello!');
  });

  it('returns the list of used fragment names', () => {
    fs.writeFileSync(path.join(tmpDir, 'greeting.md'), 'Hello!');
    const { usedFragments } = resolveFragments('{{fragment:greeting}}', tmpDir);
    expect(usedFragments).toContain('greeting');
  });

  it('resolves multiple distinct fragments', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.md'), 'AAA');
    fs.writeFileSync(path.join(tmpDir, 'b.md'), 'BBB');
    const { text, usedFragments } = resolveFragments('{{fragment:a}} and {{fragment:b}}', tmpDir);
    expect(text).toContain('AAA');
    expect(text).toContain('BBB');
    expect(usedFragments).toHaveLength(2);
    expect(usedFragments).toContain('a');
    expect(usedFragments).toContain('b');
  });

  it('same fragment used twice is only listed once in usedFragments', () => {
    fs.writeFileSync(path.join(tmpDir, 'shared.md'), 'Shared content');
    const { usedFragments } = resolveFragments(
      '{{fragment:shared}} again {{fragment:shared}}',
      tmpDir
    );
    expect(usedFragments).toHaveLength(1);
    expect(usedFragments[0]).toBe('shared');
  });

  it('leaves text unchanged when no fragmentsDir provided (null)', () => {
    const { text, usedFragments } = resolveFragments('{{fragment:greeting}}', null);
    expect(text).toBe('{{fragment:greeting}}');
    expect(usedFragments).toHaveLength(0);
  });

  it('leaves text unchanged when no fragmentsDir provided (undefined)', () => {
    const { text } = resolveFragments('no references here', undefined);
    expect(text).toBe('no references here');
  });

  it('throws when a referenced fragment file does not exist', () => {
    expect(() => resolveFragments('{{fragment:missing}}', tmpDir)).toThrow(
      'Fragment not found: "missing"'
    );
  });

  it('leaves text without fragment references unchanged', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.md'), 'A');
    const { text, usedFragments } = resolveFragments('No references here.', tmpDir);
    expect(text).toBe('No references here.');
    expect(usedFragments).toHaveLength(0);
  });
});

// ============================================================================
// deduplicateFragments
// ============================================================================

describe('deduplicateFragments', () => {
  it('removes second occurrence of a fragment block', () => {
    const block = '<!-- fragment:ethics -->\nBe ethical.\n<!-- /fragment:ethics -->';
    const composed = `Skill A\n${block}\n\n---\n\nSkill B\n${block}`;
    const result = deduplicateFragments(composed);
    const count = (result.match(/<!-- fragment:ethics -->/g) || []).length;
    expect(count).toBe(1);
  });

  it('keeps first occurrence of each fragment', () => {
    const block = '<!-- fragment:ethics -->\nBe ethical.\n<!-- /fragment:ethics -->';
    const composed = `Intro\n${block}\n\nMore content\n${block}`;
    const result = deduplicateFragments(composed);
    expect(result).toContain('Be ethical.');
    expect(result).toContain('Intro');
    expect(result).toContain('More content');
  });

  it('handles multiple different fragments — keeps each once', () => {
    const block1 = '<!-- fragment:ethics -->\nBe ethical.\n<!-- /fragment:ethics -->';
    const block2 = '<!-- fragment:style -->\nBe concise.\n<!-- /fragment:style -->';
    const composed = `${block1}\n${block2}\n${block1}\n${block2}`;
    const result = deduplicateFragments(composed);
    expect((result.match(/<!-- fragment:ethics -->/g) || []).length).toBe(1);
    expect((result.match(/<!-- fragment:style -->/g) || []).length).toBe(1);
  });

  it('returns text unchanged when no fragment markers present', () => {
    const text = 'Plain text with no fragments.';
    expect(deduplicateFragments(text)).toBe(text);
  });

  it('returns text unchanged when each fragment appears only once', () => {
    const text =
      'Intro\n<!-- fragment:ethics -->\nBe ethical.\n<!-- /fragment:ethics -->\nOutro';
    expect(deduplicateFragments(text)).toBe(text);
  });

  it('removes the duplicate fragment block entirely (not just the markers)', () => {
    const block = '<!-- fragment:secret -->\nSecret content\n<!-- /fragment:secret -->';
    const composed = `Before\n${block}\nMiddle\n${block}\nAfter`;
    const result = deduplicateFragments(composed);
    const countContent = (result.match(/Secret content/g) || []).length;
    expect(countContent).toBe(1);
  });
});

// ============================================================================
// Integration: resolveFragments + deduplicateFragments
// ============================================================================

describe('resolveFragments + deduplicateFragments integration', () => {
  it('two skills using the same fragment produce exactly one occurrence after dedup', () => {
    fs.writeFileSync(path.join(tmpDir, 'ethics.md'), 'Always be helpful and honest.');

    const skillAPrompt = 'Skill A role.\n{{fragment:ethics}}';
    const skillBPrompt = 'Skill B role.\n{{fragment:ethics}}';

    const { text: resolvedA } = resolveFragments(skillAPrompt, tmpDir);
    const { text: resolvedB } = resolveFragments(skillBPrompt, tmpDir);

    const composed = `${resolvedA}\n\n---\n\n${resolvedB}`;
    const deduped = deduplicateFragments(composed);

    const count = (deduped.match(/Always be helpful and honest\./g) || []).length;
    expect(count).toBe(1);
  });
});
