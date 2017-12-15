import { createInterface } from 'readline';

function ask(question: string): Promise<string> {
  return new Promise((resolve, _reject) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer: string) => {
      resolve(answer);
      rl.close();
    });
  });
}

type Rank = number;
type Card = string;
const CARDS: Array<Card> = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'
];
const RANKS: {[card: string]: Rank} = {};
for (let rank = 0; rank < CARDS.length; rank++) {
  RANKS[CARDS[rank]] = rank;
}

type Kingdom = Array<Effect>;

type Supply = Array<{
  name: string,
  counts: Array<number>,
}>;

type GameState = {
  hands: Array<Array<Card>>,
  supply: Supply,
  play: Array<Array<Card>>,
  kingdom: Array<string>,
  turn: number,
};

type Player = number;

type Effect = {
  name: string,
  desc: string,
  max_rank?: Card,
  min_rank?: Card,
  fn?: (state: GameState) => Promise<void>,
};

const EFFECTS_ARRAY: Array<Effect> = [];
const EFFECTS: {[name: string]: Effect} = {};
function registerEffect(effect: Effect) {
  EFFECTS_ARRAY.push(effect);
  EFFECTS[effect.name] = effect;
}

function getKingdom(): Kingdom {
  let used: {[key: string]: boolean} = {};
  const kingdom: Kingdom = [];
  for (let rank = 0; rank < 13; rank++) {
    let effect: Effect;
    let index: number;
    while (true) {
      index = Math.floor(EFFECTS_ARRAY.length * Math.random());
      if (used[index]) { continue; }
      effect = EFFECTS_ARRAY[index];
      if (effect.min_rank && rank < RANKS[effect.min_rank]) { continue; }
      if (effect.max_rank && rank > RANKS[effect.max_rank]) { continue; }
      break;
    }
    used[index] = true;
    kingdom.push(effect);
    console.log(`${CARDS[rank]}: ${effect.desc}`)
  }
  return kingdom;
}

function gainCard(state: GameState, player: Player, card: Card) {
  const cardSupply = state.supply[RANKS[card] - 1];
  if (cardSupply.counts[player] > 0) {
    cardSupply.counts[player] = cardSupply.counts[player] - 1;
    state.hands[player].push(card);
  }
}

interface Strategy {
  play(gameState: GameState, player: number): Promise<Array<Card>>;
  buy(gameState: GameState, player: number): Promise<Array<Card>>;
}

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

async function main(strats: Array<Strategy>) {
  const nplayers = strats.length;
  const kingdom: Kingdom = getKingdom();
  const state: GameState = {
    turn: 0,
    hands: [],
    supply: [],
    play: [],
    kingdom: kingdom.map((effect) => effect.name),
  };

  kingdom.forEach((effect) => {
    let counts: Array<number> = [];
    for (let player = 0; player < nplayers; player++) {
      counts.push(2);
    }
    state.supply.push({
      name: effect.name,
      counts: counts,
    });
  });
  for (let player = 0; player < nplayers; player++) {
    state.hands.push([]);
    state.play.push([]);
    gainCard(state, player, 'A');
    supply.push();
  }

  const history = [];

  let turn = 1;
  while (true) {
    if (gameEnded(state)) {
      break;
    }

    history.push({
      turn: turn,
      state: JSON.parse(JSON.stringify(state)),
    });

    console.log(`Turn ${turn} ended`);
    console.log('-----------------------------------');
    turn++;
  }

  // showState(state, true);
  console.log('GAME LOG: ', JSON.stringify(history, null, 2));
}

registerEffect({
  name: `REPRODUCE`,
  desc: `
  If you played only one reproduce, gain a copy of your lowest rank play.
  If you played two, return one reproduce to hand after promotion.
  `,
  max_rank: 'A',
});
registerEffect({
  name: `SOLITUDE`,
  desc: `
  For each rank your opponent has a pair of in play, they return one of each to hand.
  If you played two solitudes, they return both to hand.
  `,
  max_rank: 'A',
});
registerEffect({
  name: `REVOLUTION`,
  desc: `
  If your opponent has a Q, or K in play, and you have played two of these, you win.
  `,
  max_rank: 'A',
});
registerEffect({
  name: `STREAK`,
  desc: `
  If you have any streaks of 3 consecutively ranked cards in play, gain a T.
  `,
  max_rank: 'A',
});
registerEffect({
  name: `MATCHMAKER`,
  desc: `
  Gain a copy of the lowest rank card for which you have exactly one copy in play.
  If you played two, gain a copy of all cards of rank T or less for which you have exactly one copy in play.
  `,
  max_rank: 'A',
});
registerEffect({
  name: `DUPLICATE`,
  desc: `
  Gain a copy of the highest ranked card you have in play.
  `,
  min_rank: '2',
  max_rank: '4',
});
registerEffect({
  name: `REGULATOR`,
  desc: `
  If your opponent has more than 3 cards in play, they return all in-play cards to hand.
  `,
  min_rank: '2',
  max_rank: '4',
});
registerEffect({
  name: `MATHEMATICIAN`,
  desc: `
  If you have N cards in play and 1 mathematician in play, gain the card N.
  If you have N cards in play and 2 mathematicians in play, gain the card 2N.
  `,
  min_rank: '2',
  max_rank: '4',
});
registerEffect({
  name: `STAR`,
  desc: `
  If your opponent played any 5s, promote them in-place.
  `,
  min_rank: '2',
  max_rank: '4',
});
registerEffect({
  name: `LUCKY STAR`,
  desc: `
  If you have a 7 in play, gain a 5 to hand.
  `,
  min_rank: '2',
  max_rank: '4',
});
registerEffect({
  name: `JESTER`,
  desc: `
  If you have at least 3 distinct cards in play, gain a J to hand.
  `,
  min_rank: '2',
  max_rank: '4',
});
registerEffect({
  name: `UNION`,
  desc: `
  If you have exactly 2 cards in play, return them to supply and receive a J.
  `,
  min_rank: '2',
  max_rank: '4',
});
registerEffect({
  name: `BOREDOM`,
  desc: `
  If your opponent has no cards in play, you lose the game.
  `,
  min_rank: '2',
  max_rank: '4',
});
registerEffect({
  name: `CONTRARIAN`,
  desc: `
  If you played two contrarians, one of them promotes to the card of lower rank instead of higher.
  `,
  min_rank: '5',
  max_rank: '7',
});
registerEffect({
  name: `FOLLOWER`,
  desc: `
  Take your highest rank card in play.  Promote them in-place once, if you played one followers, or twice if you played two.
  `,
  min_rank: '5',
  max_rank: '7',
});
registerEffect({
  name: `POLICE`,
  desc: `
  If your opponent has more than 2 cards in play, they return all in-play cards to hand.
  `,
  min_rank: '5',
  max_rank: '7',
});
registerEffect({
  name: `TEAMMATE`,
  desc: `
  If you played two of these, promote both twice.
  `,
  min_rank: '5',
  max_rank: '7',
});
registerEffect({
  name: `LONER`,
  desc: `
  If you played exactly one of these, promote it twice.
  `,
  min_rank: '5',
  max_rank: '7',
});
registerEffect({
  name: `COPYCAT`,
  desc: `
  If your opponent did not play copycat, choose an effect of a higher ranked card.
  Your copycats play as that.
  `,
  min_rank: '5',
  max_rank: '7',
});
registerEffect({
  name: `MILITARY`,
  desc: `
  If your opponent has more than 1 card in play, they return all in-play cards to hand.
  `,
  min_rank: '8',
  max_rank: 'T',
});
registerEffect({
  name: `GIFT`,
  desc: `
  If you played 1 gift, receive a 2, 3, and 4.  If you played 2, receive a 5, 6, and 7.
  `,
  min_rank: '8',
  max_rank: 'T',
});
registerEffect({
  name: `ASSASSIN`,
  desc: `
  If you played 1 assassin, and your opponent has a J in play, they return it to the supply.
  If you played 2 assassins, and your opponent has a K or Q in play, they return it to the supply.
  `,
  min_rank: '8',
  max_rank: 'T',
});
registerEffect({
  name: `WAR`,
  desc: `
  For each war your opponent played, a war does not get promoted.
  If you played more war than your opponent, if your opponent as a K or Q in play,
  `,
  min_rank: '8',
  max_rank: 'T',
});
registerEffect({
  name: `HERO`,
  desc: `
  Reveal your hand.  If your highest ranked card can be promoted, promote it as if were just played.
  Hero still gets promoted.
  `,
  min_rank: '8',
  max_rank: 'T',
});
registerEffect({
  name: `NEPOTIST`,
  desc: `
  Reveal your hand.  Replace an A with a nepotist from supply, if you can.
  `,
  min_rank: '8',
  max_rank: 'T',
});
registerEffect({
  name: `EXECUTE`,
  desc: `
  If your opponent has 2 copies of any cards in supply, permanently trash one copy of the card of lowest rank.
  `,
  min_rank: 'J',
  max_rank: 'K',
});
registerEffect({
  name: `ASTRONOMER`,
  desc: `
  Gain a 5 and 10 to hand.
  `,
  min_rank: 'J',
  max_rank: 'K',
});
registerEffect({
  name: `FLOURISH`,
  desc: `
  For the lowest rank with non-empty supply, gain all copies from supply to hand.
  `,
  min_rank: 'J',
  max_rank: 'K',
});
// PHILANTHROPER

main([manualStrat]).catch((e: Error) => console.log('ERROR!', e));
