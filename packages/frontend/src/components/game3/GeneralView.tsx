'use client';

import React, { useState, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import { GeneralState } from '@/types/game';

export default function GeneralView() {
    const { room, me, emitAction, isHost } = useGame();

    if (!room || room.currentGame !== 'GENERAL') return null;
    const gameState = room.gameState as GeneralState;

    const isMyTurn = me?.id === gameState.currentTurnId;
    const isThumbMaster = me?.isThumbMaster;
    const currentTurnName = room.players[gameState.currentTurnId]?.name || 'Unknown';

    // Mocking an event log for UI richness (in reality, driven by backend events)
    const [eventLog, setEventLog] = useState<{ id: number, text: string }[]>([
        { id: 1, text: 'Game Started!' },
    ]);

    useEffect(() => {
        if (gameState.lastRoll !== null) {
            setEventLog(prev => [{ id: Date.now(), text: `${currentTurnName} rolled a ${gameState.lastRoll}!` }, ...prev].slice(0, 5));
        }
    }, [gameState.lastRoll, currentTurnName]);

    const handleRoll = () => {
        if (!isMyTurn || gameState.rollPending) return;
        emitAction('GENERAL_ROLL_DICE');
    };

    const handeThumbClick = () => {
        if (isThumbMaster) {
            emitAction('GENERAL_USE_THUMB');
        }
    };

    const handleChoosePlayer = (playerId: string) => {
        if (!isMyTurn || !gameState.rollPending || gameState.lastRoll !== 2) return;
        emitAction('GENERAL_CHOOSE_PLAYER', { targetId: playerId });
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans touch-manipulation relative overflow-hidden flex flex-col pt-8 pb-20">
            {/* Background ambient glows */}
            <div className="absolute top-1/4 left-0 w-64 h-64 bg-[#0d7ff2]/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header Info */}
            <div className="w-full max-w-md mx-auto text-center px-6 mb-8 pt-16 flex-shrink-0 z-10 relative">
                {isMyTurn ? (
                    <h1 className="text-3xl font-black text-white px-6 py-2 bg-gradient-to-r from-[#0d7ff2] to-[#024f9d] rounded-3xl inline-block shadow-[0_0_20px_rgba(13,127,242,0.4)] animate-pulse">
                        Your Turn to Roll!
                    </h1>
                ) : (
                    <h1 className="text-2xl font-bold text-gray-300">
                        {currentTurnName} is rolling...
                    </h1>
                )}

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {room.playerOrder.map(pid => (
                        <div key={pid} className={`bg-[#1A1A1A] border ${pid === me?.id ? 'border-[#0d7ff2]' : 'border-gray-700'} px-3 py-1 rounded-full`}>
                            <span className={`${pid === me?.id ? 'text-[#0d7ff2]' : 'text-gray-400'} font-bold tracking-wider text-xs uppercase`}>
                                {room.players[pid].name}: {room.players[pid].generalLevel || 0}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Roll Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-sm mx-auto relative z-10">

                {gameState.lastRoll === 5 && gameState.rollPending ? (
                    <div className="w-full bg-[#1A1A1A] p-6 rounded-[40px] border border-[#22c55e]/50 shadow-2xl animate-in slide-in-from-bottom-10 space-y-4">
                        <h2 className="text-2xl font-black text-center text-[#22c55e]">Mini-Game Time!</h2>
                        <p className="text-center text-gray-400">Put down the phones. The Host will allow the game to proceed once real-world rules are met.</p>
                        {isHost ? (
                            <button
                                onClick={() => emitAction('GENERAL_GAME_END')}
                                className="w-full bg-[#2a2a2a] p-4 rounded-2xl font-bold text-white hover:bg-[#3a3a3a] active:bg-[#22c55e] transition-colors"
                            >
                                Wait over. Proceed Next Turn.
                            </button>
                        ) : (
                            <div className="text-center font-bold text-[#b0b0b0] animate-pulse">Waiting for host...</div>
                        )}
                    </div>
                ) : gameState.lastRoll === 2 && gameState.rollPending && isMyTurn ? (
                    <div className="w-full bg-[#1A1A1A] p-6 rounded-[40px] border border-[#f49d25]/50 shadow-2xl animate-in slide-in-from-bottom-10 space-y-4">
                        <h2 className="text-2xl font-black text-center text-[#f49d25]">Choose a target!</h2>
                        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                            {room.playerOrder.filter(id => id !== me?.id).map(id => (
                                <button
                                    key={id}
                                    onClick={() => handleChoosePlayer(id)}
                                    className="bg-[#2a2a2a] p-3 rounded-2xl font-bold text-white hover:bg-[#3a3a3a] active:bg-[#f49d25] transition-colors"
                                >
                                    {room.players[id].name}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleRoll}
                        disabled={!isMyTurn || gameState.rollPending}
                        className={`
                  relative group
                  w-64 h-64 rounded-full flex flex-col items-center justify-center
                  transition-all duration-300 transform active:scale-95
                  ${isMyTurn && !gameState.rollPending ? 'bg-gradient-to-br from-[#0d7ff2] to-[#052b59] shadow-[0_0_60px_rgba(13,127,242,0.4)] hover:shadow-[0_0_80px_rgba(13,127,242,0.6)] cursor-pointer' : 'bg-[#1A1A1A] border border-gray-800 opacity-50 cursor-not-allowed'}
               `}
                    >
                        {/* Internal glowing ring */}
                        <div className="absolute inset-2 rounded-full border-2 border-white/20 group-active:border-white/50 transition-colors"></div>

                        {gameState.lastRoll !== null ? (
                            <div key={`roll-${gameState.lastRoll}-${Date.now()}`} className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-in zoom-in-50 spin-in-12 duration-500">
                                {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][gameState.lastRoll - 1]}
                            </div>
                        ) : (
                            <span className="text-2xl font-black tracking-widest text-white/90">ROLL</span>
                        )}
                        {gameState.rollPending && !isMyTurn && <div className="mt-4 text-sm font-bold text-amber-500 animate-pulse">Action Pending</div>}
                    </button>
                )}

            </div>

            {/* Activity Log (Glassmorphism) */}
            <div className="w-full max-w-md mx-auto px-6 flex-shrink-0 z-10">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-4 mb-2">Game Log</h3>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-4 h-32 overflow-hidden flex flex-col gap-2">
                    {eventLog.map((log, i) => (
                        <div key={log.id} className={`text-sm ${i === 0 ? 'text-white font-bold' : 'text-gray-400'}`}>
                            {log.text}
                        </div>
                    ))}
                </div>
            </div>

            {/* THE THUMB BUTTON - CRITICAL COMPONENT */}
            {isThumbMaster && !gameState.activeThumbRace && (
                <button
                    onClick={handeThumbClick}
                    className="fixed bottom-8 right-8 w-28 h-28 bg-gradient-to-tr from-[#fbbf24] via-[#f59e0b] to-[#ea580c] rounded-full shadow-[0_0_60px_rgba(245,158,11,1)] flex items-center justify-center z-[100] hover:scale-110 active:scale-90 transition-transform border-4 border-white/50"
                    style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                >
                    <div className="absolute inset-1 border-[3px] border-white/60 rounded-full"></div>
                    <span className="text-5xl drop-shadow-xl animate-bounce">👍</span>
                </button>
            )}

            {/* NEW THUMB RACE BUTTON */}
            {gameState.activeThumbRace && !gameState.thumbRaceParticipants?.includes(me?.id as string) && (
                <button
                    onClick={() => emitAction('GENERAL_THUMB_RACE_CLICK')}
                    className="fixed inset-0 m-auto w-48 h-48 bg-gradient-to-tr from-[#ef4444] via-[#f43f5e] to-[#dc2626] rounded-full shadow-[0_0_60px_rgba(239,68,68,1)] flex items-center justify-center z-[100] hover:scale-110 active:scale-90 transition-transform border-8 border-white"
                    style={{ animation: 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                >
                    <div className="absolute inset-2 border-[4px] border-white/60 rounded-full"></div>
                    <span className="text-6xl drop-shadow-xl animate-bounce text-white font-black text-center leading-none">CLICK<br />FAST!</span>
                </button>
            )}

        </div>
    );
}
