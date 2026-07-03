/**
 * Welcome panel shown at the top of the TUI.
 * Renders the logo-free welcome text, session, and version.
 */

import type { Component } from '@moonshot-ai/pi-tui';
import { truncateToWidth } from '@moonshot-ai/pi-tui';
import chalk from 'chalk';

import type { AppState } from '#/tui/types';
import { currentTheme } from '#/tui/theme';

export class WelcomeComponent implements Component {
  private state: AppState;

  constructor(state: AppState) {
    this.state = state;
  }

  invalidate(): void {}

  render(width: number): string[] {
    const safeWidth = Math.max(0, width);

    const title = chalk.bold.hex(currentTheme.palette.primary)('Kimi Code');
    const labelStyle = chalk.bold.hex(currentTheme.palette.textDim);

    const infoLines = [
      labelStyle('Session:   ') + this.state.sessionId,
      labelStyle('Version:   ') + this.state.version + ' K',
    ];

    if (this.state.mcpServersSummary) {
      infoLines.push(labelStyle('MCP:       ') + this.state.mcpServersSummary);
    }

    const lines: string[] = ['', title, ...infoLines];

    return lines.map((line) => truncateToWidth(line, safeWidth, '…'));
  }
}
