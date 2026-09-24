/**
 * Summary-style renderers — produce optional inline-glance content for
 * tools whose raw output is high-volume but low-information (Grep,
 * Glob). The numeric summary (line counts, exit codes, sizes) lives in
 * the header chip (see chip.ts), so most tools intentionally render an
 * empty body and only expose details when the global expand toggle is
 * on.
 *
 * Errors always fall through to the truncated renderer so the user
 * sees the actual error message, not a synthetic summary.
 */

import type { Component } from '@moonshot-ai/pi-tui';
import { Text } from '@moonshot-ai/pi-tui';
import chalk from 'chalk';

import { renderTruncated } from './truncated';
import type { ResultRenderer } from './types';

type GlanceFn = (
  toolCall: Parameters<ResultRenderer>[0],
  result: Parameters<ResultRenderer>[1],
) => string;

function withGlance(glance: GlanceFn | null): ResultRenderer {
  return (toolCall, result, ctx) => {
    if (result.is_error) return renderTruncated(toolCall, result, ctx);

    const out: Component[] = [];
    if (glance !== null) {
      const line = glance(toolCall, result);
      if (line.length > 0) {
        out.push(new Text(`  ${chalk.dim(line)}`, 0, 0));
      }
    }
    if (ctx.expanded && result.output.length > 0) {
      out.push(new Text(chalk.dim(result.output), 4, 0));
    }
    return out;
  };
}

// ── Exports ──────────────────────────────────────────────────────────

// Tools whose chip already conveys everything — the body is empty in
// the collapsed state and only the raw output appears when expanded.
export const readSummary: ResultRenderer = withGlance(null);
export const fetchSummary: ResultRenderer = withGlance(null);
export const webSearchSummary: ResultRenderer = withGlance(null);
export const thinkSummary: ResultRenderer = withGlance(null);
export const editSummary: ResultRenderer = withGlance(null);
export const writeSummary: ResultRenderer = withGlance(null);
export const grepSummary: ResultRenderer = withGlance(null);
export const globSummary: ResultRenderer = withGlance(null);
