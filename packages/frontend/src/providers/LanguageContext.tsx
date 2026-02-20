'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, variables?: Record<string, string | number>) => string;
}

const translations = {
    en: {
        // Lobby
        'lobby.welcome': 'Welcome back.',
        'lobby.subtitle': 'Enter your nickname to join the party.',
        'lobby.nicknamePlaceholder': 'Your Nickname',
        'lobby.joinGame': 'Join a Game',
        'lobby.roomCodePlaceholder': 'Enter 6-char Code',
        'lobby.joinButton': 'Join Party',
        'lobby.hostGame': 'Host New Party',
        'lobby.createRoom': 'Create Room',
        'lobby.createRoomDesc': 'Gather your friends and pick a game inside.',
        'lobby.rules': 'Game Rules',

        // Header
        'header.back': 'Back',
        'header.room': 'Room',
        'header.players': 'Players',
        'header.away': 'Away',
        'header.host': 'Host',
        'header.rules': 'Rules',

        // Rules
        'rules.title': 'Game Rules',
        'rules.higherLower': 'Higher or Lower',
        'rules.cachito': 'Cachito',
        'rules.general': 'General',
        'rules.close': 'Close',

        // Higher Lower Rules
        'hl.rule1': '1. Roles: One player is the "Holder", another is the "Guesser".',
        'hl.rule2': '2. First Attempt: The Guesser guesses the EXACT value of the next card (Aces=1, Kings=13).',
        'hl.rule3': '3. If Correct on Attempt 1: The Holder drinks a FULL cup!',
        'hl.rule4': '4. If Incorrect on Attempt 1: The Guesser gets a hint (Higher or Lower) for a second attempt.',
        'hl.rule5': '5. Second Attempt: If the Guesser is correct, the Holder drinks a HALF cup.',
        'hl.rule6': '6. If Incorrect on Attempt 2: The Guesser sips an amount equal to the numerical difference between their guess and the actual card.',
        'hl.rule7': '7. Rotation: After a resolved card, the Guesser role rotates. Once it makes a full circle, the Holder role passes.',

        // Cachito Rules
        'ca.rule1': '1. Setup: Each player rolls 5 dice and keeps them hidden.',
        'ca.rule2': '2. Bidding: Players bid on the total quantity of a specific die face across all players (e.g. "Five 3s").',
        'ca.rule3': '3. Wildcards (Pacos): 1s are wildcards and count as any face, UNLESS the bid is specifically on 1s.',
        'ca.rule4': '4. Raising a Bid: You can increase the quantity (any face value), OR keep the same quantity and increase the face value.',
        'ca.rule5': '5. Raising to/from Aces: You can halve the quantity (rounded up) to bid on 1s. To go from 1s to normal numbers, you must more than double the quantity [ (Quantity * 2) + 1 ].',
        'ca.rule6': '6. Doubting: If you challenge (Doubt) and the total dice on the table is LESS than the bid, the bidder loses a die. If the bid was met, the challenger loses a die.',
        'ca.rule7': '7. Matching: If you call Match and the total exactly matches the bid, the previous bidder loses a die. If not exact, you lose a die.',
        'ca.rule8': '8. Obligado Phase: Triggered when any player reaches 1 die. In Obligado, 1s are NO LONGER wild, you cannot bid on 1s, and you can only raise by increasing the quantity (face value must stay the same as previous bid).',

        // General Rules
        'gen.rule1': '1. Setup: Players take turns rolling a SINGLE 6-sided die.',
        'gen.rule2': '2. Roll Actions:',
        'gen.rule3': '  • Roll 1: Your General Level resets to 0.',
        'gen.rule4': '  • Roll 2: You pick another player to drink.',
        'gen.rule5': '  • Roll 3: Pass turn (Drink?).',
        'gen.rule6': '  • Roll 4: You become the Thumb Master. At any time, use your ability to start a Thumb Race. The last person to join loses!',
        'gen.rule7': '  • Roll 5: Minigame! The Host leads a minigame (categories, never have I ever) until the Host ends it.',
        'gen.rule8': '  • Roll 6: You gain +1 General Level. The highest level General creates a Global Rule. If there is a tie for the highest level, tied Generals suggest rules and the room votes!',

        // Room Waiting
        'room.code': 'Room Code',
        'room.playersJoined': '{count} players joined',
        'room.turnOrder': 'Turn Order',
        'room.roomHost': 'Room Host',
        'room.singlePlayerTools': 'Single Player Tools',
        'room.soloMode': 'Solo Mode',
        'room.pickGame': 'Pick a game to start',
        'room.waitingForHost': 'Waiting for host to start...',

        // Game 1: Higher Lower UI
        'hl.yourTurn': 'Your Turn to Guess!',
        'hl.isGuessing': '{name} is guessing...',
        'hl.holder': 'Holder',
        'hl.cards': 'Cards: {count}',
        'hl.attempt': 'Attempt {num}/2',
        'hl.incorrectHint': '❌ Incorrect! The card is {hint}!',
        'hl.lastCard': 'Last Card',
        'hl.current': 'Current',
        'hl.selectGuess': 'Select your guess',
        'hl.youAreHolder': 'You are the Holder. Watch them sweat!',
        'hl.waitingForGuess': 'Waiting for guess...',
        'hl.1stTryWin': '1st Try Win!',
        'hl.guess': 'Guess:',
        'hl.card': 'Card:',
        'hl.holderDrinks': 'Holder drinks their ',
        'hl.fullCup': 'FULL cup!',
        'hl.2ndTryWin': '2nd Try Win!',
        'hl.halfCup': 'HALF cup.',
        'hl.incorrect': 'Incorrect',
        'hl.tryAgain': 'Try again using the Hint!',
        'hl.ouch': 'Ouch!',
        'hl.guesserSips': 'Guesser sips',
        'hl.times': 'times!',
        'hl.gotIt': 'Got It',
        'hl.empty': 'Empty',

        // Game 2: Cachito UI
        'ca.yourTurn': 'Your Turn!',
        'ca.isTurn': "{name}'s Turn",
        'ca.currentBid': 'Current Highest Bid',
        'ca.noBids': 'No bids yet',
        'ca.raiseBid': 'Raise Bid',
        'ca.doubt': 'Doubt (Dudo)',
        'ca.match': 'Match (Calzo)',
        'ca.quantity': 'Quantity',
        'ca.faceValue': 'Face Value',
        'ca.confirmBid': 'Confirm Bid',
        'ca.roundOver': 'Round Over!',
        'ca.nextRound': 'Next Round',
        'ca.pressHold': 'PRESS & HOLD TO PEEK',
        'ca.keepHidden': 'Keep hidden from other players',
        'ca.noDice': 'You have no dice left!',

        // Game 3: General UI
        'gen.yourTurn': 'Your Turn to Roll!',
        'gen.isRolling': '{name} is rolling...',
        'gen.standoff': 'General Standoff!',
        'gen.tiedPower': 'Multiple generals are tied in power!',
        'gen.suggestRule': 'Suggest a rule...',
        'gen.submitSuggestion': 'Submit Suggestion',
        'gen.waitingSuggest': 'Waiting for tied Generals to suggest...',
        'gen.voteRule': 'Vote for the best rule:',
        'gen.sRule': "{name}'s Rule:",
        'gen.waitingVote': 'Waiting for others to vote...',
        'gen.levelUp': 'General Level Up!',
        'gen.decreeRule': 'You rolled a 6! You are the highest General. Decree a new rule.',
        'gen.rulePlaceholder': 'e.g. No pointing with fingers...',
        'gen.decreeSubmit': 'Decree Rule & Roll Again',
        'gen.waitingFor': 'Waiting for {name} to decree a rule...',
        'gen.minigame': 'Mini-Game Time!',
        'gen.minigameDesc': 'Put down the phones. The Host will allow the game to proceed once real-world rules are met.',
        'gen.proceed': 'Wait over. Proceed Next Turn.',
        'gen.waitingHost': 'Waiting for host...',
        'gen.chooseTarget': 'Choose a target!',
        'gen.roll': 'ROLL',
        'gen.actionPending': 'Action Pending',
        'gen.gameLog': 'Game Log',
        'gen.activeEffects': 'Active Effects',
        'gen.rankings': 'General Rankings',
        'gen.level': 'Level',
        'gen.thumbMasters': 'Thumb Masters',
        'gen.pending': 'pending...',
        'gen.noThumb': 'No active thumb masters',
        'gen.activeDecree': 'Active Decree',
        'gen.clickFast': 'CLICK\nFAST!',
    },
    es: {
        // Lobby
        'lobby.welcome': 'Bienvenido de nuevo.',
        'lobby.subtitle': 'Ingresa tu apodo para unirte a la fiesta.',
        'lobby.nicknamePlaceholder': 'Tu Apodo',
        'lobby.joinGame': 'Unirse a un Juego',
        'lobby.roomCodePlaceholder': 'Ingresa el código de 6 letras',
        'lobby.joinButton': 'Unirse',
        'lobby.hostGame': 'Crear Nueva Fiesta',
        'lobby.createRoom': 'Crear Sala',
        'lobby.createRoomDesc': 'Reúne a tus amigos y elige un juego adentro.',
        'lobby.rules': 'Reglas del Juego',

        // Header
        'header.back': 'Volver',
        'header.room': 'Sala',
        'header.players': 'Jugadores',
        'header.away': 'Ausente',
        'header.host': 'Anfitrión',
        'header.rules': 'Reglas',

        // Rules
        'rules.title': 'Reglas del Juego',
        'rules.higherLower': 'Mayor o Menor',
        'rules.cachito': 'Cachito',
        'rules.general': 'General',
        'rules.close': 'Cerrar',

        // Higher Lower Rules
        'hl.rule1': '1. Roles: Un jugador es el "Repartidor" y otro el "Adivinador".',
        'hl.rule2': '2. Primer Intento: El Adivinador adivina el valor EXACTO de la siguiente carta (Ases=1, Reyes=13).',
        'hl.rule3': '3. Si Adivina a la Primera: ¡El Repartidor bebe una copa entera!',
        'hl.rule4': '4. Si Falla a la Primera: El Adivinador recibe una pista (Mayor o Menor) para un segundo intento.',
        'hl.rule5': '5. Segundo Intento: Si adivina correctamente, el Repartidor bebe media copa.',
        'hl.rule6': '6. Si Falla a la Segunda: El Adivinador bebe un número de sorbos igual a la diferencia numérica entre su suposición y la carta real.',
        'hl.rule7': '7. Rotación: Después de resolver una carta, el rol de Adivinador rota. Cuando da la vuelta completa, cambia el Repartidor.',

        // Cachito Rules
        'ca.rule1': '1. Inicio: Cada jugador tira 5 dados y los mantiene ocultos bajo el cacho.',
        'ca.rule2': '2. Apuestas: Los jugadores apuestan sobre la cantidad total de una cara en la mesa (ej. "Cinco 3s").',
        'ca.rule3': '3. Comodines (Pacos): Los 1s son comodines y cuentan como cualquier cara, A MENOS que se apueste específicamente por ellos.',
        'ca.rule4': '4. Subir Apuesta: Puedes subir la cantidad (cualquier cara) O mantener la misma cantidad y subir el valor de la cara.',
        'ca.rule5': '5. Subir de/a Ases: Puedes reducir a la mitad la cantidad (redondeo hacia arriba) para apostar Ases. Para volver a números, debes apostar el doble más uno [ (Cant * 2) + 1 ].',
        'ca.rule6': '6. Dudar: Si dudas y la mesa tiene MENOS dados que la apuesta, el apostador pierde un dado. Si se cumplió, pierdes tú.',
        'ca.rule7': '7. Calzar: Si dices Calzo y la cantidad es EXACTA, el apostador anterior pierde un dado. Si no es exacta, pierdes tú.',
        'ca.rule8': '8. Obligado: Se activa cuando alguien queda con 1 dado. Los 1s YA NO son comodines, no se puede apostar por 1s, y solo puedes subir aumentando la cantidad (el valor de la cara debe ser el mismo que la apuesta anterior).',

        // General Rules
        'gen.rule1': '1. Inicio: Los jugadores se turnan para tirar UN SOLO dado de 6 caras.',
        'gen.rule2': '2. Efecto de los Tiros:',
        'gen.rule3': '  • Sacar 1: Tu Nivel de General vuelve a 0.',
        'gen.rule4': '  • Sacar 2: Eliges a otro jugador para que beba.',
        'gen.rule5': '  • Sacar 3: Pasas el turno (¿Bebes tú?).',
        'gen.rule6': '  • Sacar 4: Eres el Señor del Pulgar. Usa el botón en cualquier momento para iniciar una Carrera de Pulgares. ¡El último en unirse pierde!',
        'gen.rule7': '  • Sacar 5: ¡Minijuego! El Anfitrión lidera un minijuego (ej. cultura chupística, yo nunca nunca) hasta que decida terminarlo.',
        'gen.rule8': '  • Sacar 6: Subes +1 Nivel de General. ¡El General de mayor nivel crea una Regla Global! Si hay empate, los Generales empatados sugieren reglas y la sala vota la ganadora.',

        // Room Waiting
        'room.code': 'Código de Sala',
        'room.playersJoined': '{count} jugadores unidos',
        'room.turnOrder': 'Orden de Turnos',
        'room.roomHost': 'Anfitrión de Sala',
        'room.singlePlayerTools': 'Herramientas de un Jugador',
        'room.soloMode': 'Modo Solitario',
        'room.pickGame': 'Elige un juego para empezar',
        'room.waitingForHost': 'Esperando que el anfitrión empiece...',

        // Game 1: Higher Lower UI
        'hl.yourTurn': '¡Tu Turno de Adivinar!',
        'hl.isGuessing': '{name} está adivinando...',
        'hl.holder': 'Repartidor',
        'hl.cards': 'Cartas: {count}',
        'hl.attempt': 'Intento {num}/2',
        'hl.incorrectHint': '❌ ¡Incorrecto! La carta es {hint}!',
        'hl.lastCard': 'Última Carta',
        'hl.current': 'Actual',
        'hl.selectGuess': 'Selecciona tu carta',
        'hl.youAreHolder': 'Eres el Repartidor. ¡Míralos sudar!',
        'hl.waitingForGuess': 'Esperando la carta...',
        'hl.1stTryWin': '¡Ganaste a la Primera!',
        'hl.guess': 'Adivinó:',
        'hl.card': 'Carta:',
        'hl.holderDrinks': 'El Repartidor bebe ',
        'hl.fullCup': '¡Toda su copa!',
        'hl.2ndTryWin': '¡Ganaste a la Segunda!',
        'hl.halfCup': 'Media copa.',
        'hl.incorrect': 'Incorrecto',
        'hl.tryAgain': '¡Inténtalo de nuevo con la pista!',
        'hl.ouch': '¡Ay!',
        'hl.guesserSips': 'El Adivinador bebe',
        'hl.times': 'sorbos!',
        'hl.gotIt': 'Entendido',
        'hl.empty': 'Vacío',

        // Game 2: Cachito UI
        'ca.yourTurn': '¡Tu Turno!',
        'ca.isTurn': "El turno de {name}",
        'ca.currentBid': 'Apuesta Actual Mayor',
        'ca.noBids': 'Sin apuestas aún',
        'ca.raiseBid': 'Subir Apuesta',
        'ca.doubt': 'Dudo',
        'ca.match': 'Calzo',
        'ca.quantity': 'Cantidad',
        'ca.faceValue': 'Cara',
        'ca.confirmBid': 'Confirmar Apuesta',
        'ca.roundOver': '¡Fin de la Ronda!',
        'ca.nextRound': 'Siguiente Ronda',
        'ca.pressHold': 'MANTÉN PRESIONADO PARA MIRAR',
        'ca.keepHidden': 'Mantenlo oculto de los demás',
        'ca.noDice': '¡No te quedan dados!',

        // Game 3: General UI
        'gen.yourTurn': '¡Tu Turno de Tirar!',
        'gen.isRolling': '{name} está tirando...',
        'gen.standoff': '¡Empate de Generales!',
        'gen.tiedPower': '¡Múltiples generales tienen el mismo poder!',
        'gen.suggestRule': 'Sugiere una regla...',
        'gen.submitSuggestion': 'Enviar Sugerencia',
        'gen.waitingSuggest': 'Esperando que los Generales empatados sugieran...',
        'gen.voteRule': 'Vota por la mejor regla:',
        'gen.sRule': "Regla de {name}:",
        'gen.waitingVote': 'Esperando que otros voten...',
        'gen.levelUp': '¡General Sube de Nivel!',
        'gen.decreeRule': '¡Tiraste un 6! Eres el General más alto. Decreta una nueva regla.',
        'gen.rulePlaceholder': 'ej. Prohibido señalar con el dedo...',
        'gen.decreeSubmit': 'Decretar Regla y Volver a Tirar',
        'gen.waitingFor': 'Esperando a que {name} decrete una regla...',
        'gen.minigame': '¡Hora del Minijuego!',
        'gen.minigameDesc': 'Bajen los celulares. El anfitrión permitirá que el juego continúe cuando las reglas en el mundo real se cumplan.',
        'gen.proceed': 'Espera terminada. Siguiente Turno.',
        'gen.waitingHost': 'Esperando al anfitrión...',
        'gen.chooseTarget': '¡Elige un objetivo!',
        'gen.roll': 'TIRAR',
        'gen.actionPending': 'Acción Pendiente',
        'gen.gameLog': 'Registro del Juego',
        'gen.activeEffects': 'Efectos Activos',
        'gen.rankings': 'Ranking de Generales',
        'gen.level': 'Nivel',
        'gen.thumbMasters': 'Señores del Pulgar',
        'gen.pending': 'pendiente...',
        'gen.noThumb': 'No hay señores del pulgar',
        'gen.activeDecree': 'Regla Activa',
        'gen.clickFast': '¡DALE\nRÁPIDO!',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const storedLang = localStorage.getItem('partyGameLang');
        if (storedLang === 'en' || storedLang === 'es') {
            setLanguage(storedLang);
        } else {
            // Check browser language
            const browserLang = navigator.language.split('-')[0];
            if (browserLang === 'es') {
                setLanguage('es');
            }
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('partyGameLang', lang);
    };

    const t = (key: string, variables?: Record<string, string | number>): string => {
        const langDict = translations[language] as any;
        let text = langDict[key] || key;

        if (variables) {
            for (const [varKey, varValue] of Object.entries(variables)) {
                text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(varValue));
            }
        }

        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
