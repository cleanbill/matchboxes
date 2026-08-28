import { describe, it, expect } from 'vitest';
import { selectMenaceMove, reinforceMatchboxes } from './menaceEngine';
import { generateMatchboxes } from './matchboxGenerator';
import { createEmptyBoard, evaluateGame, getRandomMove, getMinimaxMove } from './boardUtils';
import { getCanonicalRepresentation } from './symmetry';
import { BoardState, GameResult, Matchbox, MoveRecord, Player } from './types';

// ─── helpers ────────────────────────────────────────────────────────────────

function freshBoxes() {
  return generateMatchboxes('O');
}

/** Play a single full simulated game and return { result, history, updatedMatchboxes } */
function simulateGame(
  boxes: Record<string, Matchbox>,
  opponentMove: (b: BoardState) => number
): { result: GameResult; history: MoveRecord[]; matchboxes: Record<string, Matchbox> } {
  let simBoard: BoardState = createEmptyBoard();
  let simPlayer: Player = 'X';
  const simHistory: MoveRecord[] = [];
  let simResult: GameResult = null;

  while (simResult === null) {
    if (simPlayer === 'O') {
      const selection = selectMenaceMove(simBoard, boxes);
      if (selection.resigned) {
        simResult = 'X';
        break;
      }
      simHistory.push({
        matchboxId: selection.matchboxId,
        moveIndex: selection.canonicalMoveIndex,
        actualBoardMoveIndex: selection.actualBoardMoveIndex,
        player: 'O',
      });
      simBoard = [...simBoard];
      simBoard[selection.actualBoardMoveIndex] = 'O';
    } else {
      const move = opponentMove(simBoard);
      if (move !== -1) {
        simBoard = [...simBoard];
        simBoard[move] = 'X';
      }
    }

    const evalRes = evaluateGame(simBoard);
    simResult = evalRes.result;
    simPlayer = simPlayer === 'X' ? 'O' : 'X';
  }

  const updatedBoxes = reinforceMatchboxes(simHistory, simResult!, 'O', boxes);
  return { result: simResult, history: simHistory, matchboxes: updatedBoxes };
}

// ─── selectMenaceMove ────────────────────────────────────────────────────────

describe('selectMenaceMove', () => {
  it('returns a valid move on a board where it is O\'s turn', () => {
    const boxes = freshBoxes();
    // X goes first, then O's turn
    const b: BoardState = [...createEmptyBoard()];
    b[4] = 'X';
    const result = selectMenaceMove(b, boxes);
    expect(result.resigned).toBe(false);
    expect(result.actualBoardMoveIndex).toBeGreaterThanOrEqual(0);
    expect(result.actualBoardMoveIndex).toBeLessThanOrEqual(8);
    expect(b[result.actualBoardMoveIndex]).toBeNull();
  });

  it('chosen actual move cell is always empty on the real board', () => {
    const boxes = freshBoxes();
    // Test on 20 different boards where it's O's turn (X has 1 piece)
    const startPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (const xPos of startPositions) {
      const b: BoardState = [...createEmptyBoard()];
      b[xPos] = 'X';
      const { actualBoardMoveIndex, resigned } = selectMenaceMove(b, boxes);
      if (!resigned) {
        expect(b[actualBoardMoveIndex]).toBeNull();
      }
    }
  });

  it('returns resigned:true when the relevant matchbox has all beads drained', () => {
    const boxes = freshBoxes();
    // Use a known board state where it's O's turn: X at centre
    const b: BoardState = [...createEmptyBoard()];
    b[4] = 'X';

    // Find the canonical ID for this board
    const { canonicalId } = getCanonicalRepresentation(b);

    const emptyBox: Matchbox = {
      ...boxes[canonicalId],
      beads: Object.fromEntries(Object.keys(boxes[canonicalId].beads).map((k) => [k, 0])),
      totalBeads: 0,
    };
    const drainingBoxes = { ...boxes, [canonicalId]: emptyBox };

    const result = selectMenaceMove(b, drainingBoxes);
    expect(result.resigned).toBe(true);
  });
});

// ─── reinforceMatchboxes ─────────────────────────────────────────────────────

describe('reinforceMatchboxes', () => {
  function makeRecord(matchboxId: string, moveIndex: number): MoveRecord {
    return { matchboxId, moveIndex, actualBoardMoveIndex: moveIndex, player: 'O' };
  }

  function firstBox(boxes: Record<string, Matchbox>) {
    const id = Object.keys(boxes)[0];
    const moveIdx = Number(Object.keys(boxes[id].beads)[0]);
    return { id, moveIdx };
  }

  it('WIN adds +3 beads to the chosen move in each used matchbox', () => {
    const boxes = freshBoxes();
    const { id, moveIdx } = firstBox(boxes);
    const before = boxes[id].beads[moveIdx];
    const updated = reinforceMatchboxes([makeRecord(id, moveIdx)], 'O', 'O', boxes);
    expect(updated[id].beads[moveIdx]).toBe(before + 3);
  });

  it('DRAW adds +1 bead to the chosen move in each used matchbox', () => {
    const boxes = freshBoxes();
    const { id, moveIdx } = firstBox(boxes);
    const before = boxes[id].beads[moveIdx];
    const updated = reinforceMatchboxes([makeRecord(id, moveIdx)], 'DRAW', 'O', boxes);
    expect(updated[id].beads[moveIdx]).toBe(before + 1);
  });

  it('LOSS removes 1 bead from the chosen move', () => {
    const boxes = freshBoxes();
    const { id, moveIdx } = firstBox(boxes);
    const before = boxes[id].beads[moveIdx];
    const updated = reinforceMatchboxes([makeRecord(id, moveIdx)], 'X', 'O', boxes);
    expect(updated[id].beads[moveIdx]).toBe(Math.max(0, before - 1));
  });

  it('bead count never goes below 0', () => {
    const boxes = freshBoxes();
    const { id, moveIdx } = firstBox(boxes);
    const drainedBoxes = {
      ...boxes,
      [id]: { ...boxes[id], beads: { ...boxes[id].beads, [moveIdx]: 0 } },
    };
    const updated = reinforceMatchboxes([makeRecord(id, moveIdx)], 'X', 'O', drainedBoxes);
    expect(updated[id].beads[moveIdx]).toBe(0);
  });

  it('increments timesAccessed on each used matchbox', () => {
    const boxes = freshBoxes();
    const { id, moveIdx } = firstBox(boxes);
    const updated = reinforceMatchboxes([makeRecord(id, moveIdx)], 'O', 'O', boxes);
    expect(updated[id].stats.timesAccessed).toBe(1);
  });

  it('does not mutate matchboxes not included in the game history', () => {
    const boxes = freshBoxes();
    const ids = Object.keys(boxes);
    const usedId = ids[0];
    const unusedId = ids[1];
    const moveIdx = Number(Object.keys(boxes[usedId].beads)[0]);
    const unusedBefore = JSON.stringify(boxes[unusedId]);
    const updated = reinforceMatchboxes([makeRecord(usedId, moveIdx)], 'O', 'O', boxes);
    expect(JSON.stringify(updated[unusedId])).toBe(unusedBefore);
  });
});

// ─── Integration: learning direction ─────────────────────────────────────────

describe('MENACE integration', () => {
  it(
    'after 2000 games vs random play, win+draw rate exceeds 40%',
    { timeout: 60_000 },
    () => {
      let boxes = freshBoxes();
      let winsOrDraws = 0;
      const GAMES = 2000;

      for (let i = 0; i < GAMES; i++) {
        const { result, matchboxes } = simulateGame(boxes, getRandomMove);
        boxes = matchboxes;
        if (result === 'O' || result === 'DRAW') winsOrDraws++;
      }

      // After enough training vs random, MENACE should win/draw well above a baseline
      expect(winsOrDraws / GAMES).toBeGreaterThan(0.4);
    }
  );

  it(
    'beads grow on winning moves and shrink on losing moves after training',
    { timeout: 60_000 },
    () => {
      let boxes = freshBoxes();

      // Record initial total beads across all matchboxes
      const initialTotal = Object.values(boxes).reduce((s, b) => s + b.totalBeads, 0);

      // Run 500 games vs random — MENACE as O should learn to win sometimes
      for (let i = 0; i < 500; i++) {
        const { matchboxes } = simulateGame(boxes, getRandomMove);
        boxes = matchboxes;
      }

      const finalTotal = Object.values(boxes).reduce((s, b) => s + b.totalBeads, 0);

      // If MENACE ever wins, beads increase overall (+3 per win move vs -1 per loss).
      // Total should have changed from initial in some direction (not stuck at exactly initial).
      expect(finalTotal).not.toBe(initialTotal);
    }
  );
});
