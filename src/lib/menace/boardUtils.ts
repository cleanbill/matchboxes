import { BoardState, GameResult, Player } from './types';

export const WINNING_LINES = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Col 1
  [1, 4, 7], // Col 2
  [2, 5, 8], // Col 3
  [0, 4, 8], // Diag 1
  [2, 4, 6], // Diag 2
];

export function createEmptyBoard(): BoardState {
  return Array(9).fill(null);
}

export function getTurnNumber(board: BoardState): number {
  const count = board.filter((cell) => cell !== null).length;
  return count + 1;
}

export function getValidMoves(board: BoardState): number[] {
  const moves: number[] = [];
  board.forEach((cell, idx) => {
    if (cell === null) moves.push(idx);
  });
  return moves;
}

export function evaluateGame(board: BoardState): { result: GameResult; winningLine: number[] | null } {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { result: board[a], winningLine: line };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { result: 'DRAW', winningLine: null };
  }

  return { result: null, winningLine: null };
}

export function getRandomMove(board: BoardState): number {
  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) return -1;
  const randomIndex = Math.floor(Math.random() * validMoves.length);
  return validMoves[randomIndex];
}

function evaluateTerminalScore(
  result: GameResult,
  player: Player,
  opponent: Player,
  depth: number
): number | null {
  if (result === player) return 10 - depth;
  if (result === opponent) return depth - 10;
  if (result === 'DRAW') return 0;
  return null;
}

/**
 * Perfect Minimax solver for Tic-Tac-Toe opponent
 */
export function getMinimaxMove(board: BoardState, player: Player): number {
  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) return -1;

  const opponent: Player = player === 'X' ? 'O' : 'X';

  function minimax(currentBoard: BoardState, isMaximizing: boolean, depth: number): number {
    const { result } = evaluateGame(currentBoard);
    const terminalScore = evaluateTerminalScore(result, player, opponent, depth);
    if (terminalScore !== null) return terminalScore;

    const moves = getValidMoves(currentBoard);
    const targetPlayer = isMaximizing ? player : opponent;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (const move of moves) {
      currentBoard[move] = targetPlayer;
      const score = minimax(currentBoard, !isMaximizing, depth + 1);
      currentBoard[move] = null;
      bestScore = isMaximizing ? Math.max(bestScore, score) : Math.min(bestScore, score);
    }

    return bestScore;
  }

  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const move of validMoves) {
    board[move] = player;
    const score = minimax(board, false, 0);
    board[move] = null;
    
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  // Randomly select among all moves that tie for the best score
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
