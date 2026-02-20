'use client';

import React from 'react';
import { useGame } from '@/hooks/useGame';
import LobbyView from '@/components/lobby/LobbyView';
import HigherLowerView from '@/components/game1/HigherLowerView';
import RoomWaitingView from '@/components/lobby/RoomWaitingView';
import CachitoView from '@/components/game2/CachitoView';
import GeneralView from '@/components/game3/GeneralView';

export default function Home() {
  const { isConnected, room } = useGame();

  // Basic connection state handling
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#256af4] mb-4"></div>
        <h2 className="text-xl font-bold">Connecting to Master Server...</h2>
      </div>
    );
  }

  // If no room, we are in the main Lobby
  if (!room) {
    return <LobbyView />;
  }

  // Route based on Game Type
  switch (room.currentGame) {
    case 'HIGHER_LOWER':
      return <HigherLowerView />;
    case 'CACHITO':
      return <CachitoView />;
    case 'GENERAL':
      return <GeneralView />;
    case 'LOBBY':
    default:
      return <RoomWaitingView />;
  }
}
