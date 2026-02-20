'use client';

import React from 'react';
import { useGame } from '@/hooks/useGame';

export default function Header() {
    const { room, leaveRoom } = useGame();

    if (!room) return null;

    return (
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50">
            <button
                onClick={leaveRoom}
                className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl text-white font-bold border border-white/20 shadow-lg hover:bg-red-500/80 hover:border-red-500 transition-all active:scale-95"
            >
                Leave
            </button>

            <div className="bg-[#1A1A1A]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-800 shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-gray-300 font-bold uppercase tracking-widest text-sm">Room</span>
                <span className="text-white font-black tracking-widest">{room.id}</span>
            </div>
        </div>
    );
}
