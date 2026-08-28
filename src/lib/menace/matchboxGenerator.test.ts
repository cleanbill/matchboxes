import { describe, it, expect } from 'vitest';
import { generateMatchboxes, getInitialBeadCount } from './matchboxGenerator';
import { evaluateGame } from './boardUtils';
import { stringToBoard } from './symmetry';

// ─── getInitialBeadCount ─────────────────────────────────────────────────────

describe('getInitialBeadCount', () => {
  it('returns Michie original values by turn index', () => {
    expect(getInitialBeadCount(1)).toBe(4);
    expect(getInitialBeadCount(2)).toBe(3);
    expect(getInitialBeadCount(3)).toBe(2);
    expect(getInitialBeadCount(4)).toBe(1);
  });

  it('defaults to 1 for any turn index beyond 4', () => {
    expect(getInitialBeadCount(5)).toBe(1);
    expect(getInitialBeadCount(99)).toBe(1);
  });
});

// ─── generateMatchboxes ───────────────────────────────────────────────────────

describe('generateMatchboxes', () => {
  // Generate once and share across tests
  const matchboxes = generateMatchboxes('O');
  const entries = Object.entries(matchboxes);

  it('generates a non-empty set of matchboxes', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('every matchbox has at least one bead', () => {
    for (const [, box] of entries) {
      const total = Object.values(box.beads).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(0);
    }
  });

  it('every matchbox bead key corresponds to an empty cell on the canonical board', () => {
    for (const [, box] of entries) {
      for (const idx of Object.keys(box.beads).map(Number)) {
        expect(box.canonicalBoard[idx]).toBeNull();
      }
    }
  });

  it('no matchbox exists for a terminal (won or drawn) board state', () => {
    for (const [id] of entries) {
      const b = stringToBoard(id);
      const { result } = evaluateGame(b);
      expect(result).toBeNull();
    }
  });

  it('matchbox totalBeads matches the sum of individual bead counts', () => {
    for (const [, box] of entries) {
      const computed = Object.values(box.beads).reduce((a, b) => a + b, 0);
      expect(box.totalBeads).toBe(computed);
    }
  });

  it('also generates matchboxes when MENACE plays as X', () => {
    const asX = generateMatchboxes('X');
    expect(Object.keys(asX).length).toBeGreaterThan(0);
  });

  it('each matchbox id matches its canonicalBoard string', () => {
    for (const [id, box] of entries) {
      const reconstructed = box.canonicalBoard.map((c) => c ?? '.').join('');
      expect(id).toBe(reconstructed);
    }
  });

  it('stats are initialised to zero for all matchboxes', () => {
    for (const [, box] of entries) {
      expect(box.stats.timesAccessed).toBe(0);
      expect(box.stats.wins).toBe(0);
      expect(box.stats.draws).toBe(0);
      expect(box.stats.losses).toBe(0);
    }
  });
});
