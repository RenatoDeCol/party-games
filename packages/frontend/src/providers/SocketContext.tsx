'use client';

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameType, Room, Player } from '@/types/game';

interface SocketContextValue {
    socket: Socket | null;
    isConnected: boolean;
    roomId: string | null;
    room: Room | null;
    me: Player | null;
    isHost: boolean;
    gameType: GameType | null;
    emitAction: (type: string, payload?: any) => void;
    joinRoom: (roomId: string, playerName: string) => void;
    leaveRoom: () => void;
    startGame: (gameType: GameType, isSinglePlayer?: boolean) => void;
    error: string | null;
}

export const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [me, setMe] = useState<Player | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
        if (!socketUrl && typeof window !== 'undefined') {
            socketUrl = `http://${window.location.hostname}:3001`;
        } else if (!socketUrl) {
            socketUrl = 'http://localhost:3001';
        }

        const newSocket = io(socketUrl, {
            autoConnect: false,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            setIsConnected(true);
            setError(null);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('session_token', (payload: { token: string, playerId: string }) => {
            localStorage.setItem('sessionToken', payload.token);
            localStorage.setItem('playerId', payload.playerId);
        });

        newSocket.on('room_update', (updatedRoom: Room) => {
            setRoom(updatedRoom);

            const savedPlayerId = localStorage.getItem('playerId');
            if (updatedRoom && savedPlayerId) {
                const player = updatedRoom.players[savedPlayerId];
                if (player) {
                    setMe(player);
                }
            }
        });

        newSocket.on('error', (err: { message: string, code?: string }) => {
            setError(err.message);
        });

        // Always connect the socket
        newSocket.connect();

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const joinRoom = (roomToJoin: string, playerName: string) => {
        if (!socket) return;
        const sessionToken = localStorage.getItem('sessionToken');
        socket.emit('join_room', { roomId: roomToJoin, playerName, token: sessionToken });
        setRoomId(roomToJoin);
    };

    const leaveRoom = () => {
        if (!socket) return;
        socket.emit('leave_room', {});
        // Do not disconnect the socket entirely, just leave the room
        setRoomId(null);
        setRoom(null);
        setMe(null);
        localStorage.removeItem('sessionToken');
    };

    const startGame = (gameType: GameType, isSinglePlayer?: boolean) => {
        if (!socket) return;
        socket.emit('start_game', { gameType, isSinglePlayer });
    };

    const emitAction = (type: string, payload: any = {}) => {
        if (!socket) return;
        socket.emit('action_intent', { type, payload });
    };

    const isHost = me ? room?.hostId === me.id : false;
    const gameType = room?.currentGame || null;

    return (
        <SocketContext.Provider
            value={{
                socket,
                isConnected,
                roomId,
                room,
                me,
                isHost,
                gameType,
                emitAction,
                joinRoom,
                leaveRoom,
                startGame,
                error
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};
