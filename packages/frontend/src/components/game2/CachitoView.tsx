'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import { CachitoState } from '@/types/game';

export default function CachitoView() {
    const { room, me, emitAction } = useGame();
    const [isRevealed, setIsRevealed] = useState(false);
    const [localBidQuantity, setLocalBidQuantity] = useState(1);
    const [localBidFace, setLocalBidFace] = useState(2);
    const [isBidding, setIsBidding] = useState(false);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);

    if (!room || room.currentGame !== 'CACHITO') return null;
    const gameState = room.gameState as CachitoState;

    const isMyTurn = me?.id === gameState.currentTurnId;
    const currentTurnName = room.players[gameState.currentTurnId]?.name || 'Unknown';
    const myDice = me?.dice || [];

    const getMinQuantity = (newF: number) => {
        if (!gameState.currentBid) return 1;
        const { quantity: curQ, faceValue: curF } = gameState.currentBid;
        const curA = curF === 1;
        const newA = newF === 1;

        if (gameState.isObligado) {
            return curQ + 1; // Can only increase quantity
        }

        if (newA && !curA) return Math.ceil(curQ / 2);
        if (!newA && curA) return (curQ * 2) + 1;
        if (newA && curA) return curQ + 1;
        if (!newA && !curA) {
            if (newF > curF) return curQ;
            return curQ + 1;
        }
        return 1;
    };

    // Initialize local bid state based on current bid
    useEffect(() => {
        if (gameState.currentBid) {
            const nextFace = gameState.currentBid.faceValue;
            setLocalBidFace(nextFace);
            const minQ = getMinQuantity(nextFace);
            if (localBidQuantity < minQ || localBidQuantity > minQ + 5) {
                // snap to minimum to prevent invalid bids
                setLocalBidQuantity(minQ);
            }
        }
    }, [gameState.currentBid, gameState.isObligado]);

    const handleFaceChange = (delta: number) => {
        if (gameState.isObligado) return; // Cannot change face in obligado

        let newFace = localBidFace + delta;
        if (newFace < 1) newFace = 6;
        if (newFace > 6) newFace = 1;

        setLocalBidFace(newFace);
        const minQ = getMinQuantity(newFace);
        if (localBidQuantity < minQ) {
            setLocalBidQuantity(minQ);
        }
    };

    const handlePointerDown = () => {
        // Basic long press to prevent accidental flashes
        pressTimer.current = setTimeout(() => {
            setIsRevealed(true);
        }, 150);
    };

    const handlePointerUp = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        setIsRevealed(false);
    };

    const renderDice = (value: number, index: number) => {
        // Simple unicode dice for now, can be replaced with SVG
        const diceChars = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return (
            <div key={index} className="w-16 h-16 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center text-5xl shadow-lg">
                {diceChars[value - 1]}
            </div>
        );
    };

    const handleBid = () => {
        if (!isMyTurn) return;
        emitAction('CACHITO_BID', {
            quantity: localBidQuantity,
            faceValue: localBidFace,
            isAces: localBidFace === 1
        });
        setIsBidding(false);
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 font-sans flex flex-col justify-between pb-12 touch-manipulation select-none">

            {/* Top 50%: Public Bidding Area */}
            <div className="flex-1 flex flex-col pt-8 max-w-md mx-auto w-full">
                <div className="text-center mb-6">
                    {isMyTurn ? (
                        <h1 className="text-3xl font-black text-white px-6 py-2 bg-gradient-to-r from-[#930df2] to-[#dc2626] rounded-3xl inline-block shadow-lg shadow-[#930df2]/30 animate-pulse">
                            Your Turn!
                        </h1>
                    ) : (
                        <h1 className="text-2xl font-bold text-gray-300">
                            {currentTurnName}'s Turn
                        </h1>
                    )}
                </div>

                {/* Current Bid Display */}
                <div className="bg-[#141414] border border-[#930df2]/50 p-6 rounded-3xl shadow-[0_0_30px_rgba(147,13,242,0.15)] mb-6 text-center">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Current Highest Bid</p>
                    {gameState.currentBid ? (
                        <div className="text-5xl font-black text-white flex items-center justify-center gap-4">
                            <span>{gameState.currentBid.quantity}x</span>
                            <span className="text-[#f59e0b]">
                                {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][gameState.currentBid.faceValue - 1]}
                            </span>
                        </div>
                    ) : (
                        <div className="text-3xl font-bold text-gray-500 italic">No bids yet</div>
                    )}
                    {gameState.isObligado && <p className="text-red-500 font-bold mt-2 animate-bounce">OBLIGADO!</p>}
                </div>

                {/* Action Controls */}
                <div className="bg-[#1A1A1A] p-4 rounded-3xl border border-gray-800 space-y-4">
                    <button
                        disabled={!isMyTurn}
                        onClick={() => setIsBidding(true)}
                        className="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:brightness-110 disabled:opacity-40 disabled:grayscale text-white text-xl font-bold shadow-[0_5px_20px_rgba(139,92,246,0.4)] transition-all active:scale-[0.98]"
                    >
                        Raise Bid
                    </button>
                    <div className="flex gap-4">
                        <button
                            disabled={!isMyTurn || !gameState.currentBid}
                            onClick={() => emitAction('CACHITO_DOUBT')}
                            className="flex-1 min-h-[56px] rounded-2xl bg-gradient-to-r from-[#ef4444] to-[#b91c1c] hover:brightness-110 disabled:opacity-40 disabled:grayscale text-white text-xl font-bold shadow-[0_5px_20px_rgba(239,68,68,0.4)] transition-all active:scale-[0.98]"
                        >
                            Doubt (Dudo)
                        </button>
                        <button
                            disabled={!isMyTurn || !gameState.currentBid}
                            onClick={() => emitAction('CACHITO_MATCH')}
                            className="flex-1 min-h-[56px] rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:brightness-110 disabled:opacity-40 disabled:grayscale text-white text-xl font-bold shadow-[0_5px_20px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98]"
                        >
                            Match (Calzo)
                        </button>
                    </div>
                </div>
            </div>

            {/* Bidding Drawer Modal */}
            {isBidding && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-md bg-[#121212] rounded-t-[40px] border-t border-gray-700 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-[100%] duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white">Raise Bid</h2>
                            <button onClick={() => setIsBidding(false)} className="text-gray-400 p-2 rounded-full hover:bg-gray-800">✕</button>
                        </div>

                        <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-gray-800 mb-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 font-bold uppercase text-sm tracking-widest">Quantity</span>
                                <div className="flex items-center gap-4 bg-[#0A0A0A] p-2 rounded-2xl border border-gray-800">
                                    <button
                                        onClick={() => setLocalBidQuantity(Math.max(getMinQuantity(localBidFace), localBidQuantity - 1))}
                                        className="w-12 h-12 bg-gray-800 rounded-xl text-2xl font-bold hover:bg-gray-700 active:bg-gray-600 disabled:opacity-30 transition-opacity"
                                        disabled={localBidQuantity <= getMinQuantity(localBidFace)}
                                    >-</button>
                                    <span className="text-3xl font-black w-12 text-center">{localBidQuantity}</span>
                                    <button onClick={() => setLocalBidQuantity(localBidQuantity + 1)} className="w-12 h-12 bg-gray-800 rounded-xl text-2xl font-bold hover:bg-gray-700 active:bg-gray-600">+</button>
                                </div>
                            </div>

                            <hr className="border-gray-800" />

                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 font-bold uppercase text-sm tracking-widest">Face Value</span>
                                <div className="flex items-center gap-4 bg-[#0A0A0A] p-2 rounded-2xl border border-gray-800">
                                    <button
                                        onClick={() => handleFaceChange(-1)}
                                        className="w-12 h-12 bg-gray-800 rounded-xl text-2xl font-bold hover:bg-gray-700 active:bg-gray-600 disabled:opacity-30 transition-opacity"
                                        disabled={gameState.isObligado}
                                    >-</button>
                                    <span className="text-4xl text-[#f59e0b] w-12 text-center drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">{['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][localBidFace - 1]}</span>
                                    <button
                                        onClick={() => handleFaceChange(1)}
                                        className="w-12 h-12 bg-gray-800 rounded-xl text-2xl font-bold hover:bg-gray-700 active:bg-gray-600 disabled:opacity-30 transition-opacity"
                                        disabled={gameState.isObligado}
                                    >+</button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleBid}
                            className="w-full min-h-[64px] rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white text-2xl font-black shadow-[0_10px_30px_rgba(139,92,246,0.5)] transition-all active:scale-[0.96] active:translate-y-2 border-b-4 border-b-[#4c1d95] uppercase tracking-wide"
                        >
                            Confirm Bid
                        </button>
                    </div>
                </div>
            )}

            {/* Resolving Modal */}
            {gameState.status === 'RESOLVING' && gameState.revealData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in p-6">
                    <div className="w-full max-w-md bg-[#121212] rounded-[40px] border border-gray-700 p-8 shadow-[0_20px_50px_rgba(147,13,242,0.3)] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <h2 className="text-3xl font-black text-white mb-4">Round Over!</h2>

                        <div className="w-24 h-24 bg-gradient-to-tr from-[#930df2] to-[#dc2626] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#930df2]/30">
                            <span className="text-5xl font-black text-white">{gameState.revealData.totalFound}</span>
                        </div>

                        <p className="text-xl text-gray-300 font-bold mb-8">
                            {gameState.revealData.reason}
                        </p>

                        <button
                            onClick={() => emitAction('CACHITO_NEXT_ROUND')}
                            className="w-full min-h-[64px] rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:brightness-110 text-white text-2xl font-black shadow-[0_10px_30px_rgba(34,197,94,0.4)] transition-all active:scale-[0.96] border-b-4 border-b-[#15803d] uppercase tracking-wide"
                        >
                            Next Round
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom 50%: Secret View (Hold to Reveal) */}
            <div className="flex-1 flex flex-col justify-end max-w-md mx-auto w-full mt-8 relative z-10">
                <div
                    className={`relative w-full aspect-[4/3] rounded-[48px] transition-all duration-300 overflow-hidden flex items-center justify-center cursor-pointer ${isRevealed
                        ? 'bg-[#1a1a2e] border-2 border-[#930df2] shadow-[inset_0_0_30px_rgba(147,13,242,0.2),_0_0_50px_rgba(147,13,242,0.4)]'
                        : 'bg-gradient-to-b from-[#2a2a35] to-[#0f0f15] border-t-2 border-white/20 shadow-[inset_0_-20px_40px_rgba(0,0,0,0.8),_0_20px_50px_rgba(0,0,0,0.5)] hover:brightness-110'
                        }`}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onContextMenu={(e) => e.preventDefault()} // prevent long press menu on mobile
                >
                    {!isRevealed ? (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                            <span className="text-6xl mb-4 opacity-50">🔒</span>
                            <p className="font-bold text-xl tracking-wide">PRESS & HOLD TO PEEK</p>
                            <p className="text-sm mt-2 opacity-60">Keep hidden from other players</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-4 p-8 animate-in fade-in duration-200">
                            {myDice.map((val, idx) => renderDice(val, idx))}
                            {myDice.length === 0 && <p className="text-xl font-bold text-red-400">You have no dice left!</p>}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
