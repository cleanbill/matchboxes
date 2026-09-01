import { BoardState, Matchbox, MoveRecord, Player, GameResult } from './types';
import { getCanonicalRepresentation, canonicalMoveToActualMove } from './symmetry';
import { getValidMoves } from './boardUtils';

export interface SelectMoveResult {
  matchboxId: string;
  canonicalMoveIndex: number;
  actualBoardMoveIndex: number;
  resigned: boolean;
}

/**
 * Selects a move for MENACE given the current board state and matchbox repository.
 * 1. Converts current board to canonical state.
 * 2. Fetches corresponding matchbox.
 * 3. Draws a random bead proportional to bead counts for available moves.
 * 4. Translates canonical move back to the actual board layout.
 */
export function selectMenaceMove(
  board: BoardState,
  matchboxes: Record<string, Matchbox>
): SelectMoveResult {
  const { canonicalId, transformMap } = getCanonicalRepresentation(board);
  const matchbox = matchboxes[canonicalId];

  if (!matchbox) {
    // Fallback if matchbox not found (e.g. unexpected board state)
    const validMoves = getValidMoves(board);
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return {
      matchboxId: canonicalId,
      canonicalMoveIndex: randomMove,
      actualBoardMoveIndex: randomMove,
      resigned: false,
    };
  }

  // Calculate total beads currently available
  const availableMoves = Object.keys(matchbox.beads)
    .map(Number)
    .filter((moveIdx) => matchbox.beads[moveIdx] > 0);

  const currentTotalBeads = availableMoves.reduce((sum, idx) => sum + matchbox.beads[idx], 0);

  // If no beads remain, MENACE must resign
  if (currentTotalBeads <= 0 || availableMoves.length === 0) {
    const validMoves = getValidMoves(board);
    const fallbackMove = validMoves[0] ?? 0;
    return {
      matchboxId: canonicalId,
      canonicalMoveIndex: fallbackMove,
      actualBoardMoveIndex: canonicalMoveToActualMove(fallbackMove, transformMap),
      resigned: true,
    };
  }

  // Roulette-wheel selection based on bead counts
  let randomVal = Math.random() * currentTotalBeads;
  let chosenCanonicalMove = availableMoves[0];

  for (const moveIdx of availableMoves) {
    const count = matchbox.beads[moveIdx];
    if (randomVal < count) {
      chosenCanonicalMove = moveIdx;
      break;
    }
    randomVal -= count;
  }

  const actualMove = canonicalMoveToActualMove(chosenCanonicalMove, transformMap);

  return {
    matchboxId: canonicalId,
    canonicalMoveIndex: chosenCanonicalMove,
    actualBoardMoveIndex: actualMove,
    resigned: false,
  };
}

const REWARD_MAP = {
  WIN: { reward: 3, type: 'wins' as const },
  DRAW: { reward: 1, type: 'draws' as const },
  LOSS: { reward: -1, type: 'losses' as const },
};

function getOutcomeReward(result: GameResult, menacePlayer: Player) {
  if (result === menacePlayer) return REWARD_MAP.WIN;
  if (result === 'DRAW') return REWARD_MAP.DRAW;
  return REWARD_MAP.LOSS;
}

/**
 * Reinforce matchboxes after a game completes based on Donald Michie's original rules:
 * - MENACE Wins: +3 beads of chosen color to each matchbox used
 * - Draw: +1 bead of chosen color to each matchbox used
 * - MENACE Loses: -1 bead of chosen color from each matchbox used
 */
export function reinforceMatchboxes(
  gameHistory: MoveRecord[],
  gameResult: GameResult,
  menacePlayer: Player,
  matchboxes: Record<string, Matchbox>
): Record<string, Matchbox> {
  const updatedMatchboxes = { ...matchboxes };
  const { reward, type: resultType } = getOutcomeReward(gameResult, menacePlayer);

  for (const record of gameHistory) {
    if (record.player !== menacePlayer) continue;

    const matchbox = updatedMatchboxes[record.matchboxId];
    if (!matchbox) continue;

    const currentCount = matchbox.beads[record.moveIndex] ?? 0;
    const newCount = Math.max(0, currentCount + reward);

    const newBeads = {
      ...matchbox.beads,
      [record.moveIndex]: newCount,
    };

    let newTotalBeads = Object.values(newBeads).reduce((a, b) => a + b, 0);

    // Normalization / Decay: Prevent unbounded growth
    // If the total beads in the matchbox exceeds 500, scale down all bead counts
    // by 20% while ensuring they don't drop below 1 unless they were already 0.
    if (newTotalBeads > 500) {
      for (const moveIdx in newBeads) {
        if (newBeads[moveIdx] > 0) {
          newBeads[moveIdx] = Math.max(1, Math.floor(newBeads[moveIdx] * 0.8));
        }
      }
      newTotalBeads = Object.values(newBeads).reduce((a, b) => a + b, 0);
    }

    updatedMatchboxes[record.matchboxId] = {
      ...matchbox,
      beads: newBeads,
      totalBeads: newTotalBeads,
      stats: {
        ...matchbox.stats,
        timesAccessed: matchbox.stats.timesAccessed + 1,
        [resultType]: matchbox.stats[resultType] + 1,
      },
    };
  }

  return updatedMatchboxes;
}
