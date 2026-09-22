import { generateMatchboxes } from './src/lib/menace/matchboxGenerator';
import { reinforceMatchboxes, selectMenaceMove } from './src/lib/menace/menaceEngine';
import { createEmptyBoard, evaluateGame, getTurnNumber } from './src/lib/menace/boardUtils';
import { Player, MoveRecord, GameResult, Matchbox, BoardState } from './src/lib/menace/types';
import { getCanonicalRepresentation, canonicalMoveToActualMove } from './src/lib/menace/symmetry';

// Generate all matchboxes & train for 50,000 games in Self-Play
function generateAllMatchboxes(): Record<string, Matchbox> {
  const map: Record<string, Matchbox> = {};
  function dfs(board: BoardState) {
    const { result } = evaluateGame(board);
    if (result !== null) return;
    const { canonicalId, canonicalBoard } = getCanonicalRepresentation(board);
    if (!map[canonicalId]) {
      const turn = getTurnNumber(canonicalBoard);
      const beads: Record<number, number> = {};
      let totalBeads = 0;
      canonicalBoard.forEach((c, idx) => {
        if (c === null) { beads[idx] = 4; totalBeads += 4; }
      });
      map[canonicalId] = {
        id: canonicalId, canonicalBoard, turn, beads, totalBeads,
        stats: { timesAccessed: 0, wins: 0, draws: 0, losses: 0 }
      };
    }
    const countX = board.filter(c => c === 'X').length;
    const countO = board.filter(c => c === 'O').length;
    const player = countX === countO ? 'X' : 'O';
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = player; dfs(board); board[i] = null;
      }
    }
  }
  dfs(createEmptyBoard());
  return map;
}

function reinforceAll(gameHistory: MoveRecord[], gameResult: GameResult, matchboxes: Record<string, Matchbox>) {
  const updated = { ...matchboxes };
  for (const record of gameHistory) {
    const mb = updated[record.matchboxId];
    if (!mb) continue;
    let reward = 0;
    let type: 'wins' | 'draws' | 'losses' = 'losses';
    if (gameResult === 'DRAW') { reward = 1; type = 'draws'; }
    else if (gameResult === record.player) { reward = 3; type = 'wins'; }
    else { reward = -1; type = 'losses'; }
    const current = mb.beads[record.moveIndex] ?? 0;
    const newCount = Math.max(0, current + reward);
    const newBeads = { ...mb.beads, [record.moveIndex]: newCount };
    let newTotal = Object.values(newBeads).reduce((a, b) => a + b, 0);
    if (newTotal > 500) {
      for (const idx in newBeads) {
        if (newBeads[idx] > 0) newBeads[idx] = Math.max(1, Math.floor(newBeads[idx] * 0.8));
      }
      newTotal = Object.values(newBeads).reduce((a, b) => a + b, 0);
    }
    updated[record.matchboxId] = {
      ...mb, beads: newBeads, totalBeads: newTotal,
      stats: { ...mb.stats, [type]: mb.stats[type] + 1 }
    };
  }
  return updated;
}

let boxes = generateAllMatchboxes();
for (let i = 0; i < 50000; i++) {
  const board = createEmptyBoard();
  let player: Player = 'X';
  let res: GameResult = null;
  const history: MoveRecord[] = [];
  while (res === null) {
    const sel = selectMenaceMove(board, boxes);
    if (sel.resigned) { res = player === 'X' ? 'O' : 'X'; break; }
    history.push({
      matchboxId: sel.matchboxId, moveIndex: sel.canonicalMoveIndex,
      actualBoardMoveIndex: sel.actualBoardMoveIndex, player
    });
    board[sel.actualBoardMoveIndex] = player;
    res = evaluateGame(board).result;
    player = player === 'X' ? 'O' : 'X';
  }
  boxes = reinforceAll(history, res, boxes);
}

// Now let's test the user's line!
// User plays X at 4 (center).
// MENACE plays O (Turn 2).
// User plays X at 5 (middle-right).
// Where does MENACE play O (Turn 4)?

console.log("\n=== Testing User Line ===");
const board: BoardState = createEmptyBoard();
board[4] = 'X'; // User plays center
console.log("Turn 1: User plays X at 4");

const sel1 = selectMenaceMove(board, boxes);
console.log(`Turn 2: MENACE plays O at ${sel1.actualBoardMoveIndex} (Matchbox ${sel1.matchboxId}, beads:`, boxes[sel1.matchboxId].beads, `)`);
board[sel1.actualBoardMoveIndex] = 'O';

// User plays X at 5
board[5] = 'X';
console.log("Turn 3: User plays X at 5. Current board:");
console.log(board.slice(0, 3));
console.log(board.slice(3, 6));
console.log(board.slice(6, 9));

const sel2 = selectMenaceMove(board, boxes);
console.log(`Turn 4: MENACE plays O at ${sel2.actualBoardMoveIndex} (Matchbox ${sel2.matchboxId}, beads:`, boxes[sel2.matchboxId].beads, `)`);

// Check if move 3 (the block for 4, 5) was chosen!
if (sel2.actualBoardMoveIndex === 3) {
  console.log("SUCCESS: MENACE correctly blocked X at position 3!");
} else {
  console.log("WARNING: MENACE played at", sel2.actualBoardMoveIndex, "instead of 3!");
}

