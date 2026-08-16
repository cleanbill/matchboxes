export type CellState = 'X' | 'O' | null;
export type BoardState = CellState[]; // Length 9 array

export type Player = 'X' | 'O';
export type GameResult = 'X' | 'O' | 'DRAW' | null;

export interface Matchbox {
  id: string; // Canonical board state string key, e.g., "O........"
  canonicalBoard: BoardState;
  turn: number; // Turn number when MENACE plays (1, 3, 5, 7)
  beads: Record<number, number>; // Map cell index (0..8) -> bead count
  totalBeads: number;
  stats: {
    timesAccessed: number;
    wins: number;
    draws: number;
    losses: number;
  };
}

export interface MoveRecord {
  matchboxId: string;
  moveIndex: number; // Canonical move index (0..8)
  actualBoardMoveIndex: number; // Real move index on the current board (0..8)
  player: Player;
}

export type GameMode = 'HUMAN_VS_MENACE' | 'MENACE_VS_RANDOM' | 'MENACE_VS_PERFECT' | 'MENACE_VS_MENACE';

export interface GameStats {
  totalGames: number;
  menaceWins: number;
  opponentWins: number;
  draws: number;
  winRateHistory: { game: number; menaceWinRate: number; drawRate: number }[];
}

export interface SymmetryTransform {
  // Map index from original board to canonical board
  map: number[];
  // Inverse map from canonical board back to original board
  inverseMap: number[];
  name: string;
}
