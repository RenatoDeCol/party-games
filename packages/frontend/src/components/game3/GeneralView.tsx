'use client';

import React, { useState, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import { useLanguage } from '@/providers/LanguageContext';
import { GeneralState } from '@/types/game';

export default function GeneralView() {
    const { room, me, emitAction, isHost } = useGame();
    const { t } = useLanguage();

    if (!room || room.currentGame !== 'GENERAL') return null;
    const gameState = room.gameState as GeneralState;

    const isMyTurn = me?.id === gameState.currentTurnId;
    const isThumbMaster = me?.isThumbMaster;
    const currentTurnName = room.players[gameState.currentTurnId]?.name || 'Unknown';

    // Mocking an event log for UI richness (in reality, driven by backend events)
    const [eventLog, setEventLog] = useState<{ id: number, text: string }[]>([
        { id: 1, text: 'Game Started!' },
    ]);

    const [activeTab, setActiveTab] = useState<'LOG' | 'EFFECTS'>('LOG');

    const [isRolling, setIsRolling] = useState(false);
    const [displayRoll, setDisplayRoll] = useState<number | null>(null);
    const [toastMsg, setToastMsg] = useState<{ id: number, message: string } | null>(null);

    useEffect(() => {
        if (isRolling) {
            const interval = setInterval(() => {
                setDisplayRoll(Math.floor(Math.random() * 6) + 1);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setDisplayRoll(gameState.lastRoll);
        }
    }, [isRolling, gameState.lastRoll]);

    useEffect(() => {
        if (gameState.lastRoll !== null && !isRolling && gameState.lastRollerId) {
            const rollerName = room.players[gameState.lastRollerId]?.name || 'Someone';
            const isMe = gameState.lastRollerId === me?.id;
            const subject = isMe ? 'You' : rollerName;

            setEventLog(prev => [{ id: Date.now(), text: `${rollerName} rolled a ${gameState.lastRoll}!` }, ...prev].slice(0, 5));

            const triggerToast = () => {
                let msg = '';
                switch (gameState.lastRoll) {
                    case 1: msg = `${subject} rolled a 1! General level reset. ${isMe ? 'Drink!' : 'They drink!'}`; break;
                    case 2: msg = `${subject} rolled a 2! ${isMe ? 'Pick someone to drink with you' : 'They pick someone to drink'}`; break;
                    case 3: msg = `${subject} rolled a 3! ${isMe ? 'Take a drink' : 'They take a drink'}`; break;
                    case 4: msg = `${subject} rolled a 4! ${subject} ${isMe ? 'are' : 'is'} the new Thumb Master!`; break;
                    case 5: msg = `${subject} rolled a 5! Mini-Game Time!`; break;
                    case 6: msg = `${subject} rolled a 6! General Level Up!`; break;
                }

                const toastId = Date.now();
                setToastMsg({ id: toastId, message: msg });

                setTimeout(() => {
                    setToastMsg(current => current?.id === toastId ? null : current);
                }, 5000);
            };

            const delayTimer = setTimeout(triggerToast, 1200); // Wait 1.2s to admire the dice result
            return () => clearTimeout(delayTimer);
        }
    }, [gameState.lastRoll, gameState.lastRollerId, isRolling, me?.id, room.players]);

    const handleRoll = () => {
        if (!isMyTurn || gameState.rollPending || isRolling) return;
        setIsRolling(true);
        setTimeout(() => {
            setIsRolling(false);
            emitAction('GENERAL_ROLL_DICE');
        }, 1200);
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
            <div className="w-full max-w-md mx-auto text-center px-6 mb-4 pt-10 flex-shrink-0 z-10 relative">
                {isMyTurn ? (
                    <h1 className="text-3xl font-black text-white px-6 py-2 bg-gradient-to-r from-[#0d7ff2] to-[#024f9d] rounded-3xl inline-block shadow-[0_0_20px_rgba(13,127,242,0.4)] animate-pulse">
                        {t('gen.yourTurn')}
                    </h1>
                ) : (
                    <h1 className="text-2xl font-bold text-gray-300">
                        {t('gen.isRolling', { name: currentTurnName })}
                    </h1>
                )}
            </div>

            {/* Turn Consequence Toast */}
            {toastMsg && (
                <div key={toastMsg.id} className="absolute top-36 inset-x-0 mx-auto w-11/12 max-w-sm z-50 pointer-events-none animate-in slide-in-from-top-10 fade-in duration-500">
                    <div className="bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-black px-6 py-4 rounded-3xl shadow-[0_15px_40px_rgba(244,63,94,0.4)] border border-white/20 text-center text-lg leading-tight backdrop-blur-md">
                        {toastMsg.message}
                    </div>
                </div>
            )}

            {/* Main Roll Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-sm mx-auto relative z-10">

                {gameState.ruleTieBreaker ? (
                    <div className="w-full bg-[#1A1A1A] p-6 rounded-[40px] border border-[#f43f5e]/50 shadow-2xl animate-in slide-in-from-bottom-10 space-y-4">
                        <h2 className="text-2xl font-black text-center text-[#f43f5e]">{t('gen.standoff')}</h2>
                        <p className="text-center text-gray-400 text-sm">{t('gen.tiedPower')}</p>

                        {/* Stage 1: Suggesting */}
                        {Object.keys(gameState.ruleTieBreaker.suggestions).length < gameState.ruleTieBreaker.tiedGenerals.length ? (
                            gameState.ruleTieBreaker.tiedGenerals.includes(me?.id as string) && !gameState.ruleTieBreaker.suggestions[me?.id as string] ? (
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="text"
                                        id="suggestInput"
                                        placeholder={t('gen.suggestRule')}
                                        className="px-4 py-3 rounded-xl bg-[#2a2a2a] border border-[#f43f5e]/30 text-white focus:outline-none focus:border-[#f43f5e]"
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('suggestInput') as HTMLInputElement;
                                            if (input && input.value.trim()) {
                                                emitAction('GENERAL_SUGGEST_RULE', { rule: input.value.trim() });
                                            }
                                        }}
                                        className="w-full bg-[#f43f5e] p-3 rounded-xl font-bold text-white hover:bg-[#e11d48] transition-colors"
                                    >
                                        {t('gen.submitSuggestion')}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center font-bold text-[#b0b0b0] animate-pulse">{t('gen.waitingSuggest')}</div>
                            )
                        ) : (
                            /* Stage 2: Voting */
                            !gameState.ruleTieBreaker.votes[me?.id as string] ? (
                                <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                                    <div className="text-center font-bold text-white mb-2">{t('gen.voteRule')}</div>
                                    {Object.entries(gameState.ruleTieBreaker.suggestions).map(([genId, rule]) => (
                                        <button
                                            key={genId}
                                            onClick={() => emitAction('GENERAL_VOTE_RULE', { targetId: genId })}
                                            className="w-full bg-[#2a2a2a] p-3 rounded-xl text-left border border-gray-700 hover:border-[#f43f5e] transition-colors"
                                        >
                                            <span className="font-bold text-[#f43f5e] block text-xs uppercase mb-1">{t('gen.sRule', { name: room.players[genId]?.name || 'Unknown' })}</span>
                                            <span className="text-sm font-medium text-white">{rule}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center font-bold text-[#b0b0b0] animate-pulse">{t('gen.waitingVote')}</div>
                            )
                        )}
                    </div>
                ) : gameState.lastRoll === 6 && gameState.rollPending ? (
                    <div className="w-full bg-[#1A1A1A] p-6 rounded-[40px] border border-[#0d7ff2]/50 shadow-2xl animate-in slide-in-from-bottom-10 space-y-4">
                        <h2 className="text-2xl font-black text-center text-[#0d7ff2]">{t('gen.levelUp')}</h2>
                        <p className="text-center text-gray-400">{t('gen.decreeRule')}</p>
                        {isMyTurn ? (
                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    id="ruleInput"
                                    placeholder={t('gen.rulePlaceholder')}
                                    className="px-4 py-3 rounded-xl bg-[#2a2a2a] border border-[#0d7ff2]/30 text-white focus:outline-none focus:border-[#0d7ff2]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value;
                                            if (val.trim()) {
                                                emitAction('GENERAL_MAKE_RULE', { rule: val.trim() });
                                            }
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('ruleInput') as HTMLInputElement;
                                        if (input && input.value.trim()) {
                                            emitAction('GENERAL_MAKE_RULE', { rule: input.value.trim() });
                                        }
                                    }}
                                    className="w-full bg-[#0d7ff2] p-3 rounded-xl font-bold text-white hover:bg-[#0b6bce] transition-colors"
                                >
                                    {t('gen.decreeSubmit')}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center font-bold text-[#b0b0b0] animate-pulse">{t('gen.waitingFor', { name: currentTurnName })}</div>
                        )}
                    </div>
                ) : gameState.lastRoll === 5 && gameState.rollPending ? (
                    <div className="w-full bg-[#1A1A1A] p-6 rounded-[40px] border border-[#22c55e]/50 shadow-2xl animate-in slide-in-from-bottom-10 space-y-4">
                        <h2 className="text-2xl font-black text-center text-[#22c55e]">{t('gen.minigame')}</h2>
                        <p className="text-center text-gray-400">{t('gen.minigameDesc')}</p>
                        {isHost ? (
                            <button
                                onClick={() => emitAction('GENERAL_GAME_END')}
                                className="w-full bg-[#2a2a2a] p-4 rounded-2xl font-bold text-white hover:bg-[#3a3a3a] active:bg-[#22c55e] transition-colors"
                            >
                                {t('gen.proceed')}
                            </button>
                        ) : (
                            <div className="text-center font-bold text-[#b0b0b0] animate-pulse">{t('gen.waitingHost')}</div>
                        )}
                    </div>
                ) : gameState.lastRoll === 2 && gameState.rollPending && isMyTurn ? (
                    <div className="w-full bg-[#1A1A1A] p-6 rounded-[40px] border border-[#f49d25]/50 shadow-2xl animate-in slide-in-from-bottom-10 space-y-4">
                        <h2 className="text-2xl font-black text-center text-[#f49d25]">{t('gen.chooseTarget')}</h2>
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
                        disabled={!isMyTurn || gameState.rollPending || isRolling}
                        className={`
                  relative group
                  w-64 h-64 rounded-full flex flex-col items-center justify-center
                  transition-all duration-300 transform active:scale-95
                  ${isMyTurn && !gameState.rollPending ? 'bg-gradient-to-br from-[#0d7ff2] to-[#052b59] shadow-[0_0_60px_rgba(13,127,242,0.4)] hover:shadow-[0_0_80px_rgba(13,127,242,0.6)] cursor-pointer' : 'bg-[#1A1A1A] border border-gray-800 opacity-50 cursor-not-allowed'}
               `}
                    >
                        {/* Internal glowing ring */}
                        <div className="absolute inset-2 rounded-full border-2 border-white/20 group-active:border-white/50 transition-colors"></div>

                        {displayRoll !== null ? (
                            <div key={isRolling ? `rolling-${displayRoll}` : `roll-${displayRoll}-${Date.now()}`} className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-in zoom-in-50 spin-in-12 duration-500">
                                {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][displayRoll - 1]}
                            </div>
                        ) : (
                            <span className="text-2xl font-black tracking-widest text-white/90">{t('gen.roll')}</span>
                        )}
                        {gameState.rollPending && !isMyTurn && <div className="mt-4 text-sm font-bold text-amber-500 animate-pulse">{t('gen.actionPending')}</div>}
                    </button>
                )}

            </div>

            {/* Activity Log & Effects Tabs */}
            <div className="w-full max-w-md mx-auto px-6 flex-shrink-0 z-10">
                <div className="flex justify-center gap-6 mb-3">
                    <button
                        onClick={() => setActiveTab('LOG')}
                        className={`text-xs font-bold uppercase tracking-widest pb-1 transition-colors ${activeTab === 'LOG' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {t('gen.gameLog')}
                    </button>
                    <button
                        onClick={() => setActiveTab('EFFECTS')}
                        className={`text-xs font-bold uppercase tracking-widest pb-1 transition-colors ${activeTab === 'EFFECTS' ? 'text-[#0d7ff2] border-b-2 border-[#0d7ff2]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {t('gen.activeEffects')}
                    </button>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-5 h-56 overflow-y-auto flex flex-col gap-3">
                    {activeTab === 'LOG' ? (
                        <div className="flex flex-col gap-2">
                            {eventLog.map((log, i) => (
                                <div key={log.id} className={`text-sm ${i === 0 ? 'text-white font-bold' : 'text-gray-400'}`}>
                                    {log.text}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {/* Rankings */}
                            <div>
                                <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{t('gen.rankings')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {room.playerOrder.map(pid => (
                                        <div key={pid} className={`bg-[#1A1A1A] border ${pid === me?.id ? 'border-[#0d7ff2]' : 'border-gray-700'} px-3 py-1.5 rounded-lg shadow-md`}>
                                            <span className={`${pid === me?.id ? 'text-[#0d7ff2]' : 'text-gray-300'} font-bold text-xs uppercase`}>
                                                {room.players[pid].name}: {t('gen.level')} {room.players[pid].generalLevel || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pending Thumb Master */}
                            <div>
                                <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{t('gen.thumbMasters')}</h4>
                                {room.playerOrder.filter(pid => room.players[pid].isThumbMaster).length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {room.playerOrder.filter(pid => room.players[pid].isThumbMaster).map(pid => (
                                            <span key={pid} className="text-xs font-bold bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-2">
                                                <span>👍</span> {room.players[pid].name} {t('gen.pending')}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-600 italic">{t('gen.noThumb')}</span>
                                )}
                            </div>

                            {/* Decrees */}
                            {gameState.activeRule && (
                                <div>
                                    <h4 className="text-[10px] text-[#0d7ff2] uppercase tracking-widest mb-2">{t('gen.activeDecree')}</h4>
                                    <div className="text-sm text-white font-medium flex items-start gap-3 bg-[#0d7ff2]/10 p-3 rounded-lg border border-[#0d7ff2]/20">
                                        <span className="text-[#0d7ff2] font-black">👑</span>
                                        <span className="text-sm leading-tight text-blue-50">{gameState.activeRule}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
                    <span className="text-6xl drop-shadow-xl animate-bounce text-white font-black text-center leading-none whitespace-pre-wrap">{t('gen.clickFast')}</span>
                </button>
            )}

        </div>
    );
}
