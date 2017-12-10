// start with, say, $10
// each turn, have, say, 1-5 actions
//
// decks are always visible to opponent
// each turn: 
//   - both players simultaneously play N cards face down.
//   - players get amount of money according to all cards played
//   - players buy any number of new cards, which go into deck
//
// four kinds:
//   - attack (red)
//   - culture (orange)
//   - money (yellow)
//   - resources (green)
//   - science (blue)
//   - law (purple)
//
// cards:
//   - +1 action +1 money
//   - upkeep (attack): your opponent pays $1 per 10 cards
//   - taxman (attack): for each money your opponent played, they get -$1 (but not less than 0)
//   - policeman (attack): for each attack your opponent played, they get -$1
//   - hacker (attack): 
//   - arts: 
//   - terrorist (attack): your opponent chooses an institution to trash
//     
//   - shield (attack): you're immune to all attacks
//   - looter (attack): remove a coin
//
//   - student (culture):
//     after actions are revealed but before effects, add student phase where for each student in play, play a card
//   - motivator (culture): 
//     for each non-motivator culture card in play, +$1
//   - cult (culture): 
//     
//
//   - factory (science): at the start of each turn, gain a 
//   - bank (science): at the start of each turn, gain the coin with base cost equal to the number of banks you have
//   - university (science): at the start of each turn, gain a science card
//   - automate (science): decrease all non-money costs by 1, except for the cost of automate
//   - engineer (science): +2 actions for your next turn
//
// win if:
//   - player buys victory tower, costs $100
// lose if:
//   - negative money on a turn
//   - no deck
// tie if:
//   - both players win on same turn
//   - both players lose on same turn
//
//
import { createInterface } from 'readline';

enum Card {
  COPPER = 0,
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
};
type PlayerState = {
  money: number,
  deck: {[key: number]: number},
  maxActions: number,
};

type GameState = {
  playerStates: Array<PlayerState>,
};

type MoneyEffect = {
  type: 'money',
  amount: number
};
type ActionEffect = {
  type: 'action',
  actionChange: number
};
type Effect = MoneyEffect | ActionEffect;

type CardImpl = {
  fn: (state: GameState) => Effect,
  isAttack?: boolean,
  description: string,
  cost: number,
};

const CardImpls: {[key: number]: CardImpl} = {
  [Card.COPPER]: {
    fn: (_state: GameState) => {
      return {
        type: 'money',
        amount: 1
      };
    },
    description: '+$1',
    cost: 0,
  },
  [Card.BRONZE]: {
    fn: (_state: GameState) => {
      return {
        type: 'money',
        amount: 3
      };
    },
    description: '+$3',
    cost: 1,
  },
  [Card.SILVER]: {
    fn: (_state: GameState) => {
      return {
        type: 'money',
        amount: 5
      };
    },
    description: '+$5',
    cost: 2,
  },
  [Card.GOLD]: {
    fn: (_state: GameState) => {
      return {
        type: 'money',
        amount: 7
      };
    },
    description: '+$7',
    cost: 3,
  },
  [Card.PLATINUM]: {
    fn: (_state: GameState) => {
      return {
        type: 'money',
        amount: 9
      };
    },
    description: '+$9',
    cost: 4,
  },
};

function applyEffects(effects: {[key: number]: Array<Effect>}, gameState: GameState): GameState {
  let newGameState = JSON.parse(JSON.stringify(gameState));
  for (const player in effects) {
    effects[player].forEach((effect) => {
      if (effect.type === 'money') {
        newGameState.playerStates[player].money += effect.amount;
      }
    });
  }
  return newGameState;
}

interface Strategy {
  play(gameState: GameState, player: number): Promise<Array<Card>>;
  buy(gameState: GameState, player: number): Promise<Array<Card>>;
}

async function gameLoop(strats: Array<Strategy>) {

  const n = strats.length;

  let turn = 0;
  let gameState: GameState = {
    playerStates: [],
  };
  for (let player = 0; player < n; player++) {
    gameState.playerStates.push({
      money: 0,
      deck: {
        [Card.COPPER]: 10,
      },
      maxActions: 5,
    });
  }

  while (true) {
    console.log(`---- Turn ${turn} ----`);
    let effects = {};
    for (let player = 0; player < n; player++) {
      const cards = await strats[player].play(gameState, player);
      if (cards.length > gameState.playerStates[player].maxActions) {
      }
      console.log('Playing cards', cards);
      let effects: Array<Effect> = [];
      cards.forEach((card) => {
        let effect = CardImpls[card].fn(gameState);
        effects.push(effect);
      });
      console.log('effects', effects);
    }
    gameState = applyEffects(effects, gameState);
    // console.log('total effect', totalEffect);
    for (let player = 0; player < n; player++) {
      const cards = await strats[player].buy(gameState, player);
      console.log('bought', cards);
    }
    turn++;
  }
}

const readLine = createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    readLine.question(question, resolve);
  });
};

const manualStrat: Strategy = {
  play: async function(gameState: GameState, player: number): Promise<Array<Card>> {
    let cards;
    while (true) {
      cards = (await ask('Play cards?')).split(' ').map(parseInt);
      if (cards.length > gameState.playerStates[player].maxActions) {
        console.log('Played too many actions');
        continue;
      }
      return cards;
    }
  },
  buy: async function(gameState: GameState, player: number): Promise<Array<Card>> {
    let cards;
    while (true) {
      cards = (await ask('Buy cards?')).split(' ').map(parseInt);
      if (cards.length > gameState.playerStates[player].maxActions) {
        console.log('Played too many actions');
        continue;
      }
      return cards;
    }
  }
}

gameLoop([manualStrat]);
