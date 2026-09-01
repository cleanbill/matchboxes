import { generateMatchboxes } from './src/lib/menace/matchboxGenerator';
import { reinforceMatchboxes, selectMenaceMove } from './src/lib/menace/menaceEngine';
import { createEmptyBoard, evaluateGame, getMinimaxMove, getRandomMove } from './src/lib/menace/boardUtils';
import { Player, MoveRecord, GameResult, Matchbox } from './src/lib/menace/types';

let boxes = generateMatchboxes('O');

for (let i = 0; i < 10000; i++) {
  let simBoard = createEmptyBoard();
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
      simBoard[selection.actualBoardMoveIndex] = 'O';
    } else {
      const oppMove = getMinimaxMove(simBoard, simPlayer);
      if (oppMove !== -1) simBoard[oppMove] = simPlayer;
    }
    simResult = evaluateGame(simBoard).result;
    simPlayer = simPlayer === 'X' ? 'O' : 'X';
  }
  boxes = reinforceMatchboxes(simHistory, simResult, 'O', boxes);
}

// See how many beads it has for the first move
console.log("Empty board matchbox ID:", Object.keys(boxes).find(k => boxes[k].turn === 2));
const turn2Boxes = Object.values(boxes).filter(b => b.turn === 2);
for (const b of turn2Boxes) {
  console.log(b.canonicalBoard.join(''), b.beads);
}
