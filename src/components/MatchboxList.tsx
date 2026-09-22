'use client';

import React, { useState, useMemo } from 'react';
import { Matchbox } from '../lib/menace/types';
import { MatchboxCard } from './MatchboxCard';

interface MatchboxListProps {
  matchboxes: Record<string, Matchbox>;
  activeMatchboxId: string | null;
}

export const MatchboxList: React.FC<MatchboxListProps> = ({
  matchboxes,
  activeMatchboxId,
}) => {
  const [search, setSearch] = useState('');
  const [turnFilter, setTurnFilter] = useState<number | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'ACTIVE' | 'ACCESSED' | 'BEADS' | 'TURN'>('ACTIVE');

  const matchboxArray = useMemo(() => Object.values(matchboxes), [matchboxes]);

  const filteredAndSorted = useMemo(() => {
    return matchboxArray
      .filter((mb) => {
        // Filter by Turn
        if (turnFilter !== 'ALL' && mb.turn !== turnFilter) return false;
        // Filter by Search Query
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchesId = mb.id.toLowerCase().includes(q);
          const matchesTurn = `turn ${mb.turn}`.includes(q);
          return matchesId || matchesTurn;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'ACTIVE' && a.id === activeMatchboxId) return -1;
        if (sortBy === 'ACTIVE' && b.id === activeMatchboxId) return 1;
        if (sortBy === 'ACCESSED') return b.stats.timesAccessed - a.stats.timesAccessed;
        if (sortBy === 'BEADS') return b.totalBeads - a.totalBeads;
        return a.turn - b.turn;
      });
  }, [matchboxArray, search, turnFilter, sortBy, activeMatchboxId]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl shadow-cyan-950/20 overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <h2 className="text-base font-bold text-slate-200 tracking-wide">
              Matchbox Drawer ({matchboxArray.length})
            </h2>
          </div>
          <div className="min-h-[26px] flex items-center">
            {activeMatchboxId && (
              <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 animate-pulse">
                Active Box Found
              </span>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search board state (e.g. O...X...)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all font-mono"
        />

        {/* Filters and Sort */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {(['ALL', 2, 4, 6, 8] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTurnFilter(t === 2 ? 2 : t === 4 ? 4 : t === 6 ? 6 : t === 8 ? 8 : 'ALL')}
                className={`
                  px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap transition-colors border
                  ${
                    turnFilter === t
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                      : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200'
                  }
                `}
              >
                {t === 'ALL' ? 'All Turns' : `Turn ${t - 1}`}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'ACTIVE' | 'ACCESSED' | 'BEADS' | 'TURN')}
            className="px-2 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500/60"
          >
            <option value="ACTIVE">Active First</option>
            <option value="ACCESSED">Most Played</option>
            <option value="BEADS">Highest Beads</option>
            <option value="TURN">Turn Order</option>
          </select>
        </div>
      </div>

      {/* Matchbox Cards List */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map((mb) => (
            <MatchboxCard
              key={mb.id}
              matchbox={mb}
              isActive={mb.id === activeMatchboxId}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 text-xs font-mono">
            <p>No matchboxes found matching search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
