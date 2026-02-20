# Multi-Agent Development Blueprint: Party Game Hub

## Project Context & Architecture Overview
- **Platform:** Progressive Web App (PWA), mobile-first browser access.
- **Frontend Stack:** React (Next.js), Tailwind CSS, Socket.io-client.
- **Backend Stack:** Node.js, Express, Socket.io.
- **State Management:** Centralized, server-authoritative in-memory state (with Redis extensibility).

---

## MODULE 1: GLOBAL CONTEXT & DATA CONTRACTS

### 1.1 Data Schemas (TypeScript Interfaces / JSON Schema)

```typescript
// Core Entities
type GameType = 'LOBBY' | 'HIGHER_LOWER' | 'CACHITO' | 'GENERAL';
type ConnectionState = 'CONNECTED' | 'DISCONNECTED';

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
}

export interface GeneralState {
  currentTurnId: string;
  lastRoll: number | null;
  rollPending: boolean;
}
```

### 1.2 Server-Authoritative State Reconciliation Strategy
- **Master State:** The Node.js/Socket.io server holds the absolute source of truth.
- **Client Emits Intent:** Clients NEVER mutate state. They emit intentions (e.g., `GUESS_CARD`, `PLACE_BID`).
- **Server Validates & Mutates:** The server intercepts intentions, validates against the rules engine, updates the state, and broadcasts the new state.
- **State Masking (Crucial):** Before broadcasting, the server MUST run a masking serialization function. For example, in Cachito, `Room.players[id].dice` must be stripped out of the broadcast payload for everyone except the owning player.
- **Optimistic UI:** Prohibited for core game logic to prevent cheating and desyncs. Clients only render based on the latest server broadcast.

---

## MODULE 2: @FRONTEND-AGENT MANDATE

### 2.1 PWA & Mobile-First UI Specifications
- **Touch Targets:** Minimum 48x48dp for all interactive elements (buttons, dice toggles).
- **Responsive Layout:** 100vh lock to prevent accidental pull-to-refresh on mobile browsers. Disable double-tap to zoom (`touch-action: manipulation`).
- **Persistent UI Elements:**
  - **Thumb Master Button:** Absolute positioned, floating action button (FAB) style. Must be instantly accessible (un-occluded) if `isThumbMaster === true`. Disappears immediately after one use.
- **Secret Viewing UX (Cachito):** 
  - Dice should be "covered" (e.g., under a digital cup) by default to prevent screen cheating in physical settings.
  - "Press and hold to view dice" interaction model.

### 2.2 React Context / Hooks Architecture
- **`SocketProvider`**: Top-level App wrapper that establishes the Socket.io connection.
- **`useGame()` Hook**: 
  - Subscribes to the `state_update` socket event.
  - Returns `{ room, me, isHost, gameType, emitAction }`.
  - Automatically manages connection status UI overlays.
- **Payload Reducer**: Frontend must simply ingest the server's state payload and replace its local context. No complex frontend reducers for game state.

---

## MODULE 3: @BACKEND-AGENT MANDATE

### 3.1 WebSocket Event Map

| Channel / Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_room` | Client -> Server | `{ roomId, playerName, token? }` | Attempt to join/reconnect to a room. |
| `leave_room` | Client -> Server | `{}` | Explicit disconnect. |
| `start_game` | Client -> Server | `{ gameType: GameType }` | Host requests game start. |
| `action_intent` | Client -> Server | `{ type: string, payload: any }` | Generic wrapper for game actions. |
| `room_update` | Server -> Client | `Room` (Masked) | Complete synchronized state broadcast. |
| `error` | Server -> Client | `{ message, code }` | E.g., validation failed, not your turn. |
| `game_event` | Server -> Client | `{ type: string, message: string }` | Ephemeral events (e.g., toast notifications). |

#### Game Specific Action Intents (`action_intent` payloads)
- **Higher/Lower:** `{ type: 'GUESS', guess: 'HIGHER' | 'LOWER' | 'EXACT', number?: number }`
- **Cachito:** 
  - `{ type: 'BID', quantity: number, faceValue: number, isAces: boolean }`
  - `{ type: 'DOUBT' }`
  - `{ type: 'MATCH' }` (Calzar)
- **General:**
  - `{ type: 'ROLL_DICE' }`
  - `{ type: 'USE_THUMB' }`
  - `{ type: 'CHOOSE_PLAYER', targetId: string }` (For Roll 2)
  - `{ type: 'GENERAL_GAME_END' }` (Host signals reality mini-game via '5' ended).

### 3.2 Connection Lifecycle & Reconnection
- **Session Tokens:** On initial `join_room`, server sends back a unique `sessionToken`. Client stores this in `localStorage`.
- **Disconnect Handling:** 
  - On Socket disconnect, mark `Player.connectionState = 'DISCONNECTED'`.
  - Start a TTL timer (e.g., 5 minutes) on the server. Do NOT remove the player from the game state immediately.
  - Skip disconnected players in turn orders.
- **Reconnection:** Client emits `join_room` with the cached `sessionToken`. Server identifies the player, updates socket ID maps, sets state to `CONNECTED`, and pushes current state.

---

## MODULE 4: @LOGIC-AGENT MANDATE

### 4.1 State Machine Transitions

#### Game 1: Higher or Lower
- **State Init:** Shuffle standard 52-card deck. Assign `holderId`. Next player in order is `guesserId`. `attemptNumber = 1`.
- **Transitions:**
  - **Guess 1 - Correct:** Holder finishes drink. Card discarded. Next player becomes `guesserId`. `attemptNumber = 1`.
  - **Guess 1 - Incorrect:** Register hint (e.g., "It's higher/lower"). `attemptNumber = 2`.
  - **Guess 2 - Correct:** Holder drinks half their cup. Card discarded. Next `guesserId`. `attemptNumber = 1`.
  - **Guess 2 - Incorrect:** Guesser sips equal to the numerical difference between guess and actual card. Card discarded. Next `guesserId`. `attemptNumber = 1`.
  - **End of Rotation/Deck:** Once `guesserId` rotates back to `holderId`, the `holderId` passes to the next player. Logic continues until all 52 cards are played.

#### Game 2: Cachito (Liar's Dice)
- **State Init:** Roll 5 dice per player. `status = BIDDING`. Assign `currentTurnId`.
- **Transitions (Actions):**
  - **Bid:** Sets `currentBid` and updates `previousBid`. Passes `currentTurnId` to next player.
  - **Doubt:** Enters `RESOLVING`. Server reveals all dice. Compares total matching `faceValue` (including 1s/Aces if not explicitly bid on, unless Obligado). Loser decrements `diceCount`. Start next round.
  - **Match (Calzar):** Enters `RESOLVING`. Server reveals. If exact match, caller `diceCount` +1 (max 5). If incorrect, caller `diceCount` -1. Start next round.
- **Obligado Trigger:** If any player reaches `diceCount === 1` after resolve, strictly set `isObligado = true` for the next round. Aces are literal 1s, not wildcards.

#### Game 3: General
- **State Init:** Player order assigned.
- **Transitions (Rolls):**
  - **Roll 6 (General):** Increase `generalLevel`. Give player immediate extra turn (`rollPending = true`). If new highest General, system message announces new global rules.
  - **Roll 5 (Game):** State freezes pending external action. Requires host to emit `GENERAL_GAME_END` action to unlock state for next player.
  - **Roll 4 (Thumb):** Set roller's `isThumbMaster = true` (clearing previous if exists). Turn passes.
  - **Roll 3 (Sides):** System triggers drink event for roller and adjacent players (index+1 / index-1). Turn passes.
  - **Roll 2 (Choose):** UI prompts roller to select player. Roller emits `CHOOSE_PLAYER`. Turns passes after choice.
  - **Roll 1 (Punishment):** Set roller's `generalLevel = 0`. System triggers major drink event. Turn passes.

### 4.2 Validation Rules (Server-Enforced Constraints)
- **General Rules:**
  - Reject actions if `gameState.currentTurnId !== incomingSocket.playerId` (except `USE_THUMB` or out-of-turn `MATCH`/`DOUBT` if allowed by the variant).
  - Reject `start_game` if `incomingSocket.playerId !== room.hostId`.
- **Cachito Bid Validation (Strict Mathematics):**
  - **Raise Quantity:** Incoming `quantity` > current `quantity`. Face value can be >= current.
  - **Raise Face Value:** Incoming `quantity` === current `quantity`. Incoming `faceValue` > current `faceValue`.
  - **Switch to Aces:** Incoming `isAces === true`. Incoming `quantity` >= `Math.ceil(current.quantity / 2)`.
  - **Switch from Aces:** Incoming `isAces === false`. Incoming `quantity` >= `(current.quantity * 2) + 1`.
  - **Obligado Restrictions:** Reject any attempt to change `faceValue` from the opening bid of the round. Reject any `isAces === true` bids.
- **Thumb Master Authority:**
  - Accept `USE_THUMB` only if `player.isThumbMaster === true`. Immediately set to `false`. Triggers a secondary timed event (reaction challenge) across all clients.
