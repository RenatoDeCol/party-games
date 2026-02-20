/**
 * GLOBAL CONTEXT & DATA CONTRACTS
 * 
 * This file contains the exact TypeScript interfaces and JSON schema representations 
 * for the Multi-Agent Development Blueprint (Module 1). These contracts must be imported
 * by both the @FRONTEND-AGENT and @BACKEND-AGENT for strict type safety.
 */

// ============================================================================
// CORE ENTITIES
// ============================================================================

export type GameType = 'LOBBY' | 'HIGHER_LOWER' | 'CACHITO' | 'GENERAL';
export type ConnectionState = 'CONNECTED' | 'DISCONNECTED';

export interface Player {
  /** Unique Socket ID or Session Token */
  id: string;
  name: string;
  avatarUrl?: string;
  connectionState: ConnectionState;

  // --- CROSS-GAME STATE ---
  /** Rank or level for the "General" game */
  generalLevel: number;
  /** True if the player currently holds the Thumb Master power */
  isThumbMaster: boolean;

  // --- CACHITO (LIAR'S DICE) HIDDEN STATE ---
  /** 
   * Array of dice faces (e.g., [1, 3, 3, 5, 6]). 
   * CRITICAL: Must be aggressively stripped from the GameState payload by the server 
   * for all connections EXCEPT the `Player` possessing this array. 
   */
  dice: number[];
  /** Publicly visible count of dice remaining for this player */
  diceCount: number;
}

export interface Room {
  /** 4-6 character alphanumeric invite code */
  id: string;
  /** Player ID defining the host of the room */
  hostId: string;
  /** Map of all players in the room, keyed by Player ID */
  players: Record<string, Player>;
  /** Array of Player IDs defining the persistent turn order */
  playerOrder: string[];
  /** Currently active game mode */
  currentGame: GameType;
  /** Polymorphic game state payload */
  gameState: GameState;
  /** Unix timestamp of room creation */
  createdAt: number;
}

// ============================================================================
// GAME STATES
// ============================================================================

export type GameState = 
  | LobbyState 
  | HigherLowerState 
  | CachitoState 
  | GeneralState;

export interface LobbyState {
  status: 'WAITING' | 'STARTING';
}

export interface HigherLowerState {
  /** The remaining deck of cards (e.g. ['2H', 'AC']). HIDDEN ON SERVER! */
  deck: string[];
  /** The currently drawn card on the table (e.g. '10S') */
  currentCard: string | null;
  /** Player ID holding the deck */
  holderId: string;
  /** Player ID whose turn it is to guess */
  guesserId: string;
  /** Attempt 1 (Finish/Hint) vs Attempt 2 (Half-Drink/Diff Sip) */
  attemptNumber: 1 | 2;
  /** Number of cards left to play in the deck (52 down to 0) */
  cardsRemaining: number;
}

export interface CachitoBid {
  playerId: string;
  quantity: number;
  faceValue: number; // 1-6 (1 = Ace/Wildcard)
  isAces: boolean;   // True if the player explicitly bid on Aces
}

export interface CachitoState {
  /** Phase of the Cachito round */
  status: 'BIDDING' | 'RESOLVING' | 'OBLIGADO';
  /** Player ID whose turn it is to bid/call */
  currentTurnId: string;
  /** The standing bid on the table */
  currentBid: CachitoBid | null;
  /** The preceding bid (used for UI history and validation) */
  previousBid: CachitoBid | null;
  /** 
   * True if a player reached 1 die at the end of the last round. 
   * Enforces Obligado validation rules (no wildcard Aces, lock face_value).
   */
  isObligado: boolean;
}

export interface GeneralState {
  currentTurnId: string;
  /** The face value of the last die rolled (1-6) */
  lastRoll: number | null;
  /** 
   * True if a roll happened (e.g. a 5 or 'General') but the turn 
   * cannot pass yet because an interaction is required. 
   */
  rollPending: boolean;
}

// ============================================================================
// CLIENT INTENT EMISSIONS (ACTIONS)
// ============================================================================

export type ClientIntent =
  | HigherLowerIntent
  | CachitoIntent
  | GeneralIntent;

export type HigherLowerIntent = 
  | { type: 'GUESS'; guess: 'HIGHER' | 'LOWER' | 'EXACT'; number?: number };

export type CachitoIntent = 
  | { type: 'BID'; quantity: number; faceValue: number; isAces: boolean }
  | { type: 'DOUBT' }
  | { type: 'MATCH' }; // Calzar

export type GeneralIntent = 
  | { type: 'ROLL_DICE' }
  | { type: 'USE_THUMB' }
  | { type: 'CHOOSE_PLAYER'; targetId: string }
  | { type: 'GENERAL_GAME_END' };

// ============================================================================
// SERVER-AUTHORITATIVE STATE RECONCILIATION & MASKING
// ============================================================================

/**
 * ARCHITECTURE PROTOCOL: State Masking Function Blueprint
 * 
 * The Backend API Server MUST run a masking serialization function on the `Room`
 * object before transmitting it over WebSocket to any specific client.
 * 
 * Protocol Rules:
 * 1. Deep clone the Room object.
 * 2. If `currentGame === 'HIGHER_LOWER'`, delete `room.gameState.deck`. Only
 *    the server knows the remaining cards to prevent screen cheating.
 * 3. Iterate over `room.players`. For each player, if `player.id !== socket.playerId`,
 *    delete `player.dice` (replace with an empty array or undefined).
 * 4. Transmit the masked `Room` payload to the specific socket.
 * 
 * @example
 * ```typescript
 * function maskStateForClient(room: Room, targetSocketId: string): Room {
 *   const payload = JSON.parse(JSON.stringify(room)); // Naive deep clone
 *   
 *   if (payload.currentGame === 'HIGHER_LOWER') {
 *     delete payload.gameState.deck; 
 *   }
 *   
 *   Object.values(payload.players).forEach(player => {
 *     if (player.id !== targetSocketId) {
 *       player.dice = []; // Hide private dice state
 *     }
 *   });
 *   
 *   return payload;
 * }
 * ```
 */
