import { describe, it, expect } from 'vitest';
import {
  evaluateGame,
  getValidMoves,
  getRandomMove,
  getMinimaxMove,
  createEmptyBoard,
} from './boardUtils';
import { BoardState } from './types';

// ─── helpers ────────────────────────────────────────────────────────────────

function board(str: string): BoardState {
  return str.split('').map((c) => (c === 'X' ? 'X' : c === 'O' ? 'O' : null));
}

// ─── evaluateGame ────────────────────────────────────────────────────────────

describe('evaluateGame', () => {
  it('returns null for an empty board', () => {
    expect(evaluateGame(createEmptyBoard()).result).toBeNull();
  });

  it('returns null for an in-progress board', () => {
    expect(evaluateGame(board('XO....X..')).result).toBeNull();
  });

  // All 8 winning lines for X
  it.each([
    ['XXX......', [0, 1, 2]],
    ['...XXX...', [3, 4, 5]],
    ['......XXX', [6, 7, 8]],
    ['X..X..X..', [0, 3, 6]],
    ['.X..X..X.', [1, 4, 7]],
    ['..X..X..X', [2, 5, 8]],
    ['X...X...X', [0, 4, 8]],
    ['..X.X.X..', [2, 4, 6]],
  ])('detects X win on line %s', (str, line) => {
    const { result, winningLine } = evaluateGame(board(str));
    expect(result).toBe('X');
    expect(winningLine).toEqual(line);
  });

  // All 8 winning lines for O
  it.each([
    ['OOO......', [0, 1, 2]],
    ['...OOO...', [3, 4, 5]],
    ['......OOO', [6, 7, 8]],
    ['O..O..O..', [0, 3, 6]],
    ['.O..O..O.', [1, 4, 7]],
    ['..O..O..O', [2, 5, 8]],
    ['O...O...O', [0, 4, 8]],
    ['..O.O.O..', [2, 4, 6]],
  ])('detects O win on line %s', (str, line) => {
    const { result, winningLine } = evaluateGame(board(str));
    expect(result).toBe('O');
    expect(winningLine).toEqual(line);
  });

  it('returns DRAW for a full board with no winner', () => {
    // XOXOOXXXO — no winner
    const { result, winningLine } = evaluateGame(board('XOXOOXXXO'));
    expect(result).toBe('DRAW');
    expect(winningLine).toBeNull();
  });
});

// ─── getValidMoves ───────────────────────────────────────────────────────────

describe('getValidMoves', () => {
  it('returns all 9 indices for an empty board', () => {
    expect(getValidMoves(createEmptyBoard())).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('returns only empty cells for a partial board', () => {
    expect(getValidMoves(board('XO....X..'))).toEqual([2, 3, 4, 5, 7, 8]);
  });

  it('returns empty array for a full board', () => {
    expect(getValidMoves(board('XOXOOXXXO'))).toEqual([]);
  });
});

// ─── getRandomMove ───────────────────────────────────────────────────────────

describe('getRandomMove', () => {
  it('always returns a valid (empty) cell index', () => {
    const b = board('XO....X..');
    const valid = new Set([2, 3, 4, 5, 7, 8]);
    for (let i = 0; i < 50; i++) {
      expect(valid.has(getRandomMove(b))).toBe(true);
    }
  });

  it('returns -1 for a full board', () => {
    expect(getRandomMove(board('XOXOOXXXO'))).toBe(-1);
  });
});

// ─── getMinimaxMove ──────────────────────────────────────────────────────────

describe('getMinimaxMove', () => {
  it('takes an immediate winning move for X', () => {
    // X needs position 2 to win row 1
    const b = board('XX.......');
    expect(getMinimaxMove(b, 'X')).toBe(2);
  });

  it('blocks an immediate opponent win', () => {
    // O needs position 2 to win; X should block it
    const b = board('OO.......');
    expect(getMinimaxMove(b, 'X')).toBe(2);
  });

  it('never loses against a random opponent (plays to draw or win)', { timeout: 30_000 }, () => {
    // Play 50 games: minimax X vs random O — X should never lose
    for (let g = 0; g < 50; g++) {
      let b: BoardState = createEmptyBoard();
      let player: 'X' | 'O' = 'X';
      let result = evaluateGame(b).result;

      while (result === null) {
        const move =
          player === 'X'
            ? getMinimaxMove(b, 'X')
            : getRandomMove(b);
        b = [...b];
        b[move] = player;
        result = evaluateGame(b).result;
        player = player === 'X' ? 'O' : 'X';
      }

      expect(result).not.toBe('O'); // X (minimax) must never lose
    }
  });

  it('mutual minimax play always draws', () => {
    let b: BoardState = createEmptyBoard();
    let player: 'X' | 'O' = 'X';
    let result = evaluateGame(b).result;

    while (result === null) {
      const move = getMinimaxMove(b, player);
      b = [...b];
      b[move] = player;
      result = evaluateGame(b).result;
      player = player === 'X' ? 'O' : 'X';
    }

    expect(result).toBe('DRAW');
  });
});
