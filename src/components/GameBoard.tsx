'use client';

import React from 'react';
import { BoardState, GameResult, Player } from '../lib/menace/types';

interface GameBoardProps {
  board: BoardState;
  currentPlayer: Player;
  menacePlayer: Player;
  gameResult: GameResult;
  winningLine: number[] | null;
  activeMatchboxId: string | null;
  onCellClick: (index: number) => void;
  onReset: () => void;
  disabled: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  currentPlayer,
  menacePlayer,
  gameResult,
  winningLine,
  activeMatchboxId,
  onCellClick,
  onReset,
  disabled,
}) => {
  const isMenaceTurn = currentPlayer === menacePlayer && gameResult === null;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-cyan-950/20">
      {/* Turn & Status Header */}
      <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80 min-h-[44px]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
          <span className="text-sm font-medium tracking-wide text-slate-300">
            {gameResult !== null ? (
              <span className="text-amber-400 font-semibold">Game Over</span>
            ) : isMenaceTurn ? (
              <span className="text-amber-400 font-semibold animate-pulse">MENACE Thinking...</span>
            ) : (
              <span className="text-cyan-400 font-semibold">Your Turn (X)</span>
            )}
          </span>
        </div>

        <div className="min-h-[26px] flex items-center">
          {activeMatchboxId && (
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-mono text-amber-300">
              Box: {activeMatchboxId}
            </div>
          )}
        </div>
      </div>

      {/* 3x3 Grid Board */}
      <div className="grid grid-cols-3 gap-3.5 w-full aspect-square p-2 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner">
        {board.map((cell, idx) => {
          const isWinningSquare = winningLine?.includes(idx);
          const posNumber = idx + 1; // 1 to 9 numbering

          return (
            <button
              key={idx}
              disabled={disabled || cell !== null || gameResult !== null || isMenaceTurn}
              onClick={() => onCellClick(idx)}
              className={`
                relative flex items-center justify-center rounded-xl transition-all duration-300
                group overflow-hidden border select-none
                ${
                  isWinningSquare
                    ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/30'
                    : cell !== null
                    ? 'bg-slate-900/90 border-slate-800/90'
                    : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10'
                }
              `}
            >
              {/* Position Number Label (1-9) */}
              <span className="absolute top-2 left-2.5 text-[11px] font-mono font-semibold tracking-wider text-slate-500/80 group-hover:text-cyan-400/90 transition-colors select-none">
                {posNumber}
              </span>

              {/* Symbol X or O */}
              {cell === 'X' && (
                <span className="text-5xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-cyan-400 to-blue-500 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                  X
                </span>
              )}

              {cell === 'O' && (
                <span className="text-5xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]">
                  O
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Result Banner / Play Again Button */}
      {gameResult !== null ? (
        <div className="w-full mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="text-base font-semibold">
            {gameResult === 'DRAW' ? (
              <span className="text-slate-300">🤝 It&apos;s a Draw!</span>
            ) : gameResult === menacePlayer ? (
              <span className="text-amber-400">🤖 MENACE (O) Won!</span>
            ) : (
              <span className="text-cyan-400">🎉 You (X) Won!</span>
            )}
          </div>

          <button
            onClick={onReset}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
          >
            Play Again
          </button>
        </div>
      ) : (
        <div className="w-full mt-5 flex items-center justify-between text-xs text-slate-400">
          <span>Click any numbered square (1-9) to play X</span>
          <button
            onClick={onReset}
            className="text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
          >
            Clear Board
          </button>
        </div>
      )}
    </div>
  );
};
