'use client';

import React from 'react';
import { useGame } from '@/hooks/useGame';
import { useLanguage } from '@/providers/LanguageContext';
import { GameType } from '@/types/game';

const gameOptions: { type: GameType; titleKey: string; color: string; icon: string }[] = [
    { type: 'HIGHER_LOWER', titleKey: 'rules.higherLower', color: 'from-[#0d9488] to-[#0284c7]', icon: '?' },
    { type: 'CACHITO', titleKey: 'rules.cachito', color: 'from-[#dc2626] to-[#f59e0b]', icon: '⚄' },
    { type: 'GENERAL', titleKey: 'rules.general', color: 'from-[#7e22ce] to-[#db2777]', icon: '★' },
];

export default function RoomWaitingView() {
    const { room, me, startGame, emitAction } = useGame();
    const { t } = useLanguage();
    const [isSinglePlayer, setIsSinglePlayer] = React.useState(false);

    if (!room) return null;

    const isHost = me?.id === room.hostId;

    const movePlayer = (index: number, direction: 'up' | 'down') => {
        if (!isHost) return;
        const newOrder = [...room.playerOrder];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newOrder.length) return;

        [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
        emitAction('REORDER_PLAYERS', { playerOrder: newOrder });
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 font-sans pb-24 touch-manipulation flex flex-col items-center">
            {/* Header info */}
            <div className="w-full max-w-md text-center pt-8 mb-8">
                <h1 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500 mb-2">{t('room.code')}</h1>
                <p className="text-6xl font-black tracking-widest text-[#256af4] font-mono drop-shadow-[0_0_20px_rgba(37,106,244,0.3)]">
                    {room.id}
                </p>
                <p className="mt-4 text-gray-400">
                    {t('room.playersJoined', { count: room.playerOrder.length })}
                </p>
            </div>

            {/* Players List */}
            <div className="w-full max-w-md bg-[#141414] rounded-3xl border border-gray-800/50 p-6 mb-8 shadow-xl">
                <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">{t('room.turnOrder')}</h2>
                <div className="space-y-3">
                    {room.playerOrder.map((pid, idx) => {
                        const player = room.players[pid];
                        if (!player) return null;
                        const isMe = pid === me?.id;
                        const isHostOfRoom = pid === room.hostId;

                        return (
                            <div
                                key={pid}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isMe ? 'bg-[#256af4]/10 border-[#256af4]/30' : 'bg-[#0A0A0A] border-gray-800'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isMe ? 'bg-[#256af4] text-white' : 'bg-gray-800 text-gray-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className={`font-bold ${isMe ? 'text-white' : 'text-gray-200'}`}>
                                            {player.name} {isMe && "(You)"}
                                        </p>
                                        {isHostOfRoom && <p className="text-[10px] uppercase tracking-tighter text-[#fbbf24] font-black">{t('room.roomHost')}</p>}
                                    </div>
                                </div>

                                {isHost && room.playerOrder.length > 1 && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => movePlayer(idx, 'up')}
                                            disabled={idx === 0}
                                            className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-20"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => movePlayer(idx, 'down')}
                                            disabled={idx === room.playerOrder.length - 1}
                                            className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-20"
                                        >
                                            ↓
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Host Controls */}
            {isHost ? (
                <div className="w-full max-w-md space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-center px-4">
                        <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t('room.singlePlayerTools')}</span>
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isSinglePlayer}
                                    onChange={(e) => setIsSinglePlayer(e.target.checked)}
                                />
                                <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${isSinglePlayer ? 'bg-[#256af4]' : 'bg-[#1A1A1A] border border-gray-700'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ${isSinglePlayer ? 'transform translate-x-5' : ''}`}></div>
                            </div>
                            <span className="text-gray-400 group-hover:text-white transition-colors text-sm font-medium">{t('room.soloMode')}</span>
                        </label>
                    </div>

                    <div className="grid gap-3">
                        <p className="text-center text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{t('room.pickGame')}</p>
                        {gameOptions.map((game) => (
                            <button
                                key={game.type}
                                onClick={() => startGame(game.type, isSinglePlayer)}
                                className={`w-full text-left relative overflow-hidden bg-gradient-to-br ${game.color} rounded-2xl p-5 shadow-lg transition-all active:scale-[0.98] group`}
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
                                    <span className="text-6xl font-black">{game.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white relative z-10">{t(game.titleKey)}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center animate-pulse">
                    <div className="inline-block px-6 py-2 bg-gray-900 border border-gray-800 rounded-full text-gray-400 font-medium tracking-wide">
                        {t('room.waitingForHost')}
                    </div>
                </div>
            )}
        </div>
    );
}
