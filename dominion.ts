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

async function yesno(question: string) {
  while (true) {
    const result = (await ask(question)).toUpperCase();
    if (result === 'Y' || result === 'YES') {
      return true;
    }
    if (result === 'N' || result === 'NO') {
      return false;
    }
    console.log('Please respond Y or N');
  }
}

function shuffle<T>(array: Array<T>): Array<T> {
  let i = array.length;
  // While there remain elements to shuffle...
  while (i > 0) {
    const j = Math.floor(Math.random() * i);
    i -= 1;
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

type CardDef = {
  cost: number,
  debt?: number,
  _is_card?: true;
  _is_event?: false;
  treasure?: number,
  victory?: number,
  name: string
};

/*
interface ThingDef {
  is_card?: boolean;
  is_event?: boolean;
  name: string;
};
*/
type EventDef = {
  _is_card?: false;
  _is_event?: true;
  name: string;
  cost: number,
  debt?: number,
  effect: (state: State) => Promise<void>,
};

function isCard(card: CardDef | EventDef): card is CardDef {
    return !!card._is_card;
}
function isEvent(card: CardDef | EventDef): card is EventDef {
    return !!card._is_event;
}

const CARDS: {[card: string]: CardDef} = {};
function AddCard(def: CardDef): void {
  def._is_card = true;
  def._is_event = false;
  CARDS[def.name] = def;
}
AddCard({
  name: 'COPPER',
  cost: 0,
  treasure: 1,
});
AddCard({
  name: 'SILVER',
  cost: 3,
  treasure: 2,
});
AddCard({
  name: 'GOLD',
  cost: 6,
  treasure: 3,
});
AddCard({
  name: 'ESTATE',
  cost: 2,
  victory: 1,
});
AddCard({
  name: 'DUCHY',
  cost: 5,
  victory: 3,
});
AddCard({
  name: 'PROVINCE',
  cost: 8,
  victory: 6,
});
AddCard({
  name: 'CURSE',
  cost: 0,
});

type Card = string;
type State = {
  deck: Array<Card>,
  hand: Array<Card>,
  discard: Array<Card>,
  play: Array<Card>,
  trash: Array<Card>,
  buys: number,
  debt: number,
  borrowed: boolean,
  travelling_faired: boolean,
  money: number,
  minus_card_token: boolean,
  extra_draw: number,
  vp_tokens: number,
  gained_silvers: number,
  gained_cards: number,
  take_mission_turn: boolean,
  is_mission_turn: boolean,
  donated: boolean,
  // TODO: allow only one save
  saved: Array<Card>,
  supply_state: {
    [card: string]: {
      tax: number,
      supply: number
    },
  },
};

const EVENTS: {[card: string]: EventDef} = {};
function AddEvent(def: EventDef): void {
  def._is_card = false;
  def._is_event = true;
  EVENTS[def.name] = def;
}

AddEvent({
  name: 'BORROW',
  cost: 0,
  effect: async (state: State) => {
    if (state.borrowed) {
      console.log(`Can't borrow twice in one turn`);
      return;
    }
    state.borrowed = true;
    state.money = state.money + 1;
    state.minus_card_token = true;
    state.buys = state.buys + 1;
  }
});
AddEvent({
  name: 'EXPEDITION',
  cost: 3,
  effect: async (state: State) => {
    state.extra_draw = state.extra_draw + 2;
  }
});
AddEvent({
  name: 'MISSION',
  cost: 4,
  effect: async (state: State) => {
    state.take_mission_turn = true;
  }
});
AddEvent({
  name: 'SAVE',
  cost: 1,
  effect: async (state: State) => {
    state.buys = state.buys + 1;
    if (state.hand.length === 0) {
      return;
    }
    let saveIndex = -1;
    if (state.hand.length === 1) {
      saveIndex = 0;
    } else {
      while (true) {
        const card = await askCard(`Choose a card to save: `);
        if (!card) { continue; }
        saveIndex = findCard(state.hand, card.name);
        if (saveIndex > -1) {
          break;
        }
        console.log(`No such card in hand: ${state.hand.join(' ')}`);
      }
    }
    state.saved.push(state.hand.splice(saveIndex, 1)[0]);
  }
});
AddEvent({
  name: 'WEDDING',
  cost: 4,
  debt: 3,
  effect: async (state: State) => {
    state.vp_tokens = state.vp_tokens + 1;
    await gainCard(state, CARDS.GOLD);
  }
});
AddEvent({
  name: 'DOMINATE',
  cost: 14,
  effect: async (state: State) => {
    if (await gainCard(state, CARDS.PROVINCE)) {
      state.vp_tokens = state.vp_tokens + 9;
    }
  }
});
AddEvent({
  name: 'TAX',
  cost: 2,
  effect: async (state: State) => {
    while (true) {
      const card = await askCard(`Choose a card to tax: `);
      if (!card) { continue; }
      const supply_state = state.supply_state[card.name];
      if (!supply_state) {
        console.log(`${card.name} is not in the supply`);
        continue;
      }
      supply_state.tax = supply_state.tax + 2;
      break;
    }
  }
});
AddEvent({
  name: 'TRAVELLING_FAIR',
  cost: 2,
  effect: async (state: State) => {
    state.buys = state.buys + 2;
    state.travelling_faired = true;
  }
});
AddEvent({
  name: 'DONATE',
  cost: 0,
  debt: 8,
  effect: async (state: State) => {
    state.donated = true;
  }
});
AddEvent({
  name: 'DELVE',
  cost: 2,
  effect: async (state: State) => {
    state.buys = state.buys + 1;
    await gainCard(state, CARDS.SILVER);
  }
});
AddEvent({
  name: 'BONFIRE',
  cost: 3,
  effect: async (state: State) => {
    let trashed = 0;
    while (trashed < 2) {
      const card = await askCard(`Choose a card to trash: `);
      if (!card) { continue; }
      const index = findCard(state.play, card.name);
      if (index === -1) {
        console.log(`${card.name} is not in play: ${state.play.join(' ')}`);
        continue;
      }
      trashCard(state, state.play, index);
      trashed++;
    }
  }
});
AddEvent({
  name: 'WINDFALL',
  cost: 5,
  effect: async (state: State) => {
    if (state.deck.length === 0 && state.discard.length === 0) {
      await gainCard(state, CARDS.GOLD);
      await gainCard(state, CARDS.GOLD);
      await gainCard(state, CARDS.GOLD);
    }
  }
});
AddEvent({
  name: 'CONQUEST',
  cost: 6,
  effect: async (state: State) => {
    await gainCard(state, CARDS.SILVER);
    await gainCard(state, CARDS.SILVER);
    state.vp_tokens = state.vp_tokens + state.gained_silvers;
  }
});
AddEvent({
  name: 'TRIUMPH',
  cost: 0,
  debt: 5,
  effect: async (state: State) => {
    if (await gainCard(state, CARDS.ESTATE)) {
      state.vp_tokens = state.vp_tokens + state.gained_cards;
    }
  }
});
AddEvent({
  name: 'RITUAL',
  cost: 4,
  effect: async (state: State) => {
    if (await gainCard(state, CARDS.CURSE)) {
      if (!state.hand.length) {
        console.log('No card to trash');
      } else while (true) {
        const card = await askCard(`Choose a card to trash: `);
        if (!card) { continue; }
        let i = findCard(state.hand, card.name);
        if (i === -1) {
          console.log(`No ${card.name} in hand: ${state.hand.join(' ')}`);
          continue;
        }
        trashCard(state, state.hand, i);
        state.vp_tokens = state.vp_tokens + card.cost;
        break;
      }
    }
  }
});
AddEvent({
  name: 'SALT_THE_EARTH',
  cost: 4,
  // +1 vp, trash a victory card from the supply
  effect: async (state: State) => {
    state.vp_tokens = state.vp_tokens + 1;
    while (true) {
      const card = await askCard(`Choose a victory card to trash from supply: `);
      if (!card) { continue; }
      if (!card.victory) {
        console.log(`${card.name} is not a victory card`);
        continue;
      }
      if (state.supply_state[card.name].supply === 0) {
        console.log(`No more ${card.name} in supply`);
        continue;
      }
      state.supply_state[card.name].supply = state.supply_state[card.name].supply - 1
      state.trash.push(card.name);
      break;
    }
  }
});
AddEvent({
  name: 'RAID',
  cost: 5,
  effect: async (state: State) => {
    let num_silvers = 0;
    for (const card of state.play) {
      if (card === CARDS.SILVER.name) {
        num_silvers++;
      }
    }
    for (let i = 0; i < num_silvers; i++) {
      await gainCard(state, CARDS.SILVER);
    }
    // TODO: each other player puts their -1 card token on their deck
  }
});
AddEvent({
  name: 'TRADE',
  cost: 5,
  // trash up to 2 cards from hand, gain a silver per card trashed
  effect: async (state: State) => {
    let num_trashed = 0;
    while (num_trashed < 2) {
      const cardStr = await ask('Trash a card from hand? ');
      if (cardStr.toUpperCase() === 'NO' || cardStr.toUpperCase() === 'DONE') {
        break;
      }
      const card = parseCard(cardStr);
      if (!card) { continue; }
      const index = findCard(state.hand, card.name);
      if (index === -1) {
        console.log(`No ${card.name} in hand: ${state.hand.join(' ')}`);
        continue;
      }
      trashCard(state, state.discard, index);
      num_trashed++;
    }
    for (let i = 0; i < num_trashed; i++) {
      await gainCard(state, CARDS.SILVER);
    }
  }
});

// TODO: unimplemented
AddEvent({
  name: 'BANQUET',
  cost: 3,
  // gain 2 coppers and a non-victory card costing up to 5
  effect: async (_state: State) => {
    throw new Error('unimplemented');
  },
});
AddEvent({
  name: 'QUEST',
  cost: 0,
  // you may discard an attack, two curses, or six cards.  if you do, gain a gold
  effect: async (_state: State) => {
    throw new Error('unimplemented');
  },
});
AddEvent({
  name: 'ANNEX',
  cost: 0,
  debt: 8,
  // look through your discard pile, shuffle all but 5 cards into your deck, gain a duchy
  effect: async (_state: State) => {
    throw new Error('unimplemented');
  },
});
AddEvent({
  name: 'SCOUTING_PARTY',
  cost: 2,
  // +1 buy, look at the top 5 cards of your deck, discard 3 and put the rest back in any order
  effect: async (_state: State) => {
    throw new Error('unimplemented');
  },
});
AddEvent({
  name: 'PILGRIMAGE',
  cost: 4,
  // once per turn: turn your journey token over.
  // if it's face up, choose up to 3 differently named cards in play, gain a copy of each
  effect: async (_state: State) => {
    throw new Error('unimplemented');
  },
});
AddEvent({
  name: 'BALL',
  cost: 5,
  // take your -$1 token, gain 2 cards each costing up to 4
  effect: async (_state: State) => {
    throw new Error('unimplemented');
  },
});
// irrelevant:
// ALMS
// ADVANCE
// FERRY
// PLAN
// TRAINING
// INHERITANCE
// PATHFINDING
// LOST_ARTS
// SEAWAY
// SUMMON

const ALL: {[card: string]: CardDef | EventDef } = {};

for (const name in CARDS) {
  const card = CARDS[name];
  if (ALL[name]) {
    throw new Error(`Multiple cards/events with name: ${card.name}`);
  }
  ALL[name] = card;
}

for (const name in EVENTS) {
  const event = EVENTS[name];
  if (ALL[name]) {
    throw new Error(`Multiple cards/events with name: ${event.name}`);
  }
  ALL[name] = event;
}

function draw(state: State) {
  if (state.minus_card_token) {
    state.minus_card_token = false;
    return;
  }
  if (state.deck.length === 0) {
    if (state.discard.length === 0) {
      return;
    }
    state.deck = shuffle(state.discard);
    state.discard = [];
  }
  state.hand.push(state.deck.pop() as Card);
  state.hand.sort();
}

function showState(state: State, cheat = false) {
  console.log('HAND: ', state.hand.join(' '));
  if (cheat) {
    console.log('DECK: ', state.deck.join(' '));
    console.log('DISCARD: ', state.discard.join(' '));
  } else {
    console.log('DECK: ', state.deck.length, ' cards');
    console.log('DISCARD: ', state.discard.length, ' cards');
  }
  console.log('VPS: ', countVictoryPoints(state));
  if (state.debt) {
    console.log('DEBT: ', state.debt);
  }
}


function payDebt(state: State) {
  if (state.debt < 0) {
    throw new Error(`Negative debt?! ${state.debt}`);
  }
  if (state.money < 0) {
    throw new Error(`Negative money?! ${state.money}`);
  }
  // automatically pay of debt
  const payAmount = Math.min(state.debt, state.money);
  state.debt -= payAmount;
  state.money -= payAmount;
}

function parseCardOrEvent(cardStr: string): CardDef | EventDef | null {
  const possibilities: Array<Card> = [];
  for (const name in ALL) {
    if (name.startsWith(cardStr.toUpperCase())) {
      possibilities.push(name);
    }
  }
  if (!possibilities.length) {
    console.error(`No such card: ${cardStr}`);
    return null;
  } else if (possibilities.length > 1) {
    console.error(`Error: Multiple cards: ${possibilities.join(' ')}`);
    return null;
  }
  return ALL[possibilities[0]];
}

function parseCard(cardStr: string): CardDef | null {
  const maybeCard = parseCardOrEvent(cardStr);
  if (!maybeCard) { return null; }
  if (isEvent(maybeCard)) {
    console.error(`${maybeCard} is an event, not a card!`);
    return null;
  }
  return maybeCard as CardDef;
}

/*
async function askCardOrEvent(question: string): Promise<CardDef | EventDef | null> {
  const cardStr = await ask(question);
  return parseCardOrEvent(cardStr);
}
*/

async function askCard(question: string): Promise<CardDef | null> {
  const cardStr = await ask(question);
  return parseCard(cardStr);
}

function validateGainCard(state: State, gained: CardDef) {
  if (state.supply_state[gained.name].supply == 0) {
    console.log(`Supply pile is empty, failed to gain ${gained.name}`);
    return false;
  }
  return true;
}

async function buyCard(state: State, bought: CardDef) {
  if (!await gainCard(state, bought)) {
    return;
  }
  if (state.supply_state[bought.name].tax) {
    state.debt = state.debt + state.supply_state[bought.name].tax;
    state.supply_state[bought.name].tax = 0;
  }
  return null;
}

async function gainCard(state: State, gained: CardDef) {
  if (!validateGainCard(state, gained)) {
    return false;
  }
  if (gained === CARDS.SILVER) {
    state.gained_silvers++;
  }
  state.gained_cards++;
  state.supply_state[gained.name].supply = state.supply_state[gained.name].supply - 1;
  let topdeck = false;
  if (state.travelling_faired) {
    topdeck = await yesno(`Topdeck ${gained.name} for travelling fair? `);
  }
  if (topdeck) {
    state.deck.push(gained.name);
  } else {
    state.discard.push(gained.name);
  }
  return true;
}

function findTreasure(hand: Array<Card>): number {
  for (let i = 0; i < hand.length; i++) {
    if (CARDS[hand[i]].treasure) {
      return i;
    }
  }
  return -1;
}

function findCard(hand: Array<Card>, card: Card): number {
  for (let i = 0; i < hand.length; i++) {
    if (hand[i] == card) {
      return i;
    }
  }
  return -1;
}

function trashCard(state: State, hand: Array<Card>, index: number) {
  state.trash.push(hand.splice(index, 1)[0]);
}

// TODO:  helper functions for asking for card to trash from hand

function hasTreasure(hand: Array<Card>): boolean {
  return findTreasure(hand) >= 0;
}

function playTreasure(state: State, i: number) {
  const card = CARDS[state.hand[i]];
  if (!card.treasure) {
    throw new Error(`Card ${i} in ${state.hand.join(' ')} is not a treasure`);
  }
  state.play.push(state.hand.splice(i, 1)[0]);
  state.money = state.money + card.treasure;
}

function countVictoryPoints(state: State): number {
  let vps = state.vp_tokens;
  for (const cards of [state.hand, state.discard, state.deck]) {
    for (const name of cards) {
      const card = CARDS[name];
      if (!card) { throw new Error(`BUG: Invalid card found ${card}`); }
      if (card.victory) { vps = vps + card.victory; }
    }
  }
  return vps;
}

async function main(cheat = false) {
  const state: State = {
      deck: [],
      hand: [],
      discard: [],
      play: [],
      trash: [],
      buys: 1,
      debt: 0,
      borrowed: false,
      travelling_faired: false,
      money: 0,
      minus_card_token: false,
      take_mission_turn: false,
      is_mission_turn: false,
      donated: false,
      extra_draw: 0,
      vp_tokens: 0,
      gained_silvers: 0,
      gained_cards: 0,
      saved: [],
      supply_state: {
        COPPER: {
          tax: 1,
          supply: 60 - 7 * 2,
        },
        SILVER: {
          tax: 1,
          supply: 40,
        },
        GOLD: {
          tax: 1,
          supply: 30,
        },
        ESTATE: {
          tax: 1,
          supply: 8,
        },
        DUCHY: {
          tax: 1,
          supply: 8,
        },
        PROVINCE: {
          tax: 1,
          supply: 8,
        },
        CURSE: {
          tax: 1,
          supply: 10,
        },
      },
  };
  for (let i = 0; i  < 7; i++) {
    state.discard.push(CARDS.COPPER.name);
  }
  for (let i = 0; i  < 3; i++) {
    state.discard.push(CARDS.ESTATE.name);
  }

  const history = [];

  let turn = 1;
  while (true) {
    if (state.supply_state.PROVINCE.supply === 0) {
      console.log('NO MORE PROVINCES!');
      break;
    }
    state.buys = 1;
    state.money = 0;
    state.borrowed = false;
    state.donated = false;
    state.travelling_faired = false;
    state.gained_silvers = 0;
    state.gained_cards = 0;

    history.push({
      turn: turn,
      state: JSON.parse(JSON.stringify(state)),
    });

    // draw new hand, shuffling if necessary
    let ndrawn = 5;
    if (state.extra_draw > 0) {
      ndrawn = ndrawn + state.extra_draw;
      state.extra_draw = 0;
    }
    for (let i = 0; i < ndrawn; i++) {
      draw(state);
    }
    if (state.saved.length) {
      state.hand.push(...state.saved)
      state.saved = [];
    }

    showState(state, cheat);

    while (hasTreasure(state.hand)) {
      // console.log(JSON.stringify(state, null, 2))
      const playStr = await ask('Play treasure: ');

      if (playStr.toUpperCase() === 'NONE' || playStr.toUpperCase() == 'DONE') {
        break;
      } else if (playStr.toUpperCase() === 'ALL') {
        while (hasTreasure(state.hand)) {
          playTreasure(state, findTreasure(state.hand));
        }
      } else {
        const played = parseCard(playStr);
        if (!played) {
          console.log(`Failed to parse ${playStr}`);
          continue;
        }
        const i = findCard(state.hand, played.name);
        if (i === -1) {
          console.log(`No ${played.name} in hand`);
          continue;
        }
        playTreasure(state, i);
      }
    }
    payDebt(state);
    if (state.debt > 0) {
      console.log(`Ended buy phase with ${state.debt} debt`);
    }

    while (state.buys > 0 && state.debt == 0) {
      const buyStr = await ask(`$${state.money}, ${state.buys} buys. Buy a card: `);
      if (buyStr.toUpperCase() === 'NONE' || buyStr.toUpperCase() === 'DONE') {
        break;
      }
      const bought = parseCardOrEvent(buyStr);
      if (!bought) {
        console.log(`Failed to parse ${buyStr}`);
        continue;
      }
      if (bought.cost > state.money) {
        console.log(`Can't afford card: ${bought.name}`);
        continue;
      }
      if (isCard(bought)) {
        if (state.is_mission_turn) {
          console.log(`Can't buy card on mission turn: ${bought.name}`);
          continue;
        }

        if (!validateGainCard(state, bought)) {
          continue;
        }
      }
      state.money = state.money - bought.cost;

      if (bought.debt) {
        state.debt = state.debt + bought.debt;
      }

      if (isCard(bought)) {
        const err = await buyCard(state, bought);
        if (err) {
          throw err; // this shouldn't happen
        }
      } else {
        if (!bought.effect) {
          console.log(`Unimplemented card: ${bought.name}`);
          continue;
        }
        await bought.effect(state);
      }

      payDebt(state);
      state.buys = state.buys - 1;
    }

    state.discard.push(...state.hand);
    state.hand = [];
    state.discard.push(...state.play);
    state.play = [];

    if (state.donated) {
      state.discard.push(...state.deck);
      state.deck = []
      console.log(`Donate some cards: ${state.discard.join(' ')}`);
      while (state.discard.length) {
        const cardStr = await ask('Donate a card? ');
        if (cardStr.toUpperCase() === 'NONE' || cardStr.toUpperCase() === 'DONE') {
          break;
        }
        const card = parseCard(cardStr);
        if (!card) { continue; }
        const index = findCard(state.discard, card.name);
        if (index === -1) {
          console.log(`No ${card.name} in deck: ${state.discard.join(' ')}`);
          continue;
        }
        trashCard(state, state.discard, index);
      }
    }

    if (state.take_mission_turn) {
      if (state.is_mission_turn) {
        console.log(`Can't mission on a mission turn`);
      } else {
        state.is_mission_turn = true;
        state.take_mission_turn = false;
        console.log(`-- Taking mission turn --`);
        continue;
      }
    }
    state.is_mission_turn = false;
    state.take_mission_turn = false;

    console.log(`Turn ${turn} ended`);
    console.log('-----------------------------------');
    turn++;
  }

  showState(state, true);
  console.log('GAME LOG: ', JSON.stringify(history, null, 2));
}

main().catch((e) => console.log('ERROR!', e));
