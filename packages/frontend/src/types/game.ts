export type GameType = 'LOBBY' | 'HIGHER_LOWER' | 'CACHITO' | 'GENERAL';
export type ConnectionState = 'CONNECTED' | 'DISCONNECTED';

export interface Player {
    id: string;             // Unique socket.id or session token
    name: string;
    avatarUrl?: string;
    connectionState: ConnectionState;

    // Cross-game Player State
    generalLevel: number;   // Relevant for "General"
    isThumbMaster: boolean; // Relevant for "General"

    // Cachito (Liar's Dice) specific state
    dice: number[];         // Hidden from other players in public payloads
    diceCount: number;      // Publicly visible
}

export interface Room {
    id: string;             // 4-6 character alphanumeric room code
    hostId: string;         // Player ID of the room creator
    players: Record<string, Player>;
    playerOrder: string[];  // Array of Player IDs for turn order
    currentGame: GameType;
    gameState: GameState;
    createdAt: number;      // Timestamp
}

// Game State Definitions
export type GameState = LobbyState | HigherLowerState | CachitoState | GeneralState;

export interface LobbyState {
    status: 'WAITING' | 'STARTING';
}

export interface HigherLowerState {
    deck: string[];         // e.g., ['2H', 'AC', 'KS'] (Hidden on server)
    currentCard: string | null;
    holderId: string;
    guesserId: string;
    attemptNumber: 1 | 2;
    cardsRemaining: number;
    discardPile: string[];  // new
    lastGuessHint?: 'HIGHER' | 'LOWER'; // new
    lastConsequence?: string;
    lastConsequenceId?: string;
    lastGuess?: number;
    lastAnswer?: number;
}

export interface CachitoBid {
    playerId: string;
    quantity: number;
    faceValue: number;      // 1-6 (1 is Ace/Wildcard)
    isAces: boolean;        // True if bid is explicitly on Aces
}

export interface CachitoState {
    status: 'BIDDING' | 'RESOLVING' | 'OBLIGADO';
    currentTurnId: string;
    currentBid: CachitoBid | null;
    previousBid: CachitoBid | null;
    isObligado: boolean;    // Triggered when a player reaches 1 die
    loserId?: string | null;
    revealData?: {
        totalFound: number;
        reason: string;
    } | null;
}

export interface GeneralState {
    currentTurnId: string;
    lastRoll: number | null;
    rollPending: boolean;
}
