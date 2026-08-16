'use client';

import React from 'react';
import { GameStats } from '../lib/menace/types';

interface AnalyticsPanelProps {
  stats: GameStats;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ stats }) => {
  const { totalGames, menaceWins, opponentWins, draws, winRateHistory } = stats;

  const winPercentage = totalGames > 0 ? Math.round((menaceWins / totalGames) * 100) : 0;
  const drawPercentage = totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0;
  const lossPercentage = totalGames > 0 ? Math.round((opponentWins / totalGames) * 100) : 0;

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl shadow-cyan-950/20 flex flex-col gap-5">
      {/* Top Header & Counters */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <h2 className="text-base font-bold text-slate-200 tracking-wide">
            Learning Analytics & Convergence
          </h2>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Total Games: <strong className="text-slate-100 font-bold">{totalGames}</strong>
        </span>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Win Rate */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
          <span className="text-xs font-medium text-slate-400">MENACE Wins</span>
          <span className="text-2xl font-black text-amber-400 mt-1 font-mono">{menaceWins}</span>
          <span className="text-[11px] text-amber-500/80 font-mono mt-0.5">{winPercentage}% overall</span>
        </div>

        {/* Draws */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
          <span className="text-xs font-medium text-slate-400">Draws</span>
          <span className="text-2xl font-black text-slate-200 mt-1 font-mono">{draws}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 font-mono">{drawPercentage}% overall</span>
        </div>

        {/* Losses */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
          <span className="text-xs font-medium text-slate-400">MENACE Losses</span>
          <span className="text-2xl font-black text-rose-400 mt-1 font-mono">{opponentWins}</span>
          <span className="text-[11px] text-rose-500/80 mt-0.5 font-mono">{lossPercentage}% overall</span>
        </div>

        {/* Non-Loss Rate */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
          <span className="text-xs font-medium text-slate-400">Unbeaten Rate</span>
          <span className="text-2xl font-black text-cyan-400 mt-1 font-mono">
            {winPercentage + drawPercentage}%
          </span>
          <span className="text-[11px] text-cyan-500/80 mt-0.5 font-mono">Wins + Draws</span>
        </div>
      </div>

      {/* Visual Learning Trend Bar */}
      {totalGames > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Historical Game Outcomes Distribution</span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div
              style={{ width: `${winPercentage}%` }}
              className="bg-amber-400 h-full transition-all duration-500"
              title={`Wins: ${winPercentage}%`}
            />
            <div
              style={{ width: `${drawPercentage}%` }}
              className="bg-slate-400 h-full transition-all duration-500"
              title={`Draws: ${drawPercentage}%`}
            />
            <div
              style={{ width: `${lossPercentage}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`Losses: ${lossPercentage}%`}
            />
          </div>
        </div>
      )}

      {/* Simple Canvas/SVG Sparkline for Learning Curve */}
      {winRateHistory.length > 1 && (
        <div className="flex flex-col gap-2 pt-2">
          <span className="text-xs font-medium text-slate-400">
            Win + Draw Rate Convergence over Time
          </span>
          <div className="w-full h-20 bg-slate-950/80 rounded-2xl border border-slate-800 p-2 relative flex items-end gap-1">
            {winRateHistory.map((item, idx) => {
              const combinedRate = item.menaceWinRate + item.drawRate;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all hover:opacity-80 group relative"
                  style={{ height: `${Math.max(5, combinedRate)}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none z-10 whitespace-nowrap">
                    G#{item.game}: {combinedRate}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
