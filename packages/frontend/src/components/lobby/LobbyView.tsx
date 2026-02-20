'use client';

import React, { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { GameType } from '@/types/game';

export default function LobbyView() {
    const { joinRoom, startGame } = useGame();
    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState('');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (nickname.trim() && roomCode.trim()) {
            joinRoom(roomCode.toUpperCase().trim(), nickname.trim());
        }
    };

    const handleCreateRoom = (game: GameType) => {
        if (!nickname.trim()) {
            alert('Please enter a nickname first!');
            return;
        }
        const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        joinRoom(newRoomCode, nickname.trim());
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 font-sans selection:bg-[#256af4] selection:text-white pb-24 touch-manipulation">
            {/* Header Profile Section */}
            <div className="pt-8 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome back.</h1>
                <p className="text-gray-400 mb-6">Enter your nickname to join the party.</p>

                <div className="relative">
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Your Nickname"
                        className="w-full bg-[#1A1A1A] border border-gray-800 rounded-2xl py-4 px-6 text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#256af4] transition-all min-h-[56px]"
                    />
                </div>
            </div>

            {/* Join Game Section */}
            <div className="bg-[#141414] rounded-3xl p-6 mb-8 border border-gray-800/50 shadow-xl">
                <h2 className="text-xl font-semibold mb-4 text-white">Join a Game</h2>
                <form onSubmit={handleJoin} className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="Enter 6-char Code"
                        maxLength={6}
                        className="w-full bg-[#0A0A0A] border border-gray-800 rounded-2xl py-4 px-6 text-lg text-white placeholder-gray-500 text-center uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-[#256af4] transition-all min-h-[56px]"
                    />
                    <button
                        type="submit"
                        disabled={!nickname.trim() || roomCode.length < 4}
                        className="w-full bg-[#256af4] hover:bg-[#1b50c0] disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-lg rounded-2xl py-4 transition-all min-h-[56px] active:scale-[0.98]"
                    >
                        Join Party
                    </button>
                </form>
            </div>

            {/* Host Game Section */}
            <div>
                <div className="flex justify-between items-center mb-6 px-2">
                    <h2 className="text-xl font-semibold text-white">Host New Party</h2>
                </div>
                <button
                    onClick={() => handleCreateRoom('LOBBY')}
                    className="w-full text-left relative overflow-hidden bg-gradient-to-br from-[#7e22ce] to-[#db2777] rounded-3xl p-6 min-h-[140px] shadow-2xl transition-all active:scale-[0.98] group flex items-center justify-center"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <span className="text-9xl font-black">+</span>
                    </div>
                    <div className="text-center relative z-10">
                        <h3 className="text-3xl font-bold text-white mb-2">Create Room</h3>
                        <p className="text-fuchsia-100/90 font-medium text-lg">Gather your friends and pick a game inside.</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
