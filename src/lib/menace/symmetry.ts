import { BoardState, SymmetryTransform } from './types';

// The 8 rigid transformations of a 3x3 square grid
export const TRANSFORMS: SymmetryTransform[] = [
  {
    name: 'IDENTITY',
    map: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    inverseMap: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    name: 'ROTATE_90',
    map: [6, 3, 0, 7, 4, 1, 8, 5, 2],
    inverseMap: [2, 5, 8, 1, 4, 7, 0, 3, 6],
  },
  {
    name: 'ROTATE_180',
    map: [8, 7, 6, 5, 4, 3, 2, 1, 0],
    inverseMap: [8, 7, 6, 5, 4, 3, 2, 1, 0],
  },
  {
    name: 'ROTATE_270',
    map: [2, 5, 8, 1, 4, 7, 0, 3, 6],
    inverseMap: [6, 3, 0, 7, 4, 1, 8, 5, 2],
  },
  {
    name: 'FLIP_H',
    map: [2, 1, 0, 5, 4, 3, 8, 7, 6],
    inverseMap: [2, 1, 0, 5, 4, 3, 8, 7, 6],
  },
  {
    name: 'FLIP_V',
    map: [6, 7, 8, 3, 4, 5, 0, 1, 2],
    inverseMap: [6, 7, 8, 3, 4, 5, 0, 1, 2],
  },
  {
    name: 'FLIP_DIAG_MAIN',
    map: [0, 3, 6, 1, 4, 7, 2, 5, 8],
    inverseMap: [0, 3, 6, 1, 4, 7, 2, 5, 8],
  },
  {
    name: 'FLIP_DIAG_ANTI',
    map: [8, 5, 2, 7, 4, 1, 6, 3, 0],
    inverseMap: [8, 5, 2, 7, 4, 1, 6, 3, 0],
  },
];

export function boardToString(board: BoardState): string {
  return board.map((cell) => cell ?? '.').join('');
}

export function stringToBoard(str: string): BoardState {
  return str.split('').map((ch) => (ch === '.' ? null : (ch as 'X' | 'O')));
}

export function applyTransform(board: BoardState, map: number[]): BoardState {
  return map.map((srcIdx) => board[srcIdx]);
}

export interface CanonicalResult {
  canonicalId: string;
  canonicalBoard: BoardState;
  transformIndex: number; // Index into TRANSFORMS
  transformMap: number[];
}

/**
 * Returns the canonical (lexicographically smallest string) representation of a board state,
 * along with the transformation required to map the original board to the canonical board.
 */
export function getCanonicalRepresentation(board: BoardState): CanonicalResult {
  let bestId = 'ZZZZZZZZZ'; // Highest possible string
  let bestTransformIndex = 0;
  let bestBoard: BoardState = board;

  for (let i = 0; i < TRANSFORMS.length; i++) {
    const transformed = applyTransform(board, TRANSFORMS[i].map);
    const id = boardToString(transformed);
    if (id < bestId) {
      bestId = id;
      bestTransformIndex = i;
      bestBoard = transformed;
    }
  }

  return {
    canonicalId: bestId,
    canonicalBoard: bestBoard,
    transformIndex: bestTransformIndex,
    transformMap: TRANSFORMS[bestTransformIndex].map,
  };
}

/**
 * Given a move chosen on the canonical board (0..8), returns the corresponding move index on the actual game board.
 */
export function canonicalMoveToActualMove(canonicalMoveIndex: number, transformMap: number[]): number {
  return transformMap[canonicalMoveIndex];
}
