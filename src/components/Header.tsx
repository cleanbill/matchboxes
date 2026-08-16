'use client';

import React, { useState } from 'react';
import { SymmetryModal } from './SymmetryModal';

export const Header: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
              📦
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                MENACE <span className="text-amber-400 font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">1961 ML Simulation</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Donald Michie&apos;s Matchbox Educable Noughts and Crosses Engine
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <span>💡 How MENACE Works</span>
          </button>
        </div>
      </header>

      <SymmetryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
