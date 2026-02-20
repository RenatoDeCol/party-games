'use client';

import React from 'react';
import { useGame } from '@/hooks/useGame';
import { HigherLowerState } from '@/types/game';

const CARD_VALUES = [
    { label: 'A', val: 1 }, { label: '2', val: 2 }, { label: '3', val: 3 }, { label: '4', val: 4 }, { label: '5', val: 5 }, { label: '6', val: 6 },
    { label: '7', val: 7 }, { label: '8', val: 8 }, { label: '9', val: 9 }, { label: '10', val: 10 },
    { label: 'J', val: 11 }, { label: 'Q', val: 12 }, { label: 'K', val: 13 }
];

// Helper to get raw numerical value
const getCardValue = (cardCode: string) => {
    const valStr = cardCode.slice(0, -1);
    if (valStr === 'A') return 1;
    if (valStr === 'K') return 13;
    if (valStr === 'Q') return 12;
    if (valStr === 'J') return 11;
    return parseInt(valStr, 10);
};

export default function HigherLowerView() {
    const { room, me, emitAction } = useGame();
    const [showConsequenceModal, setShowConsequenceModal] = React.useState(false);

    if (!room || room.currentGame !== 'HIGHER_LOWER') return null;
    const gameState = room.gameState as HigherLowerState;

    React.useEffect(() => {
        if (gameState.lastConsequenceId) {
            setShowConsequenceModal(true);
        }
    }, [gameState.lastConsequenceId]);

    const isMyTurnToGuess = me?.id === gameState.guesserId;
    const isMyTurnToHold = me?.id === gameState.holderId;
    const guesserName = room.players[gameState.guesserId]?.name || 'Unknown';
    const holderName = gameState.holderId === 'SYSTEM' ? 'SYSTEM' : (room.players[gameState.holderId]?.name || 'Unknown');

    // Helper to render card
    const renderCard = (cardCode: string | null, isBack = false) => {
        if (!cardCode && !isBack) {
            return <div className="text-gray-500 font-bold text-xl h-full flex items-center justify-center">Empty</div>;
        }

        if (isBack) {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 text-white p-6 rounded-[28px] border-[4px] border-white/10 shadow-[inner_0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300">
                    <span className="text-9xl font-black text-white/30 drop-shadow-md">?</span>
                </div>
            );
        }

        if (!cardCode) return null;

        const suit = cardCode.slice(-1);
        const value = cardCode.slice(0, -1);
        const isRed = suit === 'H' || suit === 'D';
        const suitSymbol = suit === 'H' ? '♥' : suit === 'D' ? '♦' : suit === 'C' ? '♣' : '♠';

        return (
            <div className="flex flex-col justify-between h-full bg-white backdrop-blur-2xl text-black p-4 sm:p-6 rounded-[28px] border-[0.5px] border-white/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300">
                <div className={`text-3xl sm:text-4xl font-black tracking-tighter ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {value}<span className="ml-1">{suitSymbol}</span>
                </div>
                <div className={`text-7xl sm:text-9xl self-center transform transition-transform duration-500 hover:scale-110 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {suitSymbol}
                </div>
                <div className={`text-3xl sm:text-4xl font-black tracking-tighter self-end rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {value}<span className="ml-1">{suitSymbol}</span>
                </div>
            </div>
        );
    };

    const handleGuess = (val: number) => {
        if (isMyTurnToGuess) {
            emitAction('HL_GUESS', { guess: 'EXACT', number: val });
        }
    };

    const lastDiscard = gameState.discardPile?.[0];

    // Calculate remaining card distributions
    const discardCounts = React.useMemo(() => {
        const counts: Record<number, number> = {};
        CARD_VALUES.forEach(cv => counts[cv.val] = 0);

        gameState.discardPile.forEach(card => {
            const val = getCardValue(card);
            if (counts[val] !== undefined) {
                counts[val]++;
            }
        });
        return counts;
    }, [gameState.discardPile]);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-4 font-sans flex flex-col items-center pb-20 touch-manipulation relative overflow-x-hidden">
            {/* Background ambient glows */}
            <div className="absolute top-1/4 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-pink-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header Info */}
            <div className="w-full max-w-md pt-20 text-center space-y-4 relative z-10">
                {isMyTurnToGuess ? (
                    <h1 className="text-2xl sm:text-3xl font-black text-white px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl inline-block shadow-lg shadow-purple-500/30 animate-pulse">
                        Your Turn to Guess!
                    </h1>
                ) : (
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-300">
                        {guesserName} is guessing...
                    </h1>
                )}

                <div className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-3xl border border-gray-800 shadow-inner">
                    <div className="text-left">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Holder</p>
                        <p className="text-lg font-semibold text-[#0d9488]">{holderName}</p>
                    </div>
                    <div className="text-center px-4 py-1 bg-[#2a1a10] rounded-full border border-[#f49d25]/30">
                        <span className="text-[#f49d25] font-black text-sm uppercase tracking-wide">
                            Cards: {gameState.cardsRemaining}
                        </span>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex flex-col gap-2 items-center justify-center">
                    <div className="flex gap-2">
                        <div className="inline-block bg-[#1A0A0A] border border-red-500/50 rounded-full px-4 py-1 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                            <span className="text-red-400 font-bold text-sm">Attempt {gameState.attemptNumber}/2</span>
                        </div>
                        {gameState.lastGuessHint && gameState.attemptNumber === 2 && (
                            <div className="inline-block bg-blue-900/30 border border-blue-500/50 rounded-full px-4 py-1 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse">
                                <span className="text-blue-400 font-bold text-sm">
                                    ❌ Incorrect! The card is {gameState.lastGuessHint}!
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cards Stage */}
            <div className="flex gap-4 sm:gap-8 items-center justify-center my-6 sm:my-8 relative z-10 w-full max-w-2xl px-2">

                {/* Discard Pile (Previous Card) */}
                <div className="flex flex-col items-center">
                    <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-widest hidden sm:block">Last Card</p>
                    <div className="w-24 sm:w-32 h-[140px] sm:h-[180px] rounded-2xl opacity-70 scale-90 sm:scale-100 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                        {lastDiscard ? renderCard(lastDiscard, false) : renderCard(null, false)}
                    </div>
                </div>

                {/* Main Active Card */}
                <div className="flex flex-col items-center">
                    <p className="text-xs text-[#256af4] font-bold mb-2 uppercase tracking-widest hidden sm:block">Current</p>
                    <div className="w-40 sm:w-56 h-[240px] sm:h-[320px] rounded-[32px] p-1 transform transition-all duration-500 hover:scale-[1.02] shadow-[0_0_50px_rgba(255,255,255,0.05)] cursor-pointer">
                        {renderCard(gameState.currentCard, !gameState.currentCard && gameState.cardsRemaining > 0)}
                    </div>
                </div>

            </div>

            {/* Action Grid (Guesser Only) */}
            {isMyTurnToGuess ? (
                <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                    <p className="text-center text-sm text-gray-400 mb-3 font-medium uppercase tracking-widest">Select your guess</p>
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                        {CARD_VALUES.map((cv) => {
                            const discardedCount = discardCounts[cv.val];
                            const remainingCount = 4 - discardedCount;
                            let isExhausted = remainingCount === 0;

                            // Disable based on hints
                            if (gameState.lastGuessHint && gameState.lastGuess !== undefined && gameState.attemptNumber === 2) {
                                if (gameState.lastGuessHint === 'HIGHER' && cv.val <= gameState.lastGuess) {
                                    isExhausted = true;
                                }
                                if (gameState.lastGuessHint === 'LOWER' && cv.val >= gameState.lastGuess) {
                                    isExhausted = true;
                                }
                            }

                            return (
                                <button
                                    key={cv.val}
                                    onClick={() => handleGuess(cv.val)}
                                    disabled={isExhausted}
                                    className={`relative flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl border shadow-md transition-all active:scale-90 ${isExhausted ? 'bg-gray-900 border-gray-800 opacity-40 cursor-not-allowed text-gray-600' : 'bg-[#1A1A1A] hover:bg-[#256af4] text-white border-gray-800 hover:border-[#256af4]'}`}
                                >
                                    <span className="font-bold text-lg sm:text-xl">{cv.label}</span>
                                    {/* Tick marks for discarded cards */}
                                    <div className="flex gap-0.5 mt-1 h-1.5 px-2 w-full justify-center">
                                        {[...Array(discardedCount)].map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-md text-center py-8 text-gray-500 font-semibold relative z-10">
                    {isMyTurnToHold ? "You are the Holder. Watch them sweat!" : "Waiting for guess..."}
                </div>
            )}
            {/* Consequence Modal */}
            {showConsequenceModal && gameState.lastConsequence && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center transform scale-100 animate-zoom-in">
                        {gameState.lastConsequence === "HOLDER_DRINK_FULL" && (
                            <div className="space-y-4">
                                <div className="text-6xl animate-bounce">🍺</div>
                                <h3 className="text-2xl font-black text-green-400 uppercase tracking-wide">1st Try Win!</h3>
                                <p className="text-gray-300">Guess: <span className="text-white font-bold">{gameState.lastGuess}</span> | Card: <span className="text-white font-bold">{gameState.lastAnswer}</span></p>
                                <p className="text-gray-300">Holder drinks their <span className="font-bold text-white">FULL cup!</span></p>
                            </div>
                        )}
                        {gameState.lastConsequence === "HOLDER_DRINK_HALF" && (
                            <div className="space-y-4">
                                <div className="text-6xl">🍻</div>
                                <h3 className="text-2xl font-black text-green-400 uppercase tracking-wide">2nd Try Win!</h3>
                                <p className="text-gray-300">Guess: <span className="text-white font-bold">{gameState.lastGuess}</span> | Card: <span className="text-white font-bold">{gameState.lastAnswer}</span></p>
                                <p className="text-gray-300">Holder drinks <span className="font-bold text-white">HALF cup.</span></p>
                            </div>
                        )}
                        {gameState.lastConsequence === "TRY_AGAIN" && (
                            <div className="space-y-4">
                                <div className="text-6xl">🤔</div>
                                <h3 className="text-2xl font-black text-yellow-400 uppercase tracking-wide">Incorrect</h3>
                                <p className="text-gray-300">Guess: <span className="text-white font-bold">{gameState.lastGuess}</span> | Card: <span className="text-white font-bold">???</span></p>
                                <p className="text-gray-300">Try again using the Hint!</p>
                            </div>
                        )}
                        {gameState.lastConsequence.startsWith("GUESSER_SIP_") && (
                            <div className="space-y-4">
                                <div className="text-6xl animate-shake">💀</div>
                                <h3 className="text-2xl font-black text-red-500 uppercase tracking-wide">Ouch!</h3>
                                <p className="text-gray-300">Guess: <span className="text-white font-bold">{gameState.lastGuess}</span> | Card: <span className="text-white font-bold">{gameState.lastAnswer}</span></p>
                                <p className="text-gray-300">Guesser sips <span className="text-2xl font-black text-red-400 mx-1">{gameState.lastConsequence.split('_')[2]}</span> times!</p>
                            </div>
                        )}

                        <button
                            onClick={() => setShowConsequenceModal(false)}
                            className="mt-8 w-full py-4 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xl transition-all shadow-lg active:scale-95 border-b-4 border-gray-900 hover:border-blue-900"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
