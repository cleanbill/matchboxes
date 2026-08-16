'use client';

import React from 'react';
import { useMenace } from '../lib/hooks/useMenace';
import { Header } from '../components/Header';
import { GameBoard } from '../components/GameBoard';
import { MatchboxList } from '../components/MatchboxList';
import { TrainingPanel } from '../components/TrainingPanel';
import { AnalyticsPanel } from '../components/AnalyticsPanel';

export default function Home() {
  const {
    menacePlayer,
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
  } = useMenace();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Top Control Panel */}
        <TrainingPanel
          gameMode={gameMode}
          onSetGameMode={setGameMode}
          isAutoTraining={isAutoTraining}
          trainingProgress={trainingProgress}
          onStartAutoTrain={runAutoTrain}
          onStopAutoTrain={stopAutoTrain}
          onResetMatchboxes={resetMatchboxes}
        />

        {/* Main Workspace Grid: Board on Left, Matchboxes on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-[580px]">
          {/* Main Playing Area (Left / Center Stage) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <GameBoard
              board={board}
              currentPlayer={currentPlayer}
              menacePlayer={menacePlayer}
              gameResult={gameResult}
              winningLine={winningLine}
              activeMatchboxId={activeMatchboxId}
              onCellClick={(idx) => makeMove(idx, currentPlayer)}
              onReset={resetGame}
              disabled={isAutoTraining}
            />
          </div>

          {/* Matchbox Drawer & Inspector (Right Panel) */}
          <div className="lg:col-span-7 h-[580px]">
            <MatchboxList
              matchboxes={matchboxes}
              activeMatchboxId={activeMatchboxId}
            />
          </div>
        </div>

        {/* Analytics & Reinforcement Convergence Section */}
        <AnalyticsPanel stats={stats} />
      </main>

      <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-mono">
        MENACE Matchbox Machine Learning Engine &bull; Donald Michie 1961 Simulation &bull; Next.js & React
      </footer>
    </div>
  );
}
