import { visibleWidth } from '@moonshot-ai/pi-tui';
import chalk from 'chalk';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { WelcomeComponent } from '#/tui/components/chrome/welcome';
import { setRainbowDance } from '#/tui/easter-eggs/dance';
import type { AppState } from '#/tui/types';

const TRUECOLOR_PATTERN = /\u001B\[38;2;(\d+);(\d+);(\d+)m/g;

const appState: AppState = {
  version: '1.2.3',
  workDir: '/tmp/project',
  additionalDirs: [],
  sessionId: 'ses-1',
  sessionTitle: null,
  model: 'kimi-k2',
  permissionMode: 'manual',
  thinkingEffort: 'off',
  contextUsage: 0,
  contextTokens: 0,
  maxContextTokens: 0,
  isCompacting: false,
  isReplaying: false,
  streamingPhase: 'idle',
  streamingStartTime: 0,
  planMode: false,
  inputMode: 'prompt',
  swarmMode: false,
  theme: 'dark',
  editorCommand: null,
  keybindings: {},
  notifications: { enabled: true, condition: 'unfocused' },
  upgrade: { autoInstall: true },
  availableModels: {},
  availableProviders: {},
  mcpServersSummary: null,
};

function truecolorCodes(text: string): Set<string> {
  const codes = new Set<string>();
  for (const match of text.matchAll(TRUECOLOR_PATTERN)) {
    codes.add(`${match[1]},${match[2]},${match[3]}`);
  }
  return codes;
}

function stripAnsi(text: string): string {
  return text.replaceAll(/\u001B\[[0-9;]*m/g, '');
}

describe('WelcomeComponent', () => {
  const previousChalkLevel = chalk.level;

  beforeEach(() => {
    chalk.level = 3;
  });

  afterEach(() => {
    chalk.level = previousChalkLevel;
    setRainbowDance(undefined);
  });

  it('renders the welcome text and info lines without a box or logo', () => {
    const lines = new WelcomeComponent(appState).render(80);
    const plain = stripAnsi(lines.join('\n'));

    expect(plain).toContain('Kimi Code');
    expect(plain).toContain('Session:   ses-1');
    expect(plain).toContain('Version:   1.2.3 K');
    expect(plain).not.toContain('Send /help for help information.');

    expect(plain).not.toContain('╭');
    expect(plain).not.toContain('╮');
    expect(plain).not.toContain('│');
    expect(plain).not.toContain('╰');
    expect(plain).not.toContain('╯');
    expect(plain).not.toContain('▐█▛█▛█▌');
    expect(plain).not.toContain('▐█████▌');
  });

  it('uses the brand primary color for the title', () => {
    const lines = new WelcomeComponent(appState).render(80);
    const codes = truecolorCodes(lines[1]!);

    expect(codes.size).toBe(1);
  });

  it('keeps one blank line before the title and no trailing blank line', () => {
    const lines = new WelcomeComponent(appState).render(80);

    expect(lines[0]).toBe('');
    expect(stripAnsi(lines.at(-1)!).startsWith('Version:')).toBe(true);
  });

  it('keeps every line within the requested width on narrow terminals', () => {
    for (const width of [0, 1, 2, 4, 10, 39, 80]) {
      for (const line of new WelcomeComponent(appState).render(width)) {
        expect(visibleWidth(line)).toBeLessThanOrEqual(width);
      }
    }
  });
});
