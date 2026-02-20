import { Room, reduceRoomState, PlayerAction, Player } from './logic/gameEngine';

function createMockRoom(): Room {
    const p1: Player = { id: 'P1', name: 'Alice', connectionState: 'CONNECTED', generalLevel: 0, isThumbMaster: false, dice: [2, 2, 5, 4, 1], diceCount: 5 };
    const p2: Player = { id: 'P2', name: 'Bob', connectionState: 'CONNECTED', generalLevel: 0, isThumbMaster: false, dice: [3, 4, 6, 2, 1], diceCount: 5 };
    const p3: Player = { id: 'P3', name: 'Charlie', connectionState: 'CONNECTED', generalLevel: 0, isThumbMaster: false, dice: [5, 5, 2, 3, 4], diceCount: 5 };

    return {
        id: 'TEST1',
        hostId: 'P1',
        players: { P1: p1, P2: p2, P3: p3 },
        playerOrder: ['P1', 'P2', 'P3'],
        currentGame: 'CACHITO',
        gameState: {
            status: 'BIDDING',
            currentTurnId: 'P1',
            currentBid: null,
            previousBid: null,
            isObligado: false
        },
        createdAt: Date.now()
    };
}

let room = createMockRoom();

function dispatch(action: PlayerAction, actingPlayerId: string) {
    console.log(`\n--- Action: ${action.type} by ${actingPlayerId} ---`);
    if ('quantity' in action) {
        console.log(`Bid: ${action.quantity}x ${action.faceValue} (Aces: ${action.isAces})`);
    }

    const previousTurnId = (room.gameState as any).currentTurnId;
    const newState = reduceRoomState(room, action, actingPlayerId);

    // Check if state actually changed reference
    if (newState === room) {
        console.error("❌ STATE DID NOT CHANGE! Action rejected or invalid turn.");
        console.log("Current Turn:", previousTurnId, "Acting Player:", actingPlayerId);
        if ('quantity' in action) {
            console.log("Current Bid:", (room.gameState as any).currentBid);
            console.log("Tried Bid:", action);
        }
    } else {
        console.log("✅ State updated.");
        room = newState;
        console.log("New Status:", (room.gameState as any).status);
        console.log("Next Turn:", (room.gameState as any).currentTurnId);
        console.log("Current Bid:", (room.gameState as any).currentBid);
        if ((room.gameState as any).revealData) {
            console.log("Reveal Reason:", (room.gameState as any).revealData.reason);
        }
    }
}

console.log("Starting Test Flow...");
dispatch({ type: 'CACHITO_BID', quantity: 2, faceValue: 2, isAces: false }, 'P1');
dispatch({ type: 'CACHITO_BID', quantity: 3, faceValue: 2, isAces: false }, 'P2');
dispatch({ type: 'CACHITO_BID', quantity: 4, faceValue: 3, isAces: false }, 'P3');
dispatch({ type: 'CACHITO_BID', quantity: 2, faceValue: 1, isAces: true }, 'P1');
dispatch({ type: 'CACHITO_DOUBT' }, 'P2');

console.log("\nAttempting CACHITO_NEXT_ROUND with P1 (should fail):");
dispatch({ type: 'CACHITO_NEXT_ROUND' }, 'P1');

console.log("\nAttempting CACHITO_NEXT_ROUND with P2 (should succeed):");
dispatch({ type: 'CACHITO_NEXT_ROUND' }, 'P2');
