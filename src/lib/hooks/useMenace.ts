/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BoardState,
  GameMode,
  GameResult,
  GameStats,
  Matchbox,
  MoveRecord,
  Player,
} from '../menace/types';
import { generateMatchboxes } from '../menace/matchboxGenerator';
import {
  createEmptyBoard,
  evaluateGame,
  getMinimaxMove,
  getRandomMove,
} from '../menace/boardUtils';
import { reinforceMatchboxes, selectMenaceMove } from '../menace/menaceEngine';
import { getCanonicalRepresentation } from '../menace/symmetry';

const STORAGE_KEY_MATCHBOXES = 'MENACE_MATCHBOXES_V1';
const STORAGE_KEY_STATS = 'MENACE_STATS_V1';

export function useMenace() {
  const [menacePlayer, setMenacePlayer] = useState<Player>('O');
  const [matchboxes, setMatchboxes] = useState<Record<string, Matchbox>>({});
  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [gameMode, setGameMode] = useState<GameMode>('HUMAN_VS_MENACE');
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [activeMatchboxId, setActiveMatchboxId] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [isAutoTraining, setIsAutoTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState({ current: 0, total: 0 });

  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    menaceWins: 0,
    opponentWins: 0,
    draws: 0,
    winRateHistory: [],
  });

  // Reference for auto-training loop cancel
  const autoTrainRef = useRef(false);

  // Initialize and load stored matchboxes on mount
  useEffect(() => {
    try {
      const savedBoxes = localStorage.getItem(STORAGE_KEY_MATCHBOXES);
      const savedStats = localStorage.getItem(STORAGE_KEY_STATS);

      if (savedBoxes) {
        setMatchboxes(JSON.parse(savedBoxes));
      } else {
        setMatchboxes(generateMatchboxes('O'));
      }

      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch {
      setMatchboxes(generateMatchboxes('O'));
    }
  }, []);

  // Save matchboxes to localStorage on update
  useEffect(() => {
    if (Object.keys(matchboxes).length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY_MATCHBOXES, JSON.stringify(matchboxes));
    } catch {
      // Handle storage quota exceptions silently
    }
  }, [matchboxes]);

  // Save stats to localStorage on update
  useEffect(() => {
    if (stats.totalGames === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // Handle storage quota exceptions silently
    }
  }, [stats]);

  // Update active matchbox when board updates
  useEffect(() => {
    if (gameResult !== null) return;
    const countX = board.filter((c) => c === 'X').length;
    const countO = board.filter((c) => c === 'O').length;
    const isMenaceTurn = menacePlayer === 'O' ? countX === countO + 1 : countX === countO;

    if (!isMenaceTurn) {
      setActiveMatchboxId(null);
      return;
    }

    const { canonicalId } = getCanonicalRepresentation(board);
    setActiveMatchboxId(canonicalId);
  }, [board, menacePlayer, gameResult]);

  const handleGameEnd = useCallback(
    (finalBoard: BoardState, history: MoveRecord[], result: GameResult, line: number[] | null) => {
      setGameResult(result);
      setWinningLine(line);

      // Reinforce MENACE matchboxes
      setMatchboxes((prevBoxes) => {
        const updated = reinforceMatchboxes(history, result, menacePlayer, prevBoxes);
        return updated;
      });

      // Update statistics
      setStats((prev) => {
        const total = prev.totalGames + 1;
        const menaceWon = result === menacePlayer;
        const opponentWon = result !== 'DRAW' && result !== menacePlayer;
        const draw = result === 'DRAW';

        const menaceWins = prev.menaceWins + (menaceWon ? 1 : 0);
        const opponentWins = prev.opponentWins + (opponentWon ? 1 : 0);
        const draws = prev.draws + (draw ? 1 : 0);

        const menaceWinRate = Math.round((menaceWins / total) * 100);
        const drawRate = Math.round((draws / total) * 100);

        const newHistory =
          total % 5 === 0 || total === 1
            ? [...prev.winRateHistory, { game: total, menaceWinRate, drawRate }]
            : prev.winRateHistory;

        return {
          totalGames: total,
          menaceWins,
          opponentWins,
          draws,
          winRateHistory: newHistory.slice(-50), // keep last 50 data points
        };
      });
    },
    [menacePlayer]
  );

  const makeMove = useCallback(
    (moveIndex: number, player: Player) => {
      if (board[moveIndex] !== null || gameResult !== null) return;

      const newBoard = [...board];
      newBoard[moveIndex] = player;
      setBoard(newBoard);

      const { result, winningLine: line } = evaluateGame(newBoard);
      const nextPlayer: Player = player === 'X' ? 'O' : 'X';
      setCurrentPlayer(nextPlayer);

      if (result !== null) {
        handleGameEnd(newBoard, moveHistory, result, line);
      }
    },
    [board, gameResult, moveHistory, handleGameEnd]
  );

  // MENACE automated turn handler
  const executeMenaceTurn = useCallback(
    (currentBoard: BoardState, history: MoveRecord[]) => {
      const selection = selectMenaceMove(currentBoard, matchboxes);

      const newRecord: MoveRecord = {
        matchboxId: selection.matchboxId,
        moveIndex: selection.canonicalMoveIndex,
        actualBoardMoveIndex: selection.actualBoardMoveIndex,
        player: menacePlayer,
      };

      const newHistory = [...history, newRecord];
      setMoveHistory(newHistory);

      if (selection.resigned) {
        // MENACE resigns because matchbox is empty
        const opponentPlayer = menacePlayer === 'X' ? 'O' : 'X';
        handleGameEnd(currentBoard, newHistory, opponentPlayer, null);
        return;
      }

      const newBoard = [...currentBoard];
      newBoard[selection.actualBoardMoveIndex] = menacePlayer;
      setBoard(newBoard);

      const { result, winningLine: line } = evaluateGame(newBoard);
      const nextPlayer: Player = menacePlayer === 'X' ? 'O' : 'X';
      setCurrentPlayer(nextPlayer);

      if (result !== null) {
        handleGameEnd(newBoard, newHistory, result, line);
      }
    },
    [matchboxes, menacePlayer, handleGameEnd]
  );

  // Trigger MENACE move when it's MENACE's turn in Human vs AI
  useEffect(() => {
    if (isAutoTraining || gameResult !== null) return;
    if (currentPlayer !== menacePlayer || gameMode !== 'HUMAN_VS_MENACE') return;

    const timer = setTimeout(() => {
      executeMenaceTurn(board, moveHistory);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentPlayer, menacePlayer, gameMode, board, moveHistory, gameResult, isAutoTraining, executeMenaceTurn]);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('X');
    setGameResult(null);
    setWinningLine(null);
    setMoveHistory([]);
  }, []);

  const resetMatchboxes = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_MATCHBOXES);
      localStorage.removeItem(STORAGE_KEY_STATS);
    } catch {
      // Ignore
    }
    const initialBoxes = generateMatchboxes(menacePlayer);
    setMatchboxes(initialBoxes);
    setStats({
      totalGames: 0,
      menaceWins: 0,
      opponentWins: 0,
      draws: 0,
      winRateHistory: [],
    });
    resetGame();
  }, [menacePlayer, resetGame]);

  // Fast Batch Training Loop
  const runAutoTrain = useCallback(
    async (numGames: number, opponentType: 'RANDOM' | 'PERFECT' | 'SELF') => {
      setIsAutoTraining(true);
      autoTrainRef.current = true;
      let currentBoxes = { ...matchboxes };

      let currentWins = stats.menaceWins;
      let currentOpponentWins = stats.opponentWins;
      let currentDraws = stats.draws;
      let total = stats.totalGames;
      const historyPoints = [...stats.winRateHistory];

      for (let i = 1; i <= numGames; i++) {
        if (!autoTrainRef.current) break;

        const simBoard = createEmptyBoard();
        let simPlayer: Player = 'X';
        const simHistory: MoveRecord[] = [];
        let simResult: GameResult = null;

        while (simResult === null) {
          if (simPlayer === menacePlayer) {
            const selection = selectMenaceMove(simBoard, currentBoxes);
            if (selection.resigned) {
              simResult = menacePlayer === 'X' ? 'O' : 'X';
              break;
            }
            simHistory.push({
              matchboxId: selection.matchboxId,
              moveIndex: selection.canonicalMoveIndex,
              actualBoardMoveIndex: selection.actualBoardMoveIndex,
              player: menacePlayer,
            });
            simBoard[selection.actualBoardMoveIndex] = menacePlayer;
          } else {
            let oppMove = -1;
            if (opponentType === 'SELF') {
              const selection = selectMenaceMove(simBoard, currentBoxes);
              if (selection.resigned) {
                simResult = simPlayer === 'X' ? 'O' : 'X';
                break;
              }
              simHistory.push({
                matchboxId: selection.matchboxId,
                moveIndex: selection.canonicalMoveIndex,
                actualBoardMoveIndex: selection.actualBoardMoveIndex,
                player: simPlayer,
              });
              oppMove = selection.actualBoardMoveIndex;
            } else if (opponentType === 'RANDOM') {
              oppMove = getRandomMove(simBoard);
            } else {
              oppMove = getMinimaxMove(simBoard, simPlayer);
            }

            if (oppMove !== -1) {
              simBoard[oppMove] = simPlayer;
            }
          }

          const evalRes = evaluateGame(simBoard);
          simResult = evalRes.result;
          simPlayer = simPlayer === 'X' ? 'O' : 'X';
        }

        // Reinforce
        currentBoxes = reinforceMatchboxes(simHistory, simResult, menacePlayer, currentBoxes);

        total += 1;
        if (simResult === menacePlayer) currentWins += 1;
        else if (simResult === 'DRAW') currentDraws += 1;
        else currentOpponentWins += 1;

        if (total % 10 === 0 || i === numGames) {
          const winRate = Math.round((currentWins / total) * 100);
          const drawRate = Math.round((currentDraws / total) * 100);
          historyPoints.push({ game: total, menaceWinRate: winRate, drawRate });
        }

        const stepInterval = Math.max(25, Math.floor(numGames / 100));
        if (i % stepInterval === 0 || i === numGames) {
          setMatchboxes(currentBoxes);
          setTrainingProgress({ current: i, total: numGames });
          setStats({
            totalGames: total,
            menaceWins: currentWins,
            opponentWins: currentOpponentWins,
            draws: currentDraws,
            winRateHistory: historyPoints.slice(-50),
          });
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      setMatchboxes(currentBoxes);
      setIsAutoTraining(false);
      resetGame();
    },
    [matchboxes, menacePlayer, stats, resetGame]
  );

  const stopAutoTrain = useCallback(() => {
    autoTrainRef.current = false;
    setIsAutoTraining(false);
  }, []);

  return {
    menacePlayer,
    setMenacePlayer,
    matchboxes,
    board,
    currentPlayer,
    gameMode,
    setGameMode,
    gameResult,
    winningLine,
    activeMatchboxId,
    stats,
    isAutoTraining,
    trainingProgress,
    makeMove,
    resetGame,
    resetMatchboxes,
    runAutoTrain,
    stopAutoTrain,
  };
}
