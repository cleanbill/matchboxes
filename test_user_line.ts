import { generateMatchboxes } from './src/lib/menace/matchboxGenerator';
import { reinforceMatchboxes, selectMenaceMove } from './src/lib/menace/menaceEngine';
import { createEmptyBoard, evaluateGame, getTurnNumber } from './src/lib/menace/boardUtils';
import { Player, MoveRecord, GameResult, Matchbox, BoardState } from './src/lib/menace/types';
import { getCanonicalRepresentation, canonicalMoveToActualMove, actualMoveToCanonicalMove } from './src/lib/menace/symmetry';

// Board representation: 0-8
// User: X at 4 (middle)
// O plays at 0 (corner) -> Board: O . . / . X . / . . .
// User plays at 5 (middle-right) -> Board: O . . / . X X / . . .
// User has 2-in-a-row (4, 5). Winning cell for X is 3!
// Let's check what MENACE sees when board is O . . / . X X / . . .

const board: BoardState = [
  'O', null, null,
  null, 'X', 'X',
  null, null, null
];

console.log("Actual Board:");
console.log(board.slice(0, 3));
console.log(board.slice(3, 6));
console.log(board.slice(6, 9));

const canonical = getCanonicalRepresentation(board);
console.log("\nCanonical Board ID:", canonical.canonicalId);
console.log("Canonical Board Array:");
console.log(canonical.canonicalBoard.slice(0, 3));
console.log(canonical.canonicalBoard.slice(3, 6));
console.log(canonical.canonicalBoard.slice(6, 9));
console.log("Transform index used:", canonical.transformIndex);

// Cell 3 on actual board is middle-left (index 3).
// What is move 3 on the canonical board?
const canonicalMoveForBlocking = actualMoveToCanonicalMove(3, canonical.transformIndex);
console.log("Actual move 3 (blocking) -> Canonical move:", canonicalMoveForBlocking);

// If MENACE plays move X on canonical board, where does it land on actual board?
for (let cMove = 0; cMove < 9; cMove++) {
  if (canonical.canonicalBoard[cMove] === null) {
    const act = canonicalMoveToActualMove(cMove, canonical.transformIndex);
    console.log(`Canonical move ${cMove} -> Actual move ${act} ${act === 3 ? '(BLOCKS WIN!)' : ''}`);
  }
}

