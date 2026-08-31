'use client';

import React, { useState } from 'react';
import { GameMode } from '../lib/menace/types';

interface TrainingPanelProps {
  gameMode: GameMode;
  onSetGameMode: (mode: GameMode) => void;
  isAutoTraining: boolean;
  trainingProgress: { current: number; total: number };
  onStartAutoTrain: (numGames: number, opponent: 'RANDOM' | 'PERFECT' | 'SELF') => void;
  onStopAutoTrain: () => void;
  onResetMatchboxes: () => void;
}

export const TrainingPanel: React.FC<TrainingPanelProps> = ({
  gameMode,
  onSetGameMode,
  isAutoTraining,
  trainingProgress,
  onStartAutoTrain,
  onStopAutoTrain,
  onResetMatchboxes,
}) => {
  const [trainOpponent, setTrainOpponent] = useState<'RANDOM' | 'PERFECT'>('RANDOM');
  const [trainGames, setTrainGames] = useState<number>(100);

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl shadow-cyan-950/20 flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Mode Selection */}
      <div className="flex flex-col gap-2 w-full md:w-auto">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Play Mode
        </span>
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSetGameMode('HUMAN_VS_MENACE')}
            className={`
              px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${
                gameMode === 'HUMAN_VS_MENACE'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            Human vs MENACE
          </button>
        </div>
      </div>

      {/* Auto-Training Section */}
      <div className="flex flex-col gap-2 w-full md:w-auto flex-1 max-w-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <span>⚡ Automated Reinforcement Training</span>
            {isAutoTraining && (
              <span className="text-amber-400 font-mono text-xs animate-pulse">
                ({trainingProgress.current} / {trainingProgress.total} games)
              </span>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          {/* Opponent Type Selector */}
          <select
            value={trainOpponent}
            onChange={(e) => setTrainOpponent(e.target.value as 'RANDOM' | 'PERFECT')}
            disabled={isAutoTraining}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-medium focus:outline-none focus:border-cyan-500"
          >
            <option value="RANDOM">vs Random Opponent</option>
            <option value="PERFECT">vs Perfect Minimax AI</option>
          </select>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[10, 100, 1000, 10000, 100000].map((count) => (
              <button
                key={count}
                disabled={isAutoTraining}
                onClick={() => {
                  setTrainGames(count);
                  onStartAutoTrain(count, trainOpponent);
                }}
                className={`
                  px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border
                  ${
                    trainGames === count && !isAutoTraining
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }
                `}
              >
                +{count >= 1000 ? `${count / 1000}k` : count}
              </button>
            ))}
          </div>

          {/* Action Button */}
          {isAutoTraining ? (
            <button
              onClick={onStopAutoTrain}
              className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all ml-auto"
            >
              Stop Training
            </button>
          ) : (
            <button
              onClick={() => onStartAutoTrain(trainGames, trainOpponent)}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-amber-500/20 transition-all ml-auto"
            >
              Run Batch
            </button>
          )}
        </div>
      </div>

      {/* Machine Reset */}
      <div className="flex flex-col gap-2 w-full md:w-auto">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Machine State
        </span>
        <button
          onClick={() => {
            if (confirm('Reset MENACE back to initial Donald Michie 1961 bead weights?')) {
              onResetMatchboxes();
            }
          }}
          className="px-4 py-2 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 font-semibold text-xs rounded-xl transition-all"
        >
          Reset MENACE
        </button>
      </div>
    </div>
  );
};
