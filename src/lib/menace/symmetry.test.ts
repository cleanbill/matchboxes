import { describe, it, expect } from 'vitest';
import {
  TRANSFORMS,
  applyTransform,
  getCanonicalRepresentation,
  canonicalMoveToActualMove,
  boardToString,
} from './symmetry';
import { BoardState } from './types';

// ─── helpers ────────────────────────────────────────────────────────────────

function board(str: string): BoardState {
  return str.split('').map((c) => (c === 'X' ? 'X' : c === 'O' ? 'O' : null));
}

// ─── Transform round-trips ───────────────────────────────────────────────────
// applyTransform(board, map)[i] = board[map[i]]
// So applying map then inverseMap should restore the board.

describe('TRANSFORMS', () => {
  const sample = board('XO.X..O..');

  it.each(TRANSFORMS.map((t) => [t.name, t]))(
    '%s: applying map then inverseMap returns the original board',
    (_, transform) => {
      const canonical = applyTransform(sample, transform.map);
      const restored = applyTransform(canonical, transform.inverseMap);
      expect(boardToString(restored)).toBe(boardToString(sample));
    }
  );

  it.each(TRANSFORMS.map((t) => [t.name, t]))(
    '%s: applying inverseMap then map returns the original board',
    (_, transform) => {
      const rotated = applyTransform(sample, transform.inverseMap);
      const restored = applyTransform(rotated, transform.map);
      expect(boardToString(restored)).toBe(boardToString(sample));
    }
  );
});

// ─── getCanonicalRepresentation ──────────────────────────────────────────────

describe('getCanonicalRepresentation', () => {
  it('returns a 9-character canonicalId string', () => {
    const b = board('XO.......');
    const { canonicalId } = getCanonicalRepresentation(b);
    expect(typeof canonicalId).toBe('string');
    expect(canonicalId).toHaveLength(9);
  });

  it('all 8 rotations/reflections of the same board share one canonical ID', () => {
    // Place X only at position 0 — all transforms produce boards with X in
    // different corners/edges, but they must all resolve to the same canonical ID.
    const base = board('X........');
    const ids = new Set(
      TRANSFORMS.map((t) => {
        const rotated = applyTransform(base, t.map);
        return getCanonicalRepresentation(rotated).canonicalId;
      })
    );
    expect(ids.size).toBe(1);
  });

  it('a rotationally-symmetric board (center only) maps to itself', () => {
    const b = board('....X....');
    const { canonicalId } = getCanonicalRepresentation(b);
    expect(canonicalId).toBe('....X....');
  });

  it('different board positions produce different canonical IDs', () => {
    const a = board('X........');
    const b = board('....X....');
    const idA = getCanonicalRepresentation(a).canonicalId;
    const idB = getCanonicalRepresentation(b).canonicalId;
    expect(idA).not.toBe(idB);
  });

  it('returns a valid transformMap of length 9', () => {
    const { transformMap } = getCanonicalRepresentation(board('XO.......'));
    expect(transformMap).toHaveLength(9);
  });

  it('inverseTransformMap is a permutation of 0..8', () => {
    const { inverseTransformMap } = getCanonicalRepresentation(board('XO.......'));
    expect([...inverseTransformMap].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('canonicalBoard[i] === actualBoard[transformMap[i]] for all i', () => {
    // This is the fundamental definition of applyTransform:
    // canonical = applyTransform(actual, map) means canonical[i] = actual[map[i]]
    const b = board('XO.......');
    const { canonicalBoard, transformMap } = getCanonicalRepresentation(b);
    for (let i = 0; i < 9; i++) {
      expect(canonicalBoard[i]).toBe(b[transformMap[i]]);
    }
  });
});

// ─── canonicalMoveToActualMove ───────────────────────────────────────────────
// Since canonical[ci] = actual[map[ci]], the actual board index for a canonical
// move ci is simply transformMap[ci].

describe('canonicalMoveToActualMove', () => {
  it('for a board with IDENTITY transform, canonical index === actual index', () => {
    // Empty board is always its own canonical form under identity
    const emptyBoard = board('.........');
    const { transformMap, transformIndex } = getCanonicalRepresentation(emptyBoard);
    expect(transformIndex).toBe(0); // IDENTITY
    for (let i = 0; i < 9; i++) {
      expect(canonicalMoveToActualMove(i, transformMap)).toBe(i);
    }
  });

  it('every canonical empty cell maps to a null cell on the actual board', () => {
    // Test across all 8 rotations of a board with some pieces
    const base = board('XO.......');

    for (const transform of TRANSFORMS) {
      const actualBoard = applyTransform(base, transform.map);
      const { canonicalBoard, transformMap } = getCanonicalRepresentation(actualBoard);

      canonicalBoard.forEach((cell, ci) => {
        if (cell !== null) return; // skip occupied cells
        const actualIdx = canonicalMoveToActualMove(ci, transformMap);
        expect(actualBoard[actualIdx]).toBeNull();
      });
    }
  });

  it('canonical → actual round-trip is consistent: canonical[ci] === actual[actualIdx]', () => {
    // By definition: canonicalBoard[ci] = actualBoard[transformMap[ci]]
    // So after translation, the cell values must match.
    const base = board('XO.......');
    const rotate90 = TRANSFORMS.find((t) => t.name === 'ROTATE_90')!;
    const actualBoard = applyTransform(base, rotate90.map);
    const { canonicalBoard, transformMap } = getCanonicalRepresentation(actualBoard);

    canonicalBoard.forEach((cell, ci) => {
      const actualIdx = canonicalMoveToActualMove(ci, transformMap);
      expect(canonicalBoard[ci]).toBe(actualBoard[actualIdx]);
    });
  });
});
