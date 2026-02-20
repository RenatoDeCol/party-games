'use client';

import React, { useState } from 'react';
import { useGame } from '@/hooks/useGame';

export default function Header() {
    const { room, leaveRoom, emitAction, me, isHost } = useGame();
    const [showPlayersMenu, setShowPlayersMenu] = useState(false);

    if (!room) return null;

    const handleLeave = () => {
        if (window.confirm("Do you want to leave the room? You can rejoin later if the host hasn't kicked you.")) {
            leaveRoom();
        }
    };

    const movePlayer = (index: number, direction: 'up' | 'down') => {
        if (!isHost) return;
        const newOrder = [...room.playerOrder];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newOrder.length) return;

        [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
        emitAction('REORDER_PLAYERS', { playerOrder: newOrder });
    };

    const handleKick = (playerId: string) => {
        if (!isHost || playerId === me?.id) return;
        if (window.confirm(`Are you sure you want to kick ${room.players[playerId]?.name}?`)) {
            emitAction('KICK_PLAYER', { targetId: playerId });
        }
    };

    return (
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50">
            <button
                onClick={handleLeave}
                className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl text-white font-bold border border-white/20 shadow-lg hover:bg-red-500/80 hover:border-red-500 transition-all active:scale-95 flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                Back
            </button>

            <div className="flex gap-2">
                <button
                    onClick={() => setShowPlayersMenu(true)}
                    className="bg-[#1A1A1A]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-800 shadow-lg flex items-center gap-2 hover:bg-[#252525] transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    <span className="text-white font-bold text-sm">{room.playerOrder.length}</span>
                </button>

                <div className="bg-[#1A1A1A]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-800 shadow-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-gray-300 font-bold uppercase tracking-widest text-sm">Room</span>
                    <span className="text-white font-black tracking-widest">{room.id}</span>
                </div>
            </div>

            {/* Players Menu Modal */}
            {showPlayersMenu && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-sm bg-[#141414] border border-gray-800 rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-zoom-in">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a]">
                            <h2 className="text-xl font-black text-white px-2">Players</h2>
                            <button onClick={() => setShowPlayersMenu(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-red-500/80 hover:text-white text-gray-400 font-bold transition-colors">✕</button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-3 flex-1">
                            {room.playerOrder.map((pid, idx) => {
                                const player = room.players[pid];
                                if (!player) return null;
                                const isCurrentUser = pid === me?.id;
                                const isDisconnected = player.connectionState === 'DISCONNECTED';
                                const isRoomHost = pid === room.hostId;

                                return (
                                    <div key={pid} className={`flex flex-col p-3 rounded-2xl border ${isCurrentUser ? 'bg-[#256af4]/10 border-[#256af4]/30' : 'bg-black/30 border-gray-800'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCurrentUser ? 'bg-[#256af4] text-white' : 'bg-gray-800 text-gray-400'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold ${isCurrentUser ? 'text-white' : (isDisconnected ? 'text-gray-500 italic' : 'text-gray-200')}`}>
                                                            {player.name} {isCurrentUser && "(You)"}
                                                        </span>
                                                        {isDisconnected && <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Away</span>}
                                                    </div>
                                                    {isRoomHost && <span className="text-[10px] text-amber-500 uppercase font-black tracking-widest">Host</span>}
                                                </div>
                                            </div>

                                            {isHost && (
                                                <div className="flex items-center gap-1">
                                                    {room.playerOrder.length > 1 && (
                                                        <div className="flex gap-1 mr-2">
                                                            <button onClick={() => movePlayer(idx, 'up')} disabled={idx === 0} className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-lg transition-colors">↑</button>
                                                            <button onClick={() => movePlayer(idx, 'down')} disabled={idx === room.playerOrder.length - 1} className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-lg transition-colors">↓</button>
                                                        </div>
                                                    )}
                                                    {!isCurrentUser && (
                                                        <button onClick={() => handleKick(pid)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors font-bold text-lg">×</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
