import { BoardState, Matchbox, Player } from './types';
import { getCanonicalRepresentation, stringToBoard } from './symmetry';
import { createEmptyBoard, evaluateGame, getTurnNumber, getValidMoves } from './boardUtils';

/**
 * Donald Michie's standard initial bead counts per available cell based on MENACE's turn index:
 * - 1st move (Turn 1 for MENACE, board has 1 mark): 4 beads per empty cell
 * - 2nd move (Turn 2 for MENACE, board has 3 marks): 3 beads per empty cell
 * - 3rd move (Turn 3 for MENACE, board has 5 marks): 2 beads per empty cell
 * - 4th move (Turn 4 for MENACE, board has 7 marks): 1 bead per empty cell
 */
export function getInitialBeadCount(menaceTurnIndex: number): number {
  switch (menaceTurnIndex) {
    case 1:
      return 4;
    case 2:
      return 3;
    case 3:
      return 2;
    case 4:
      return 1;
    default:
      return 1;
  }
}

function registerMatchbox(
  board: BoardState,
  countMenace: number,
  map: Record<string, Matchbox>
): void {
  const { canonicalId, canonicalBoard } = getCanonicalRepresentation(board);
  if (map[canonicalId]) return;

  const initialBeads = getInitialBeadCount(countMenace + 1);
  const beads: Record<number, number> = {};
  let totalBeads = 0;

  canonicalBoard.forEach((cell, idx) => {
    if (cell !== null) return;
    beads[idx] = initialBeads;
    totalBeads += initialBeads;
  });

  map[canonicalId] = {
    id: canonicalId,
    canonicalBoard,
    turn: getTurnNumber(canonicalBoard),
    beads,
    totalBeads,
    stats: { timesAccessed: 0, wins: 0, draws: 0, losses: 0 },
  };
}

/**
 * Generates all reachable, non-terminal canonical matchbox states for MENACE.
 * When MENACE plays as `menacePlayer` (default 'O'):
 * If 'O', MENACE moves when count('X') === count('O') + 1.
 */
export function generateMatchboxes(menacePlayer: Player = 'O'): Record<string, Matchbox> {
  const matchboxMap: Record<string, Matchbox> = {};
  const opponentPlayer: Player = menacePlayer === 'X' ? 'O' : 'X';

  function dfs(currentBoard: BoardState) {
    const { result } = evaluateGame(currentBoard);
    if (result !== null) return;

    const countMenace = currentBoard.filter((cell) => cell === menacePlayer).length;
    const countOpponent = currentBoard.filter((cell) => cell === opponentPlayer).length;

    const isMenaceTurn =
      menacePlayer === 'X' ? countMenace === countOpponent : countOpponent === countMenace + 1;

    if (isMenaceTurn) {
      registerMatchbox(currentBoard, countMenace, matchboxMap);
    }

    const validMoves = getValidMoves(currentBoard);
    const nextPlayerToMove = isMenaceTurn ? menacePlayer : opponentPlayer;

    for (const move of validMoves) {
      const nextBoard = [...currentBoard];
      nextBoard[move] = nextPlayerToMove;
      dfs(nextBoard);
    }
  }

  const startBoard = createEmptyBoard();
  dfs(startBoard);

  return matchboxMap;
}
