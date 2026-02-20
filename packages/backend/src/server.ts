import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import {
    Room,
    PlayerAction,
    reduceRoomState,
    Player,
    GameType
} from './logic/gameEngine';

const app = express();
const allowedOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({
    origin: allowedOrigin,
    methods: ["GET", "POST"]
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigin,
        methods: ["GET", "POST"]
    }
});

// In-Memory state
const rooms = new Map<string, Room>();

// Maps to help manage connections
const socketIdToPlayerId = new Map<string, string>();
const socketIdToRoomId = new Map<string, string>();
const sessionTokenToPlayerId = new Map<string, string>(); // To allow reconnects
const disconnectTimers = new Map<string, NodeJS.Timeout>();

const DISCONNECT_TTL = 5 * 60 * 1000; // 5 minutes

// Helper: Generate 4-character room code
function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Helper: Generate simple session token
function generateSessionToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper: Generate a full shuffled deck
function generateShuffledDeck(): string[] {
    const suits = ['H', 'D', 'C', 'S'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: string[] = [];

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push(`${rank}${suit}`);
        }
    }

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Helper: Deep clone and mask state before broadcasting
function broadcastRoomState(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Get all sockets currently in this room
    io.in(roomId).fetchSockets().then((sockets) => {
        sockets.forEach((socket) => {
            const playerId = socketIdToPlayerId.get(socket.id);
            if (!playerId) return;

            // Deep clone the room for masking
            const maskedRoom: Room = JSON.parse(JSON.stringify(room));

            // Mask Cachito hidden state
            if (maskedRoom.currentGame === 'CACHITO') {
                const cachitoState = maskedRoom.gameState as any;
                if (cachitoState.status !== 'RESOLVING') {
                    // Hide dice for everyone except the specific player this socket belongs to
                    Object.values(maskedRoom.players).forEach((player) => {
                        if (player.id !== playerId) {
                            player.dice = []; // Empty out dice so client can't see them
                        }
                    });
                }
            } else if (maskedRoom.currentGame === 'HIGHER_LOWER') {
                const hlState = maskedRoom.gameState as any;
                hlState.deck = []; // hide deck from everyone
                if (playerId !== hlState.holderId) {
                    hlState.currentCard = null; // hide current card from everyone except holder
                }
            }

            // Emit to specific socket
            socket.emit('room_update', maskedRoom);
        });
    });
}

io.on('connection', (socket: Socket) => {
    console.log(`[+] Socket connected: ${socket.id}`);

    // JOIN ROOM
    socket.on('join_room', (payload: { roomId?: string, playerName?: string, token?: string }) => {
        let { roomId, playerName, token } = payload;

        let player: Player | null = null;
        let room: Room | null = null;
        let isReconnecting = false;

        // Try reconnecting via token
        if (token && sessionTokenToPlayerId.has(token) && roomId && rooms.has(roomId)) {
            const existingPlayerId = sessionTokenToPlayerId.get(token)!;
            room = rooms.get(roomId)!;

            if (room.players[existingPlayerId]) {
                player = room.players[existingPlayerId];
                isReconnecting = true;

                // Clear any pending disconnect timer
                if (disconnectTimers.has(existingPlayerId)) {
                    clearTimeout(disconnectTimers.get(existingPlayerId));
                    disconnectTimers.delete(existingPlayerId);
                }
            }
        }

        // New connection
        if (!isReconnecting) {
            if (!playerName) return socket.emit('error', { message: 'Player name required' });

            // Create session
            const newPlayerId = generateSessionToken(); // acting as playerId
            token = generateSessionToken();
            sessionTokenToPlayerId.set(token, newPlayerId);

            player = {
                id: newPlayerId,
                name: playerName,
                connectionState: 'CONNECTED',
                generalLevel: 0,
                isThumbMaster: false,
                dice: [],
                diceCount: 5
            };

            // Join existing or create new room
            if (roomId && rooms.has(roomId)) {
                room = rooms.get(roomId)!;
            } else {
                roomId = generateRoomCode();
                room = {
                    id: roomId,
                    hostId: newPlayerId,
                    players: {},
                    playerOrder: [],
                    currentGame: 'LOBBY',
                    gameState: { status: 'WAITING' },
                    createdAt: Date.now()
                };
                rooms.set(roomId, room);
            }

            room.players[newPlayerId] = player;
            room.playerOrder.push(newPlayerId);
        }

        if (!player || !room || !roomId) return; // TS guard

        player.connectionState = 'CONNECTED';

        // Update tracking maps
        socketIdToPlayerId.set(socket.id, player.id);
        socketIdToRoomId.set(socket.id, roomId);

        // Join socket.io room
        socket.join(roomId);

        // Send token back to client so they can save it
        socket.emit('session_token', { token, playerId: player.id });

        console.log(`[>] Player ${player.name} (${player.id}) joined room ${roomId}`);
        broadcastRoomState(roomId);
    });

    // START GAME
    socket.on('start_game', (payload: { gameType: GameType, isSinglePlayer?: boolean }) => {
        const playerId = socketIdToPlayerId.get(socket.id);
        const roomId = socketIdToRoomId.get(socket.id);
        if (!playerId || !roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        if (room.hostId !== playerId) {
            return socket.emit('error', { message: 'Only host can start the game' });
        }

        room.currentGame = payload.gameType;

        // Init base states
        if (payload.gameType === 'HIGHER_LOWER') {
            const isSinglePlayer = payload.isSinglePlayer !== undefined ? payload.isSinglePlayer : room.playerOrder.length === 1;
            const fullDeck = generateShuffledDeck();
            const firstCard = fullDeck.pop()!;

            room.gameState = {
                deck: fullDeck,
                currentCard: firstCard,
                holderId: isSinglePlayer ? 'SYSTEM' : room.playerOrder[0],
                guesserId: isSinglePlayer ? room.playerOrder[0] : room.playerOrder[1 % room.playerOrder.length],
                attemptNumber: 1,
                cardsRemaining: fullDeck.length,
                discardPile: []
            };
        } else if (payload.gameType === 'CACHITO') {
            // Roll 5 dice for everyone
            Object.values(room.players).forEach(p => {
                p.diceCount = 5;
                p.dice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
            });
            room.gameState = {
                status: 'BIDDING',
                currentTurnId: room.playerOrder[0],
                currentBid: null,
                previousBid: null,
                isObligado: false
            };
        } else if (payload.gameType === 'GENERAL') {
            room.gameState = {
                currentTurnId: room.playerOrder[0],
                lastRoll: null,
                rollPending: false
            };
        }

        broadcastRoomState(roomId);
    });

    // ACTION INTENT (Dispatched to gameEngine)
    socket.on('action_intent', (payload: { type: string, payload: any }) => {
        const playerId = socketIdToPlayerId.get(socket.id);
        const roomId = socketIdToRoomId.get(socket.id);
        if (!playerId || !roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        // Construct player action
        const action: PlayerAction = { ...payload.payload, type: payload.type } as PlayerAction;

        try {
            const newRoomState = reduceRoomState(room, action, playerId);
            rooms.set(roomId, newRoomState);

            // If state triggered RESOLVING in Cachito, we might need to handle round transitions here,
            // but for blueprint brevity, we just broadcast.

            broadcastRoomState(roomId);
        } catch (error: any) {
            socket.emit('error', { message: error.message });
        }
    });

    // EXPLICIT LEAVE
    socket.on('leave_room', () => {
        handleDisconnect(socket.id, true);
    });

    // DISCONNECT
    socket.on('disconnect', () => {
        console.log(`[-] Socket disconnected: ${socket.id}`);
        handleDisconnect(socket.id, false);
    });

    function handleDisconnect(socketId: string, explicit: boolean) {
        const playerId = socketIdToPlayerId.get(socketId);
        const roomId = socketIdToRoomId.get(socketId);

        socketIdToPlayerId.delete(socketId);
        socketIdToRoomId.delete(socketId);

        if (!playerId || !roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players[playerId];
        if (!player) return;

        if (explicit) {
            // Leave immediately
            delete room.players[playerId];
            room.playerOrder = room.playerOrder.filter(id => id !== playerId);
            broadcastRoomState(roomId);

            if (room.playerOrder.length === 0) {
                rooms.delete(roomId);
            }
        } else {
            // TTL Disconnect
            player.connectionState = 'DISCONNECTED';
            broadcastRoomState(roomId);

            const timer = setTimeout(() => {
                const r = rooms.get(roomId);
                if (r && r.players[playerId] && r.players[playerId].connectionState === 'DISCONNECTED') {
                    delete r.players[playerId];
                    r.playerOrder = r.playerOrder.filter(id => id !== playerId);
                    broadcastRoomState(roomId);

                    if (r.playerOrder.length === 0) {
                        rooms.delete(roomId);
                    }
                }
                disconnectTimers.delete(playerId);
            }, DISCONNECT_TTL);

            disconnectTimers.set(playerId, timer);
        }
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`[🚀] Server running on port ${PORT}`);
});
