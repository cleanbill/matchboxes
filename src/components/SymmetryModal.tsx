'use client';

import React from 'react';

interface SymmetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SymmetryModal: React.FC<SymmetryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-amber-400">
            About MENACE & Symmetry Reduction
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-mono px-2 py-1 bg-slate-800 rounded-lg"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            <strong>MENACE</strong> (<em>Matchbox Educable Noughts and Crosses Engine</em>) was built in <strong>1961</strong> by British computer scientist and AI pioneer <strong>Donald Michie</strong> using 304 matchboxes filled with colored beads.
          </p>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-semibold text-cyan-400 text-xs">How Symmetry Collapses 765 States into 304 Matchboxes:</h4>
            <p>
              In Tic-Tac-Toe, opening with a mark in any corner (e.g. top-left) is strategically identical to opening in any other corner.
            </p>
            <p>
              By applying <strong>8 spatial transformations</strong> (rotations by 90°, 180°, 270° and horizontal/vertical/diagonal reflections), identical board configurations are mapped into a single <em>canonical matchbox ID</em>.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-semibold text-amber-400 text-xs">Reinforcement Learning Rules:</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-emerald-400">Win (+3 beads):</strong> MENACE rewards every matchbox used in the winning game.</li>
              <li><strong className="text-slate-300">Draw (+1 bead):</strong> Small encouragement for preserving undefeated play.</li>
              <li><strong className="text-rose-400">Loss (-1 bead):</strong> Bad moves are eliminated over time.</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
