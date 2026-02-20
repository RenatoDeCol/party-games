// ==========================================
// DATA CONTRACTS (From Blueprint)
// ==========================================

export type GameType = 'LOBBY' | 'HIGHER_LOWER' | 'CACHITO' | 'GENERAL';
export type ConnectionState = 'CONNECTED' | 'DISCONNECTED';

export interface Player {
    id: string;
    name: string;
    avatarUrl?: string;
    connectionState: ConnectionState;

    // Cross-game
    generalLevel: number;
    isThumbMaster: boolean;

    // Cachito
    dice: number[];
    diceCount: number;
}

export interface Room {
    id: string;
    hostId: string;
    players: Record<string, Player>;
    playerOrder: string[];
    currentGame: GameType;
    gameState: GameState;
    createdAt: number;
}

export type GameState = LobbyState | HigherLowerState | CachitoState | GeneralState;

export interface LobbyState {
    status: 'WAITING' | 'STARTING';
}

export interface HigherLowerState {
    deck: string[];
    currentCard: string | null;
    holderId: string;
    guesserId: string;
    attemptNumber: 1 | 2;
    cardsRemaining: number;
    discardPile: string[];
    lastGuessHint?: 'HIGHER' | 'LOWER';
    lastConsequence?: string; // e.g. "Holder drinks full cup", "Try again", "Sip 3"
    lastConsequenceId?: string;
    lastGuess?: number;
    lastAnswer?: number;
}

export interface CachitoBid {
    playerId: string;
    quantity: number;
    faceValue: number;
    isAces: boolean;
}

export interface CachitoState {
    status: 'BIDDING' | 'RESOLVING' | 'OBLIGADO';
    currentTurnId: string;
    currentBid: CachitoBid | null;
    previousBid: CachitoBid | null;
    isObligado: boolean;
    loserId?: string | null;
    revealData?: {
        totalFound: number;
        reason: string;
    } | null;
}

export interface RuleTieBreaker {
    tiedGenerals: string[];
    suggestions: Record<string, string>;
    votes: Record<string, string>;
}

export interface GeneralState {
    currentTurnId: string;
    lastRoll: number | null;
    lastRollerId?: string | null;
    rollPending: boolean;
    activeThumbRace?: boolean;
    thumbRaceParticipants?: string[];
    activeRule?: string | null;
    ruleTieBreaker?: RuleTieBreaker | null;
}

// ==========================================
// ACTION PAYLOADS
// ==========================================

export type PlayerAction =
    | { type: 'HL_GUESS'; guess: 'HIGHER' | 'LOWER' | 'EXACT'; number?: number }
    | { type: 'CACHITO_BID'; quantity: number; faceValue: number; isAces: boolean }
    | { type: 'CACHITO_DOUBT' }
    | { type: 'CACHITO_MATCH' }
    | { type: 'CACHITO_NEXT_ROUND' }
    | { type: 'GENERAL_ROLL_DICE' }
    | { type: 'GENERAL_USE_THUMB' }
    | { type: 'GENERAL_THUMB_RACE_CLICK' }
    | { type: 'GENERAL_CHOOSE_PLAYER'; targetId: string }
    | { type: 'GENERAL_MAKE_RULE'; rule: string }
    | { type: 'GENERAL_SUGGEST_RULE'; rule: string }
    | { type: 'GENERAL_VOTE_RULE'; targetId: string }
    | { type: 'GENERAL_GAME_END' }
    | { type: 'REORDER_PLAYERS'; playerOrder: string[] }
    | { type: 'KICK_PLAYER'; targetId: string };


// ==========================================
// STEP 2: GAME-SPECIFIC VALIDATION & MATH
// ==========================================

// --- HIGHER/LOWER ---

function getCardNumericValue(cardString: string): number {
    const rank = cardString.slice(0, -1);
    if (rank === 'A') return 1;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return parseInt(rank, 10);
}

/**
 * Calculates the sip penalty for the 2nd attempt in Higher/Lower
 * Rule: Guesser sips equal to the numerical difference between guess and actual card.
 */
export function calculateHigherLowerPenalty(guessedNumber: number, actualCard: string): number {
    const actualValue = getCardNumericValue(actualCard);
    return Math.abs(guessedNumber - actualValue);
}

// --- CACHITO ---

/**
 * Strict mathematical validation for Cachito bids.
 */
export function validateCachitoBid(
    currentBid: CachitoBid | null,
    newBid: { quantity: number; faceValue: number; isAces: boolean },
    isObligado: boolean
): boolean {
    // 1-die edge case: Obligado
    if (isObligado) {
        if (newBid.isAces) return false; // Reject aces

        if (currentBid) {
            if (newBid.faceValue !== currentBid.faceValue) return false;
            if (newBid.quantity <= currentBid.quantity) return false;
        } else {
            if (newBid.quantity < 1) return false;
            if (newBid.faceValue === 1) return false; // Aces can't be bid in obligado
        }
        return true;
    }

    // Normal bidding
    if (!currentBid) {
        if (newBid.quantity < 1) return false;
        if (newBid.faceValue < 1 || newBid.faceValue > 6) return false;
        if (newBid.isAces && newBid.faceValue !== 1) return false;
        return true;
    }

    const { quantity: curQ, faceValue: curF, isAces: curA } = currentBid;
    const { quantity: newQ, faceValue: newF, isAces: newA } = newBid;

    // Face value validation constraint (1-6)
    if (newF < 1 || newF > 6) return false;

    // Transition to Aces
    if (newA && !curA) {
        if (newF !== 1) return false; // Aces must have faceValue = 1
        return newQ >= Math.ceil(curQ / 2);
    }

    // Transition from Aces back to normal
    if (!newA && curA) {
        if (newF === 1) return false; // Normal can't be faceValue = 1
        return newQ >= (curQ * 2) + 1;
    }

    // Aces to Aces
    if (newA && curA) {
        if (newF !== 1) return false; // Always 1
        return newQ > curQ;
    }

    // Normal to Normal
    if (!newA && !curA) {
        if (newQ > curQ) {
            // Raise Quantity: face value can be >= current
            return newF >= curF;
        } else if (newQ === curQ) {
            // Raise Face Value
            return newF > curF;
        }
    }

    return false;
}

// --- GENERAL ---

/**
 * Validates if a user attempting to trigger the "Thumb Race" actually holds the isThumbMaster boolean.
 */
export function validateUseThumb(player: Player): boolean {
    return player.isThumbMaster === true;
}

// Helper to advance turn in array (skips disconnected players or players with 0 dice if required)
function getNextTurnId(currentTurnId: string, playerOrder: string[], activePlayers: Record<string, Player>, requireDice: boolean = false): string {
    const currentIndex = playerOrder.indexOf(currentTurnId);

    if (currentIndex === -1) {
        // Fallback if current player was removed
        for (let i = 0; i < playerOrder.length; i++) {
            const pid = playerOrder[i];
            const p = activePlayers[pid];
            if (p?.connectionState === 'CONNECTED' && (!requireDice || p.diceCount > 0)) {
                return pid;
            }
        }
        return playerOrder[0] || currentTurnId;
    }

    for (let i = 1; i <= playerOrder.length; i++) {
        const nextIndex = (currentIndex + i) % playerOrder.length;
        const nextPlayerId = playerOrder[nextIndex];
        const p = activePlayers[nextPlayerId];
        if (p?.connectionState === 'CONNECTED' && (!requireDice || p.diceCount > 0)) {
            return nextPlayerId;
        }
    }
    return currentTurnId;
}


// ==========================================
// STEP 1: CORE STATE MUTATION (Pure Reducers)
// ==========================================

/**
 * Main pure function to reduce the overall Room state based on a player's action.
 */
export function reduceRoomState(room: Room, action: PlayerAction, actingPlayerId: string): Room {
    // Clone to preserve immutability
    const nextRoom: Room = {
        ...room,
        players: JSON.parse(JSON.stringify(room.players)),
        playerOrder: [...room.playerOrder]
    };

    const actingPlayer = nextRoom.players[actingPlayerId];
    if (!actingPlayer) return room; // Invalid player

    // Global Host Actions
    if (nextRoom.hostId === actingPlayerId) {
        if (action.type === 'REORDER_PLAYERS') {
            nextRoom.playerOrder = action.playerOrder;
            return nextRoom;
        }

        if (action.type === 'KICK_PLAYER') {
            const targetId = action.targetId;
            if (targetId && nextRoom.players[targetId]) {
                delete nextRoom.players[targetId];
                nextRoom.playerOrder = nextRoom.playerOrder.filter(id => id !== targetId);

                // Fix up game state turns if the kicked player was currently acting
                if (nextRoom.currentGame === 'CACHITO') {
                    const state = nextRoom.gameState as CachitoState;
                    if (state.currentTurnId === targetId) {
                        state.currentTurnId = getNextTurnId(targetId, nextRoom.playerOrder, nextRoom.players, true);
                    }
                } else if (nextRoom.currentGame === 'GENERAL') {
                    const state = nextRoom.gameState as GeneralState;
                    if (state.currentTurnId === targetId) {
                        state.currentTurnId = getNextTurnId(targetId, nextRoom.playerOrder, nextRoom.players);
                    }
                } else if (nextRoom.currentGame === 'HIGHER_LOWER') {
                    const state = nextRoom.gameState as HigherLowerState;
                    if (state.guesserId === targetId) {
                        state.guesserId = getNextTurnId(targetId, nextRoom.playerOrder, nextRoom.players);
                    }
                    if (state.holderId === targetId) {
                        state.holderId = getNextTurnId(targetId, nextRoom.playerOrder, nextRoom.players);
                    }
                }

                return nextRoom;
            }
        }
    }

    switch (nextRoom.currentGame) {
        case 'HIGHER_LOWER':
            return handleHigherLower(nextRoom, actingPlayerId, action);
        case 'CACHITO':
            return handleCachito(nextRoom, actingPlayerId, action);
        case 'GENERAL':
            return handleGeneral(nextRoom, actingPlayerId, action);
        case 'LOBBY':
        default:
            return nextRoom;
    }
}

function handleHigherLower(room: Room, playerId: string, action: PlayerAction): Room {
    const state = room.gameState as HigherLowerState;

    if (action.type !== 'HL_GUESS') return room;
    if (state.guesserId !== playerId) return room;
    if (!state.currentCard) return room;
    if (action.guess !== 'EXACT' || typeof action.number !== 'number') return room;

    const actualValue = getCardNumericValue(state.currentCard);
    const nextState: HigherLowerState = { ...state, deck: [...state.deck], discardPile: [...state.discardPile] };

    let rotateGuesser = false;
    let cardDiscarded = false;

    // Store the guess and actual value that were made on this action
    nextState.lastGuess = action.number;
    nextState.lastAnswer = actualValue;

    if (action.number === actualValue) {
        // Correct guess!
        cardDiscarded = true;
        rotateGuesser = true;
        if (state.attemptNumber === 1) {
            nextState.lastConsequence = "HOLDER_DRINK_FULL";
        } else {
            nextState.lastConsequence = "HOLDER_DRINK_HALF";
        }
        nextState.lastConsequenceId = Date.now().toString();
        nextState.attemptNumber = 1;
        nextState.lastGuessHint = undefined;
        // nextState.lastGuess = undefined; // Keep them for the modal
        // nextState.lastAnswer = undefined;
    } else {
        // Incorrect guess
        if (state.attemptNumber === 1) {
            nextState.attemptNumber = 2;
            nextState.lastGuessHint = actualValue > action.number ? 'HIGHER' : 'LOWER';
            nextState.lastConsequence = "TRY_AGAIN";
            nextState.lastConsequenceId = Date.now().toString();
        } else {
            // Incorrect 2nd time
            cardDiscarded = true;
            rotateGuesser = true;
            const penalty = calculateHigherLowerPenalty(action.number, state.currentCard);
            nextState.lastConsequence = `GUESSER_SIP_${penalty}`;
            nextState.lastConsequenceId = Date.now().toString();
            nextState.attemptNumber = 1;
            nextState.lastGuessHint = undefined;
            // nextState.lastGuess = undefined;
            // nextState.lastAnswer = undefined;
        }
    }

    if (cardDiscarded) {
        if (state.currentCard) {
            nextState.discardPile.unshift(state.currentCard); // add to top of discard pile
        }
        nextState.currentCard = nextState.deck.pop() || null;
        nextState.cardsRemaining = nextState.deck.length;
    }

    if (rotateGuesser && state.holderId !== 'SYSTEM') {
        const nextGuesser = getNextTurnId(state.guesserId, room.playerOrder, room.players);
        if (nextGuesser === state.holderId) {
            // End of rotation, holder passes to next 
            nextState.holderId = getNextTurnId(state.holderId, room.playerOrder, room.players);
            nextState.guesserId = getNextTurnId(nextState.holderId, room.playerOrder, room.players);
        } else {
            nextState.guesserId = nextGuesser;
        }
    }

    room.gameState = nextState;
    return room;
}

function handleCachito(room: Room, playerId: string, action: PlayerAction): Room {
    const state = room.gameState as CachitoState;

    if (action.type !== 'CACHITO_BID' && action.type !== 'CACHITO_DOUBT' && action.type !== 'CACHITO_MATCH' && action.type !== 'CACHITO_NEXT_ROUND') return room;

    // Enforce strict turn matching for actions inside the round
    if (state.currentTurnId !== playerId && action.type !== 'CACHITO_NEXT_ROUND') return room;

    const nextState: CachitoState = { ...state };

    if (action.type === 'CACHITO_BID') {
        const newBid = {
            playerId,
            quantity: action.quantity,
            faceValue: action.faceValue,
            isAces: action.isAces
        };

        if (!validateCachitoBid(state.currentBid, newBid, state.isObligado)) {
            return room; // Invalid bid
        }

        nextState.previousBid = nextState.currentBid;
        nextState.currentBid = newBid;
        nextState.currentTurnId = getNextTurnId(playerId, room.playerOrder, room.players, true);
        nextState.status = 'BIDDING';
    }

    if (action.type === 'CACHITO_DOUBT' || action.type === 'CACHITO_MATCH') {
        const prevBid = nextState.currentBid;
        if (!prevBid) return room; // Cannot doubt/match without a bid

        let totalFound = 0;
        const targetFace = prevBid.faceValue;
        const isAces = prevBid.isAces;

        // Count dice across all players
        Object.values(room.players).forEach(p => {
            if (p.diceCount > 0) {
                p.dice.forEach(d => {
                    if (d === targetFace) totalFound++;
                    else if (!state.isObligado && !isAces && d === 1) totalFound++; // 1s are wild unless it's Obligado or bidding Aces
                });
            }
        });

        nextState.status = 'RESOLVING';
        nextState.revealData = { totalFound, reason: '' };

        if (action.type === 'CACHITO_DOUBT') {
            if (totalFound < prevBid.quantity) {
                // Bid failed, bidder loses a die
                nextState.loserId = prevBid.playerId;
                nextState.revealData.reason = `Bid failed! Only found ${totalFound}x ${targetFace}s. ${room.players[prevBid.playerId]?.name || 'Someone'} loses a die.`;
            } else {
                // Bid succeeded, doubter loses a die
                nextState.loserId = playerId;
                nextState.revealData.reason = `Bid succeeded! Found ${totalFound}x ${targetFace}s. ${room.players[playerId]?.name || 'Someone'} loses a die.`;
            }
        } else if (action.type === 'CACHITO_MATCH') {
            if (totalFound === prevBid.quantity) {
                // Exactly matched: previous bidder loses a die (can be custom rules)
                nextState.loserId = prevBid.playerId;
                nextState.revealData.reason = `Exact match! Everyone else was right. ${room.players[prevBid.playerId]?.name || 'Someone'} loses a die.`;
            } else {
                // Not exact: caller loses a die
                nextState.loserId = playerId;
                nextState.revealData.reason = `Not exact! Found ${totalFound}x ${targetFace}s. ${room.players[playerId]?.name || 'Someone'} loses a die.`;
            }
        }

        if (nextState.loserId && room.players[nextState.loserId]) {
            room.players[nextState.loserId].diceCount = Math.max(0, room.players[nextState.loserId].diceCount - 1);
        }
    }

    if (action.type === 'CACHITO_NEXT_ROUND') {
        if (state.status !== 'RESOLVING') return room;

        // Re-roll dice for everyone still alive
        Object.values(room.players).forEach(p => {
            if (p.diceCount > 0) {
                p.dice = Array.from({ length: p.diceCount }, () => Math.floor(Math.random() * 6) + 1);
            }
        });

        nextState.status = 'BIDDING';
        nextState.currentBid = null;
        nextState.previousBid = null;

        const loserId = nextState.loserId;
        nextState.loserId = undefined;
        nextState.revealData = undefined;

        // Determine next turn: standard is the loser, unless they are eliminated, then the next alive player
        let nextTurnId = loserId || state.currentTurnId;
        if (!room.players[nextTurnId] || room.players[nextTurnId].diceCount === 0) {
            nextTurnId = getNextTurnId(nextTurnId, room.playerOrder, room.players, true);
        }
        nextState.currentTurnId = nextTurnId;

        // Check if Obligado (starting player has exactly 1 die)
        const startingPlayer = room.players[nextState.currentTurnId];
        nextState.isObligado = startingPlayer ? startingPlayer.diceCount === 1 : false;

        room.gameState = nextState;
        return room;
    }

    room.gameState = nextState;
    return room;
}

function handleGeneral(room: Room, playerId: string, action: PlayerAction): Room {
    const state = room.gameState as GeneralState;
    const nextState: GeneralState = { ...state };

    if (action.type === 'GENERAL_USE_THUMB') {
        if (validateUseThumb(room.players[playerId])) {
            room.players[playerId].isThumbMaster = false;
            nextState.activeThumbRace = true;
            nextState.thumbRaceParticipants = [];
        }
        room.gameState = nextState;
        return room;
    }

    if (action.type === 'GENERAL_THUMB_RACE_CLICK') {
        if (state.activeThumbRace && !state.thumbRaceParticipants?.includes(playerId)) {
            nextState.thumbRaceParticipants = [...(nextState.thumbRaceParticipants || []), playerId];

            // Validate all currently connected players (excluding the triggerer) have clicked
            const activePlayers = room.playerOrder.filter(pid =>
                room.players[pid].connectionState === 'CONNECTED'
            );

            if (nextState.thumbRaceParticipants.length >= activePlayers.length - 1) {
                const loserId = activePlayers.find(pid => !nextState.thumbRaceParticipants?.includes(pid)) || playerId;
                // Race finished! Revert state.
                nextState.activeThumbRace = false;
            }
        }
        room.gameState = nextState;
        return room;
    }

    if (action.type === 'GENERAL_MAKE_RULE') {
        if (state.rollPending && state.lastRoll === 6 && state.currentTurnId === playerId && !state.ruleTieBreaker) {
            nextState.activeRule = action.rule;
            nextState.rollPending = false;
        }
        room.gameState = nextState;
        return room;
    }

    if (action.type === 'GENERAL_SUGGEST_RULE') {
        if (state.ruleTieBreaker && state.ruleTieBreaker.tiedGenerals.includes(playerId)) {
            nextState.ruleTieBreaker = { ...state.ruleTieBreaker, suggestions: { ...state.ruleTieBreaker.suggestions, [playerId]: action.rule } };
        }
        room.gameState = nextState;
        return room;
    }

    if (action.type === 'GENERAL_VOTE_RULE') {
        if (state.ruleTieBreaker && state.ruleTieBreaker.suggestions[action.targetId]) {
            nextState.ruleTieBreaker = { ...state.ruleTieBreaker, votes: { ...state.ruleTieBreaker.votes, [playerId]: action.targetId } };

            const activePlayers = room.playerOrder.filter(pid => room.players[pid].connectionState === 'CONNECTED');

            // Check if everyone has voted
            if (Object.keys(nextState.ruleTieBreaker.votes).length >= activePlayers.length) {
                // Tally 
                const counts: Record<string, number> = {};
                let maxVotes = 0;
                Object.values(nextState.ruleTieBreaker.votes).forEach(vote => {
                    counts[vote] = (counts[vote] || 0) + 1;
                    if (counts[vote] > maxVotes) maxVotes = counts[vote];
                });

                const winners = Object.keys(counts).filter(k => counts[k] === maxVotes);
                let winningGeneralId = winners[0];

                if (winners.length > 1 || winners.length === 0) {
                    const fallbackArray = winners.length > 0 ? winners : state.ruleTieBreaker.tiedGenerals;
                    winningGeneralId = fallbackArray[Math.floor(Math.random() * fallbackArray.length)];
                }

                nextState.activeRule = state.ruleTieBreaker.suggestions[winningGeneralId];
                nextState.ruleTieBreaker = null;
                nextState.rollPending = false;
            }
        }
        room.gameState = nextState;
        return room;
    }

    // Turn checks
    if (state.currentTurnId !== playerId && action.type !== 'GENERAL_GAME_END') {
        return room;
    }

    if (action.type === 'GENERAL_ROLL_DICE') {
        if (state.rollPending) return room;

        // Simulate dice roll (to be replaced with deterministic/injected seed if completely pure architecture is enforced outside)
        const roll = Math.floor(Math.random() * 6) + 1;
        nextState.lastRoll = roll;
        nextState.lastRollerId = playerId;

        if (roll === 6) {
            room.players[playerId].generalLevel += 1;

            const maxLevel = Math.max(...Object.values(room.players).map(p => p.generalLevel));
            const tiedGenerals = Object.values(room.players).filter(p => p.generalLevel === maxLevel).map(p => p.id);

            // Is the roller part of the top tier now?
            if (maxLevel === room.players[playerId].generalLevel) {
                if (tiedGenerals.length > 1) {
                    nextState.rollPending = true;
                    nextState.ruleTieBreaker = {
                        tiedGenerals,
                        suggestions: {},
                        votes: {}
                    };
                } else {
                    nextState.rollPending = true; // Single general makes rule
                }
            } else {
                nextState.rollPending = false; // Just regular extra turn for lower levels
            }
        } else if (roll === 5) {
            nextState.rollPending = true; // Wait for HOST to end mini-game
        } else if (roll === 4) {
            room.players[playerId].isThumbMaster = true;
            nextState.currentTurnId = getNextTurnId(playerId, room.playerOrder, room.players);
        } else if (roll === 3) {
            nextState.currentTurnId = getNextTurnId(playerId, room.playerOrder, room.players);
        } else if (roll === 2) {
            nextState.rollPending = true; // Wait for roller to choose target player
        } else if (roll === 1) {
            room.players[playerId].generalLevel = 0;
            nextState.currentTurnId = getNextTurnId(playerId, room.playerOrder, room.players);
        }
    }

    if (action.type === 'GENERAL_CHOOSE_PLAYER') {
        if (state.rollPending && state.lastRoll === 2) {
            nextState.rollPending = false;
            nextState.currentTurnId = getNextTurnId(playerId, room.playerOrder, room.players);
        }
    }

    if (action.type === 'GENERAL_GAME_END') {
        // Only host can end a 5 roll
        if (state.rollPending && state.lastRoll === 5 && room.hostId === playerId) {
            nextState.rollPending = false;
            nextState.currentTurnId = getNextTurnId(state.currentTurnId, room.playerOrder, room.players);
        }
    }

    room.gameState = nextState;
    return room;
}
