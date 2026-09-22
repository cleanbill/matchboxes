// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { useMenace } from './useMenace';
import { createEmptyBoard } from '../menace/boardUtils';
import { generateMatchboxes } from '../menace/matchboxGenerator';

// ─── One-time setup ──────────────────────────────────────────────────────────
//
// generateMatchboxes takes ~600ms. Build once and share via localStorage so
// the hook's init useEffect loads from cache instead of regenerating on every test.

let cachedMatchboxesJSON: string;

beforeAll(() => {
  cachedMatchboxesJSON = JSON.stringify(generateMatchboxes('O'));
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('MENACE_MATCHBOXES_V2', cachedMatchboxesJSON);
  // Fake timers prevent MENACE's 400ms auto-play from firing between moves.
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Render the hook and wait for the init useEffect to settle. */
async function setupHook() {
  const hook = renderHook(() => useMenace());
  await act(async () => {}); // flush init useEffect
  return hook;
}

/**
 * Make a sequence of moves, each in its own act() so React re-renders between
 * calls and the makeMove callback captures a fresh board closure each time.
 * Without this, all moves would read the same stale board and only the last
 * setBoard call would survive React's batching.
 */
function makeMoves(
  result: { current: ReturnType<typeof useMenace> },
  moves: Array<[number, 'X' | 'O']>
) {
  for (const [idx, player] of moves) {
    act(() => { result.current.makeMove(idx, player); });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('useMenace', () => {

  // ── Initial state ───────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with an empty board', async () => {
      const { result } = await setupHook();
      expect(result.current.board).toEqual(createEmptyBoard());
    });

    it('starts with X as the current player', async () => {
      const { result } = await setupHook();
      expect(result.current.currentPlayer).toBe('X');
    });

    it('has no game result', async () => {
      const { result } = await setupHook();
      expect(result.current.gameResult).toBeNull();
    });

    it('has no winning line', async () => {
      const { result } = await setupHook();
      expect(result.current.winningLine).toBeNull();
    });

    it('starts with zero stats', async () => {
      const { result } = await setupHook();
      const { totalGames, menaceWins, opponentWins, draws } = result.current.stats;
      expect(totalGames).toBe(0);
      expect(menaceWins).toBe(0);
      expect(opponentWins).toBe(0);
      expect(draws).toBe(0);
    });

    it('populates matchboxes on mount', async () => {
      const { result } = await setupHook();
      expect(Object.keys(result.current.matchboxes).length).toBeGreaterThan(0);
    });

    it('MENACE plays as O by default', async () => {
      const { result } = await setupHook();
      expect(result.current.menacePlayer).toBe('O');
    });

    it('starts in HUMAN_VS_MENACE mode', async () => {
      const { result } = await setupHook();
      expect(result.current.gameMode).toBe('HUMAN_VS_MENACE');
    });
  });

  // ── localStorage persistence ────────────────────────────────────────────

  describe('localStorage persistence', () => {
    it('saves matchboxes to localStorage after init', async () => {
      await setupHook();
      expect(localStorage.getItem('MENACE_MATCHBOXES_V2')).not.toBeNull();
    });

    it('loads saved matchboxes from localStorage on mount', async () => {
      // Overwrite with a sentinel to confirm the hook reads from localStorage
      const sentinel = {
        SENTINEL: {
          id: 'SENTINEL',
          canonicalBoard: Array(9).fill(null),
          beads: {},
          totalBeads: 0,
          turn: 1,
          stats: { timesAccessed: 42, wins: 0, draws: 0, losses: 0 },
        },
      };
      localStorage.setItem('MENACE_MATCHBOXES_V2', JSON.stringify(sentinel));

      const { result } = await setupHook();
      expect(result.current.matchboxes['SENTINEL']).toBeDefined();
      expect(result.current.matchboxes['SENTINEL'].stats.timesAccessed).toBe(42);
    });

    it('loads saved stats from localStorage on mount', async () => {
      const saved = { totalGames: 77, menaceWins: 30, opponentWins: 20, draws: 27, winRateHistory: [] };
      localStorage.setItem('MENACE_STATS_V2', JSON.stringify(saved));

      const { result } = await setupHook();
      expect(result.current.stats.totalGames).toBe(77);
      expect(result.current.stats.menaceWins).toBe(30);
    });

    it('persists stats to localStorage after a game ends', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]); // X wins row 1
      const stored = JSON.parse(localStorage.getItem('MENACE_STATS_V2') ?? 'null');
      expect(stored).not.toBeNull();
      expect(stored.totalGames).toBe(1);
    });
  });

  // ── makeMove ────────────────────────────────────────────────────────────

  describe('makeMove', () => {
    it('places a piece at the given index', async () => {
      const { result } = await setupHook();
      act(() => { result.current.makeMove(4, 'X'); });
      expect(result.current.board[4]).toBe('X');
    });

    it('advances currentPlayer after a move', async () => {
      const { result } = await setupHook();
      act(() => { result.current.makeMove(4, 'X'); });
      expect(result.current.currentPlayer).toBe('O');
    });

    it('ignores a move to an occupied cell', async () => {
      const { result } = await setupHook();
      act(() => { result.current.makeMove(4, 'X'); });
      act(() => { result.current.makeMove(4, 'O'); }); // overwrite attempt
      expect(result.current.board[4]).toBe('X');
    });

    it('ignores moves after the game has ended', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      const snapshot = [...result.current.board];
      act(() => { result.current.makeMove(3, 'O'); });
      expect(result.current.board).toEqual(snapshot);
    });

    it('sets gameResult when X wins a row', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      expect(result.current.gameResult).toBe('X');
    });

    it('sets winningLine when X wins', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      expect(result.current.winningLine).toEqual([0, 1, 2]);
    });

    it('sets gameResult when O wins a column', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'O'], [3, 'O'], [6, 'O']]);
      expect(result.current.gameResult).toBe('O');
      expect(result.current.winningLine).toEqual([0, 3, 6]);
    });

    it('sets gameResult when X wins on a diagonal', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [4, 'X'], [8, 'X']]);
      expect(result.current.gameResult).toBe('X');
      expect(result.current.winningLine).toEqual([0, 4, 8]);
    });

    it('sets gameResult to DRAW on a full board with no winner', async () => {
      // X O X / O O X / X X O — full, verified no intermediate win
      const { result } = await setupHook();
      makeMoves(result, [
        [0, 'X'], [1, 'O'], [2, 'X'],
        [3, 'O'], [4, 'O'], [5, 'X'],
        [6, 'X'], [7, 'X'], [8, 'O'],
      ]);
      expect(result.current.gameResult).toBe('DRAW');
    });
  });

  // ── Stats ───────────────────────────────────────────────────────────────

  describe('stats', () => {
    it('increments totalGames by 1 after a game ends', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      expect(result.current.stats.totalGames).toBe(1);
    });

    it('increments opponentWins when human (X) beats MENACE (O)', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      expect(result.current.stats.opponentWins).toBe(1);
      expect(result.current.stats.menaceWins).toBe(0);
    });

    it('increments menaceWins when MENACE (O) wins', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'O'], [3, 'O'], [6, 'O']]);
      expect(result.current.stats.menaceWins).toBe(1);
      expect(result.current.stats.opponentWins).toBe(0);
    });

    it('increments draws on a drawn game', async () => {
      const { result } = await setupHook();
      makeMoves(result, [
        [0, 'X'], [1, 'O'], [2, 'X'],
        [3, 'O'], [4, 'O'], [5, 'X'],
        [6, 'X'], [7, 'X'], [8, 'O'],
      ]);
      expect(result.current.stats.draws).toBe(1);
    });

    it('appends a winRateHistory entry on the first game', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      expect(result.current.stats.winRateHistory).toHaveLength(1);
      expect(result.current.stats.winRateHistory[0].game).toBe(1);
    });

    it('accumulates correctly across multiple sequential games', async () => {
      const { result } = await setupHook();

      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]); // game 1: X wins
      act(() => { result.current.resetGame(); });
      makeMoves(result, [[0, 'O'], [3, 'O'], [6, 'O']]); // game 2: O wins

      expect(result.current.stats.totalGames).toBe(2);
      expect(result.current.stats.opponentWins).toBe(1);
      expect(result.current.stats.menaceWins).toBe(1);
    });
  });

  // ── resetGame ───────────────────────────────────────────────────────────

  describe('resetGame', () => {
    it('clears the board', async () => {
      const { result } = await setupHook();
      act(() => { result.current.makeMove(4, 'X'); });
      act(() => { result.current.resetGame(); });
      expect(result.current.board).toEqual(createEmptyBoard());
    });

    it('resets currentPlayer to X', async () => {
      const { result } = await setupHook();
      act(() => { result.current.makeMove(4, 'X'); });
      act(() => { result.current.resetGame(); });
      expect(result.current.currentPlayer).toBe('X');
    });

    it('clears gameResult', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      act(() => { result.current.resetGame(); });
      expect(result.current.gameResult).toBeNull();
    });

    it('clears winningLine', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      act(() => { result.current.resetGame(); });
      expect(result.current.winningLine).toBeNull();
    });

    it('does NOT reset stats', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      act(() => { result.current.resetGame(); });
      expect(result.current.stats.totalGames).toBe(1);
    });
  });

  // ── resetMatchboxes ─────────────────────────────────────────────────────

  describe('resetMatchboxes', () => {
    it('resets stats to zero', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      act(() => { result.current.resetMatchboxes(); });
      expect(result.current.stats.totalGames).toBe(0);
      expect(result.current.stats.menaceWins).toBe(0);
      expect(result.current.stats.opponentWins).toBe(0);
    });

    it('clears the board', async () => {
      const { result } = await setupHook();
      act(() => { result.current.makeMove(4, 'X'); });
      act(() => { result.current.resetMatchboxes(); });
      expect(result.current.board).toEqual(createEmptyBoard());
    });

    it('removes stats from localStorage (totalGames=0 prevents re-save)', async () => {
      const { result } = await setupHook();
      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      // Verify stats are persisted before reset
      expect(
        JSON.parse(localStorage.getItem('MENACE_STATS_V2') ?? 'null')?.totalGames
      ).toBe(1);

      act(() => { result.current.resetMatchboxes(); });
      // stats.totalGames resets to 0 → the save guard fires → key is not re-written
      expect(localStorage.getItem('MENACE_STATS_V2')).toBeNull();
    });

    it('generates a fresh set of matchboxes matching the original count', async () => {
      const { result } = await setupHook();
      const expectedCount = Object.keys(result.current.matchboxes).length;
      act(() => { result.current.resetMatchboxes(); });
      expect(Object.keys(result.current.matchboxes).length).toBe(expectedCount);
    });
  });

  // ── MENACE auto-play ────────────────────────────────────────────────────

  describe('MENACE auto-play (HUMAN_VS_MENACE)', () => {
    it('fires automatically after 400 ms when it is MENACE\'s turn', async () => {
      const { result } = await setupHook();

      act(() => { result.current.makeMove(4, 'X'); }); // X plays centre
      expect(result.current.board.filter(c => c !== null).length).toBe(1);

      await act(async () => { vi.advanceTimersByTime(500); }); // past 400ms

      expect(result.current.board.filter(c => c !== null).length).toBe(2);
      expect(result.current.board.some((c, i) => i !== 4 && c === 'O')).toBe(true);
    });

    it('does NOT auto-play when gameMode is not HUMAN_VS_MENACE', async () => {
      const { result } = await setupHook();

      act(() => { result.current.setGameMode('MENACE_VS_RANDOM'); });
      act(() => { result.current.makeMove(4, 'X'); });
      await act(async () => { vi.advanceTimersByTime(500); });

      // Only X's piece — MENACE did not respond
      expect(result.current.board.filter(c => c !== null).length).toBe(1);
    });

    it('does NOT auto-play when the game is already over', async () => {
      const { result } = await setupHook();

      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]); // X wins
      expect(result.current.gameResult).toBe('X');

      const snapshot = [...result.current.board];
      await act(async () => { vi.advanceTimersByTime(500); });
      expect(result.current.board).toEqual(snapshot);
    });
  });

  // ── activeMatchboxId ────────────────────────────────────────────────────

  describe('activeMatchboxId', () => {
    it('is null on an empty board (X\'s turn, not MENACE\'s)', async () => {
      const { result } = await setupHook();
      expect(result.current.activeMatchboxId).toBeNull();
    });

    it('is set to a 9-char canonical ID when it is MENACE\'s turn', async () => {
      const { result } = await setupHook();

      act(() => { result.current.makeMove(4, 'X'); }); // now O's turn, timer not yet fired
      expect(result.current.activeMatchboxId).not.toBeNull();
      expect(result.current.activeMatchboxId).toHaveLength(9);
    });

    it('is null once the game ends', async () => {
      const { result } = await setupHook();

      makeMoves(result, [[0, 'X'], [1, 'X'], [2, 'X']]);
      expect(result.current.gameResult).toBe('X');
      // After win, gameResult!==null → activeMatchboxId effect exits early.
      // The previous render had 2 X pieces → not MENACE's turn → null was set then.
      expect(result.current.activeMatchboxId).toBeNull();
    });
  });

  // ── runAutoTrain ────────────────────────────────────────────────────────
  //
  // runAutoTrain uses `await new Promise(r => setTimeout(r, 0))` to yield the
  // event loop between batches. With fake timers we drain those with
  // vi.runAllTimersAsync() inside act so the promises resolve and training completes.

  describe('runAutoTrain', () => {
    it('plays the requested number of games vs RANDOM', async () => {
      const { result } = await setupHook();
      await act(async () => {
        const p = result.current.runAutoTrain(25, 'RANDOM');
        await vi.runAllTimersAsync();
        await p;
      });
      expect(result.current.stats.totalGames).toBe(25);
    });

    it('plays the requested number of games vs PERFECT', async () => {
      const { result } = await setupHook();
      await act(async () => {
        const p = result.current.runAutoTrain(10, 'PERFECT');
        await vi.runAllTimersAsync();
        await p;
      });
      expect(result.current.stats.totalGames).toBe(10);
    });

    it('plays in SELF play mode', async () => {
      const { result } = await setupHook();
      await act(async () => {
        const p = result.current.runAutoTrain(10, 'SELF');
        await vi.runAllTimersAsync();
        await p;
      });
      expect(result.current.stats.totalGames).toBe(10);
    });

    it('sets isAutoTraining to false when complete', async () => {
      const { result } = await setupHook();
      await act(async () => {
        const p = result.current.runAutoTrain(10, 'RANDOM');
        await vi.runAllTimersAsync();
        await p;
      });
      expect(result.current.isAutoTraining).toBe(false);
    });

    it('resets the board to empty after training', async () => {
      const { result } = await setupHook();
      await act(async () => {
        const p = result.current.runAutoTrain(10, 'RANDOM');
        await vi.runAllTimersAsync();
        await p;
      });
      expect(result.current.board).toEqual(createEmptyBoard());
    });

    it('reinforces matchboxes — timesAccessed grows with games played', async () => {
      const { result } = await setupHook();
      const accessedBefore = Object.values(result.current.matchboxes)
        .reduce((s, b) => s + b.stats.timesAccessed, 0);

      await act(async () => {
        const p = result.current.runAutoTrain(25, 'RANDOM');
        await vi.runAllTimersAsync();
        await p;
      });

      const accessedAfter = Object.values(result.current.matchboxes)
        .reduce((s, b) => s + b.stats.timesAccessed, 0);
      expect(accessedAfter).toBeGreaterThan(accessedBefore);
    });

    it('stopAutoTrain cancels the loop before all games complete', async () => {
      const { result } = await setupHook();

      // Start a large training run. The loop runs synchronously until the
      // first batch yield (at stepInterval = max(25, floor(N/100)) games).
      let trainPromise!: Promise<void>;
      act(() => {
        trainPromise = result.current.runAutoTrain(10_000, 'RANDOM');
      });
      // Set the cancellation flag before the suspended loop resumes
      act(() => { result.current.stopAutoTrain(); });
      // Drain the pending setTimeout(r,0) so the loop can check the flag and break
      await act(async () => { await vi.runAllTimersAsync(); });
      await trainPromise;

      expect(result.current.isAutoTraining).toBe(false);
      expect(result.current.stats.totalGames).toBeLessThan(10_000);
    });
  });
});
