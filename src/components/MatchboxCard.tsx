'use client';

import React from 'react';
import { Matchbox } from '../lib/menace/types';

interface MatchboxCardProps {
  matchbox: Matchbox;
  isActive: boolean;
}

// Color palette for beads 1 to 9 (matching grid positions)
const BEAD_COLORS = [
  'bg-red-500 text-red-100 border-red-400/50',
  'bg-orange-500 text-orange-100 border-orange-400/50',
  'bg-amber-500 text-amber-100 border-amber-400/50',
  'bg-emerald-500 text-emerald-100 border-emerald-400/50',
  'bg-teal-500 text-teal-100 border-teal-400/50',
  'bg-cyan-500 text-cyan-100 border-cyan-400/50',
  'bg-blue-500 text-blue-100 border-blue-400/50',
  'bg-indigo-500 text-indigo-100 border-indigo-400/50',
  'bg-purple-500 text-purple-100 border-purple-400/50',
];

export const MatchboxCard: React.FC<MatchboxCardProps> = ({ matchbox, isActive }) => {
  const { id, canonicalBoard, beads, totalBeads, stats, turn } = matchbox;

  return (
    <div
      className={`
        relative p-4 rounded-2xl border transition-all duration-300
        ${
          isActive
            ? 'bg-amber-950/40 border-amber-400/80 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/20'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
        }
      `}
    >
      {/* Top Info Bar */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] font-semibold">
            Turn {turn}
          </span>
          <span className="font-mono text-slate-400 text-[11px] truncate max-w-[120px]">
            {id}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-amber-400 font-bold">{totalBeads}</span>
          <span className="text-slate-500">beads</span>
        </div>
      </div>

      <div className="flex items-start gap-4">
        {/* Mini 3x3 Board Preview */}
        <div className="grid grid-cols-3 gap-1 w-20 h-20 p-1 bg-slate-950 rounded-lg border border-slate-800/80 shrink-0 select-none">
          {canonicalBoard.map((cell, idx) => {
            const beadCount = beads[idx] ?? 0;
            const posNumber = idx + 1;

            return (
              <div
                key={idx}
                className={`
                  relative flex items-center justify-center rounded text-[10px] font-bold font-mono leading-none overflow-hidden
                  ${
                    cell === 'X'
                      ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50'
                      : cell === 'O'
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                      : 'bg-slate-900/60 text-slate-600 border border-slate-800/40'
                  }
                `}
              >
                <span>{cell ?? posNumber}</span>
                {cell === null && beadCount > 0 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 shadow-sm pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Beads Distribution & Move Probabilities */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Available Move Beads:</span>
            <span className="text-[10px] text-slate-500">Pos (Qty)</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Object.entries(beads).map(([posStr, count]) => {
              const posIdx = Number(posStr);
              const posNumber = posIdx + 1; // 1 to 9
              const percentage = totalBeads > 0 ? Math.round((count / totalBeads) * 100) : 0;
              const colorClass = BEAD_COLORS[posIdx % BEAD_COLORS.length];

              return (
                <div
                  key={posIdx}
                  className={`
                    flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-mono shadow-sm
                    ${colorClass}
                    ${count === 0 ? 'opacity-40 grayscale' : ''}
                  `}
                  title={`Square #${posNumber}: ${count} beads (${percentage}%)`}
                >
                  <span className="font-bold">#{posNumber}:</span>
                  <span>{count}</span>
                  <span className="opacity-75 text-[9px]">({percentage}%)</span>
                </div>
              );
            })}
          </div>

          {/* Machine Stats for this box */}
          <div className="mt-2.5 pt-1.5 border-t border-slate-800/40 flex items-center gap-3 text-[10px] text-slate-400">
            <span>Plays: <strong className="text-slate-200">{stats.timesAccessed}</strong></span>
            <span className="text-emerald-400">W: {stats.wins}</span>
            <span className="text-slate-400">D: {stats.draws}</span>
            <span className="text-rose-400">L: {stats.losses}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
