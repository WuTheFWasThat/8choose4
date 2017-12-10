// import { createInterface } from 'readline';

function cardRepr(num: number): string {
  if (num < 0 || num > 13) {
    throw new Error('Invalid number');
  }
  if (num === 1) {
    return 'A';
  } else if (num === 10) {
    return 'T';
  } else if (num === 11) {
    return 'J';
  } else if (num === 12) {
    return 'Q';
  } else if (num === 13) {
    return 'K';
  } else {
    return num.toString();
  }
}

// Each player receives 2 suits of cards, and lines them up A-K.  This is their card supply.
// They then take two aces in hand, and a joker in hand.
// Variant: at beginning, these choose 1 2-4, 1 5-7, and 1 8-10
// Variant: game ends after fixed # of turns, score is sum total of ranks?
//
// On each round:
// - Each player secretly decides some cards to play, by putting them in front of the joker.
// - When both are done, they put their decks face down to commit to the play.
// - Once both have committed, the decks are turned face up, and all cards in front of the joker are in play.
//   The rest of the cards go back to hand.
// - If a player did not play any cards, they receive all their A from supply.
// - During play, we begin resolving effects of cards.  We resolve effects in order of rank, low to high, starting from A-K.
//   All cards of the same rank are resolved simultaneously.  (While a card's effect is being resolved, it is not considered in play.)
// - After a card's effect is resolved, it attempts to promote.
//   To promote, it returns to their supply, and the player takes to hand the card of higher rank.
//   Exception: the King promotes back to Queen.
//   If the card cannot promote (i.e. both cards of higher rank are in play or in hand), it returns to hand.
// - A player wins as soon as they have both King and Queen in hand (not in play!).
//   Both players can win at the same time - the game can then be considered a tie.

type Effect = {
  desc: string,
  max_rank?: number,
  min_rank?: number,
};
const EFFECTS: Array<Effect> = [
  {
    desc: `REPRODUCE
      If you played only one reproduce, gain a copy of your lowest rank play.
      If you played two, return one reproduce to hand after promotion.
    `,
    max_rank: 1,
  },
  {
    desc: `SOLITUDE
      If your opponent has two cards of same rank in play, they return both to hand.
      If you played two of these, one goes to supply (and is not promoted).
    `,
    max_rank: 1,
  },
  {
    desc: `REVOLUTION
      If your opponent has a Q, or K in play, and you have played two of these, you win.
    `,
    max_rank: 1,
  },
  {
    desc: `STREAK
      If you have any streaks of 3 consecutively ranked cards in play, gain a T.
    `,
    max_rank: 1,
  },
  {
    desc: `MATCHMAKER
      Gain a copy of the lowest rank card for which you have exactly one copy in play.
      If you played two, gain a copy of all cards of rank T or less for which you have exactly one copy in play.
    `,
    max_rank: 1,
  },
  {
    desc: `DUPLICATE
      Gain a copy of the highest ranked card you have in play.
    `,
    min_rank: 2,
    max_rank: 4,
  },
  {
    desc: `REGULATOR
      If your opponent has more than 3 cards in play, they return all in-play cards to hand.
    `,
    min_rank: 2,
    max_rank: 4,
  },
  {
    desc: `MATHEMATICIAN
      If you have N cards in play and 1 mathematician in play, gain the card N.
      If you have N cards in play and 2 mathematicians in play, gain the card 2N.
    `,
    min_rank: 2,
    max_rank: 4,
  },
  {
    desc: `STAR
      If your opponent played any 5s, promote them in-place.
    `,
    min_rank: 2,
    max_rank: 4,
  },
  {
    desc: `LUCKY STAR
      If you have a 7 in play, gain a 5 to hand.
    `,
    min_rank: 2,
    max_rank: 4,
  },
  {
    desc: `JESTER
      If you have at least 3 distinct cards in play, gain a J to hand.
    `,
    min_rank: 2,
    max_rank: 4,
  },
  {
    desc: `UNION
      If you have exactly 2 cards in play, return them to supply and receive a J.
    `,
    min_rank: 2,
    max_rank: 4,
  },
  {
    desc: `BOREDOM
      If your opponent has no cards in play, you lose the game.
    `,
    min_rank: 2,
    max_rank: 4,
  },
  {
    desc: `CONTRARIAN
      If you played two contrarians, one of them promotes to the card of lower rank instead of higher.
    `,
    min_rank: 5,
    max_rank: 7,
  },
  {
    desc: `FOLLOWER
      Take your highest rank card in play.  Promote them in-place once, if you played one followers, or twice if you played two.
    `,
    min_rank: 5,
    max_rank: 7,
  },
  {
    desc: `POLICE
      If your opponent has more than 2 cards in play, they return all in-play cards to hand.
    `,
    min_rank: 5,
    max_rank: 7,
  },
  {
    desc: `TEAMMATE
      If you played two of these, promote both twice.
    `,
    min_rank: 5,
    max_rank: 7,
  },
  {
    desc: `LONER
      If you played exactly one of these, promote it twice.
    `,
    min_rank: 5,
    max_rank: 7,
  },
  {
    desc: `COPYCAT
      If your opponent did not play copycat, choose an effect of a higher ranked card.
      Your copycats play as that.
    `,
    min_rank: 5,
    max_rank: 7,
  },
  {
    desc: `MILITARY
      If your opponent has more than 1 card in play, they return all in-play cards to hand.
    `,
    min_rank: 8,
    max_rank: 10,
  },
  {
    desc: `GIFT
      If you played 1 gift, receive a 2, 3, and 4.  If you played 2, receive a 5, 6, and 7.
    `,
    min_rank: 8,
    max_rank: 10,
  },
  {
    desc: `ASSASSIN 
      If you played 1 assassin, and your opponent has a J in play, they return it to the supply.
      If you played 2 assassins, and your opponent has a K or Q in play, they return it to the supply.
    `,
    min_rank: 8,
    max_rank: 10,
  },
  {
    desc: `WAR
      For each war your opponent played, a war does not get promoted.
      If you played more war than your opponent, if your opponent as a K or Q in play, 
    `,
    min_rank: 8,
    max_rank: 10,
  },
  {
    desc: `HERO
      Reveal your hand.  If your highest ranked card can be promoted, promote it as if were just played.
      Hero still gets promoted.
    `,
    min_rank: 8,
    max_rank: 10,
  },
  {
    desc: `NEPOTIST
      Reveal your hand.  Replace an A with a nepotist from supply, if you can.
    `,
    min_rank: 8,
    max_rank: 10,
  },
  {
    desc: `EXECUTE
      If your opponent has 2 copies of any cards in supply, permanently trash one copy of the card of lowest rank.
    `,
    min_rank: 11,
    max_rank: 13,
  },
  {
    desc: `ASTRONOMER
      Gain a 5 and 10 to hand.
    `,
    min_rank: 11,
    max_rank: 13,
  },
  {
    desc: `FLOURISH
      For the lowest rank with non-empty supply, gain all copies from supply to hand.
    `,
    min_rank: 11,
    max_rank: 13,
  },
  // PHILANTHROPER
];

let used: {[key: string]: boolean} = {};
for (let i = 1; i <= 13; i++) {
  let effect: Effect;
  let index: number;
  while (true) {
    index = Math.floor(EFFECTS.length * Math.random());
    if (used[index]) { continue; }
    effect = EFFECTS[index];
    if (effect.min_rank && i < effect.min_rank) { continue; }
    if (effect.max_rank && i > effect.max_rank) { continue; }
    break;
  } 
  used[index] = true;
  console.log(`${cardRepr(i)}: ${effect.desc}`)
}

// function ask(question: string): Promise<string> {
//   return new Promise((resolve, _reject) => {
//     const rl = createInterface({
//       input: process.stdin,
//       output: process.stdout
//     });
// 
//     rl.question(question, (answer: string) => {
//       resolve(answer);
//       rl.close();
//     });
//   });
// }
// 
// type Effect = (state: State, played: Played) => Promise<void>;
// 
// type CardDef = {
//   number: number,
//   effect: (state: State, played: Played) => Promise<void>,
//   treasure?: number,
//   victory?: number,
//   name: string
// };
// 
// /*
// interface ThingDef {
//   is_card?: boolean;
//   is_event?: boolean;
//   name: string;
// };
// */
// type EventDef = {
//   _is_card?: false;
//   _is_event?: true;
//   name: string;
//   cost: number,
//   debt?: number,
//   effect: (state: State) => Promise<void>,
// };
// 
// const CARDS: {[card: string]: CardDef} = {};
// function AddCard(def: CardDef): void {
//   def._is_card = true;
//   def._is_event = false;
//   CARDS[def.name] = def;
// }
// AddCard({
//   name: 'COPPER',
//   cost: 0,
//   treasure: 1,
// });
// AddCard({
//   name: 'SILVER',
//   cost: 3,
//   treasure: 2,
// });
// AddCard({
//   name: 'GOLD',
//   cost: 6,
//   treasure: 3,
// });
// AddCard({
//   name: 'ESTATE',
//   cost: 2,
//   victory: 1,
// });
// AddCard({
//   name: 'DUCHY',
//   cost: 5,
//   victory: 3,
// });
// AddCard({
//   name: 'PROVINCE',
//   cost: 8,
//   victory: 6,
// });
// AddCard({
//   name: 'CURSE',
//   cost: 0,
// });
// 
// type Card = string;
// type State = {
//   deck: Array<Card>,
//   hand: Array<Card>,
//   discard: Array<Card>,
//   play: Array<Card>,
//   trash: Array<Card>,
//   buys: number,
//   debt: number,
//   money: number,
//   saved: Array<Card>,
//   supply_state: {
//     [card: string]: {
//       tax: number,
//       supply: number
//     },
//   },
// };
// 
// const EVENTS: {[card: string]: EventDef} = {};
// function AddEvent(def: EventDef): void {
//   def._is_card = false;
//   def._is_event = true;
//   EVENTS[def.name] = def;
// }
// 
// AddEvent({
//   name: 'BORROW',
//   cost: 0,
//   effect: async (state: State) => {
//     if (state.borrowed) {
//       console.log(`Can't borrow twice in one turn`);
//       return;
//     }
//     state.borrowed = true;
//     state.money = state.money + 1;
//     state.minus_card_token = true;
//     state.buys = state.buys + 1;
//   }
// });
// AddEvent({
//   name: 'EXPEDITION',
//   cost: 3,
//   effect: async (state: State) => {
//     state.extra_draw = state.extra_draw + 2;
//   }
// });
// AddEvent({
//   name: 'MISSION',
//   cost: 4,
//   effect: async (state: State) => {
//     state.take_mission_turn = true;
//   }
// });
// AddEvent({
//   name: 'SAVE',
//   cost: 1,
//   effect: async (state: State) => {
//     state.buys = state.buys + 1;
//     if (state.hand.length === 0) {
//       return;
//     }
//     let saveIndex = -1;
//     if (state.hand.length === 1) {
//       saveIndex = 0;
//     } else {
//       while (true) {
//         const card = await askCard(`Choose a card to save: `);
//         if (!card) { continue; }
//         saveIndex = findCard(state.hand, card.name);
//         if (saveIndex > -1) {
//           break;
//         }
//         console.log(`No such card in hand: ${state.hand.join(' ')}`);
//       }
//     }
//     state.saved.push(state.hand.splice(saveIndex, 1)[0]);
//   }
// });
// AddEvent({
//   name: 'WEDDING',
//   cost: 4,
//   debt: 3,
//   effect: async (state: State) => {
//     state.vp_tokens = state.vp_tokens + 1;
//     await gainCard(state, CARDS.GOLD);
//   }
// });
// AddEvent({
//   name: 'DOMINATE',
//   cost: 14,
//   effect: async (state: State) => {
//     if (await gainCard(state, CARDS.PROVINCE)) {
//       state.vp_tokens = state.vp_tokens + 9;
//     }
//   }
// });
// AddEvent({
//   name: 'TAX',
//   cost: 2,
//   effect: async (state: State) => {
//     while (true) {
//       const card = await askCard(`Choose a card to tax: `);
//       if (!card) { continue; }
//       const supply_state = state.supply_state[card.name];
//       if (!supply_state) {
//         console.log(`${card.name} is not in the supply`);
//         continue;
//       }
//       supply_state.tax = supply_state.tax + 2;
//       break;
//     }
//   }
// });
// AddEvent({
//   name: 'TRAVELLING_FAIR',
//   cost: 2,
//   effect: async (state: State) => {
//     state.buys = state.buys + 2;
//     state.travelling_faired = true;
//   }
// });
// AddEvent({
//   name: 'DONATE',
//   cost: 0,
//   debt: 8,
//   effect: async (state: State) => {
//     state.donated = true;
//   }
// });
// AddEvent({
//   name: 'DELVE',
//   cost: 2,
//   effect: async (state: State) => {
//     state.buys = state.buys + 1;
//     await gainCard(state, CARDS.SILVER);
//   }
// });
// AddEvent({
//   name: 'BONFIRE',
//   cost: 3,
//   effect: async (state: State) => {
//     let trashed = 0;
//     while (trashed < 2) {
//       const card = await askCard(`Choose a card to trash: `);
//       if (!card) { continue; }
//       const index = findCard(state.play, card.name);
//       if (index === -1) {
//         console.log(`${card.name} is not in play: ${state.play.join(' ')}`);
//         continue;
//       }
//       trashCard(state, state.play, index);
//       trashed++;
//     }
//   }
// });
// AddEvent({
//   name: 'WINDFALL',
//   cost: 5,
//   effect: async (state: State) => {
//     if (state.deck.length === 0 && state.discard.length === 0) {
//       await gainCard(state, CARDS.GOLD);
//       await gainCard(state, CARDS.GOLD);
//       await gainCard(state, CARDS.GOLD);
//     }
//   }
// });
// AddEvent({
//   name: 'CONQUEST',
//   cost: 6,
//   effect: async (state: State) => {
//     await gainCard(state, CARDS.SILVER);
//     await gainCard(state, CARDS.SILVER);
//     state.vp_tokens = state.vp_tokens + state.gained_silvers;
//   }
// });
// AddEvent({
//   name: 'TRIUMPH',
//   cost: 0,
//   debt: 5,
//   effect: async (state: State) => {
//     if (await gainCard(state, CARDS.ESTATE)) {
//       state.vp_tokens = state.vp_tokens + state.gained_cards;
//     }
//   }
// });
// AddEvent({
//   name: 'RITUAL',
//   cost: 4,
//   effect: async (state: State) => {
//     if (await gainCard(state, CARDS.CURSE)) {
//       if (!state.hand.length) {
//         console.log('No card to trash');
//       } else while (true) {
//         const card = await askCard(`Choose a card to trash: `);
//         if (!card) { continue; }
//         let i = findCard(state.hand, card.name);
//         if (i === -1) {
//           console.log(`No ${card.name} in hand: ${state.hand.join(' ')}`);
//           continue;
//         }
//         trashCard(state, state.hand, i);
//         state.vp_tokens = state.vp_tokens + card.cost;
//         break;
//       }
//     }
//   }
// });
// AddEvent({
//   name: 'SALT_THE_EARTH',
//   cost: 4,
//   // +1 vp, trash a victory card from the supply
//   effect: async (state: State) => {
//     state.vp_tokens = state.vp_tokens + 1;
//     while (true) {
//       const card = await askCard(`Choose a victory card to trash from supply: `);
//       if (!card) { continue; }
//       if (!card.victory) {
//         console.log(`${card.name} is not a victory card`);
//         continue;
//       }
//       if (state.supply_state[card.name].supply === 0) {
//         console.log(`No more ${card.name} in supply`);
//         continue;
//       }
//       state.supply_state[card.name].supply = state.supply_state[card.name].supply - 1
//       state.trash.push(card.name);
//       break;
//     }
//   }
// });
// AddEvent({
//   name: 'RAID',
//   cost: 5,
//   effect: async (state: State) => {
//     let num_silvers = 0;
//     for (const card of state.play) {
//       if (card === CARDS.SILVER.name) {
//         num_silvers++;
//       }
//     }
//     for (let i = 0; i < num_silvers; i++) {
//       await gainCard(state, CARDS.SILVER);
//     }
//     // TODO: each other player puts their -1 card token on their deck
//   }
// });
// AddEvent({
//   name: 'TRADE',
//   cost: 5,
//   // trash up to 2 cards from hand, gain a silver per card trashed
//   effect: async (state: State) => {
//     let num_trashed = 0;
//     while (num_trashed < 2) {
//       const cardStr = await ask('Trash a card from hand? ');
//       if (cardStr.toUpperCase() === 'NO' || cardStr.toUpperCase() === 'DONE') {
//         break;
//       }
//       const card = parseCard(cardStr);
//       if (!card) { continue; }
//       const index = findCard(state.hand, card.name);
//       if (index === -1) {
//         console.log(`No ${card.name} in hand: ${state.hand.join(' ')}`);
//         continue;
//       }
//       trashCard(state, state.discard, index);
//       num_trashed++;
//     }
//     for (let i = 0; i < num_trashed; i++) {
//       await gainCard(state, CARDS.SILVER);
//     }
//   }
// });
// 
// // TODO: unimplemented
// AddEvent({
//   name: 'BANQUET',
//   cost: 3,
//   // gain 2 coppers and a non-victory card costing up to 5
//   effect: async (_state: State) => {
//     throw new Error('unimplemented');
//   },
// });
// AddEvent({
//   name: 'QUEST',
//   cost: 0,
//   // you may discard an attack, two curses, or six cards.  if you do, gain a gold
//   effect: async (_state: State) => {
//     throw new Error('unimplemented');
//   },
// });
// AddEvent({
//   name: 'ANNEX',
//   cost: 0,
//   debt: 8,
//   // look through your discard pile, shuffle all but 5 cards into your deck, gain a duchy
//   effect: async (_state: State) => {
//     throw new Error('unimplemented');
//   },
// });
// AddEvent({
//   name: 'SCOUTING_PARTY',
//   cost: 2,
//   // +1 buy, look at the top 5 cards of your deck, discard 3 and put the rest back in any order
//   effect: async (_state: State) => {
//     throw new Error('unimplemented');
//   },
// });
// AddEvent({
//   name: 'PILGRIMAGE',
//   cost: 4,
//   // once per turn: turn your journey token over.
//   // if it's face up, choose up to 3 differently named cards in play, gain a copy of each
//   effect: async (_state: State) => {
//     throw new Error('unimplemented');
//   },
// });
// AddEvent({
//   name: 'BALL',
//   cost: 5,
//   // take your -$1 token, gain 2 cards each costing up to 4
//   effect: async (_state: State) => {
//     throw new Error('unimplemented');
//   },
// });
// // irrelevant:
// // ALMS
// // ADVANCE
// // FERRY
// // PLAN
// // TRAINING
// // INHERITANCE
// // PATHFINDING
// // LOST_ARTS
// // SEAWAY
// // SUMMON
// 
// const ALL: {[card: string]: CardDef | EventDef } = {};
// 
// for (const name in CARDS) {
//   const card = CARDS[name];
//   if (ALL[name]) {
//     throw new Error(`Multiple cards/events with name: ${card.name}`);
//   }
//   ALL[name] = card;
// }
// 
// for (const name in EVENTS) {
//   const event = EVENTS[name];
//   if (ALL[name]) {
//     throw new Error(`Multiple cards/events with name: ${event.name}`);
//   }
//   ALL[name] = event;
// }
// 
// function draw(state: State) {
//   if (state.minus_card_token) {
//     state.minus_card_token = false;
//     return;
//   }
//   if (state.deck.length === 0) {
//     if (state.discard.length === 0) {
//       return;
//     }
//     state.deck = shuffle(state.discard);
//     state.discard = [];
//   }
//   state.hand.push(state.deck.pop() as Card);
//   state.hand.sort();
// }
// 
// function showState(state: State, cheat = false) {
//   console.log('HAND: ', state.hand.join(' '));
//   if (cheat) {
//     console.log('DECK: ', state.deck.join(' '));
//     console.log('DISCARD: ', state.discard.join(' '));
//   } else {
//     console.log('DECK: ', state.deck.length, ' cards');
//     console.log('DISCARD: ', state.discard.length, ' cards');
//   }
//   console.log('VPS: ', countVictoryPoints(state));
//   if (state.debt) {
//     console.log('DEBT: ', state.debt);
//   }
// }
// 
// 
// function payDebt(state: State) {
//   if (state.debt < 0) {
//     throw new Error(`Negative debt?! ${state.debt}`);
//   }
//   if (state.money < 0) {
//     throw new Error(`Negative money?! ${state.money}`);
//   }
//   // automatically pay of debt
//   const payAmount = Math.min(state.debt, state.money);
//   state.debt -= payAmount;
//   state.money -= payAmount;
// }
// 
// function parseCardOrEvent(cardStr: string): CardDef | EventDef | null {
//   const possibilities: Array<Card> = [];
//   for (const name in ALL) {
//     if (name.startsWith(cardStr.toUpperCase())) {
//       possibilities.push(name);
//     }
//   }
//   if (!possibilities.length) {
//     console.error(`No such card: ${cardStr}`);
//     return null;
//   } else if (possibilities.length > 1) {
//     console.error(`Error: Multiple cards: ${possibilities.join(' ')}`);
//     return null;
//   }
//   return ALL[possibilities[0]];
// }
// 
// function parseCard(cardStr: string): CardDef | null {
//   const maybeCard = parseCardOrEvent(cardStr);
//   if (!maybeCard) { return null; }
//   if (isEvent(maybeCard)) {
//     console.error(`${maybeCard} is an event, not a card!`);
//     return null;
//   }
//   return maybeCard as CardDef;
// }
// 
// /*
// async function askCardOrEvent(question: string): Promise<CardDef | EventDef | null> {
//   const cardStr = await ask(question);
//   return parseCardOrEvent(cardStr);
// }
// */
// 
// async function askCard(question: string): Promise<CardDef | null> {
//   const cardStr = await ask(question);
//   return parseCard(cardStr);
// }
// 
// function validateGainCard(state: State, gained: CardDef) {
//   if (state.supply_state[gained.name].supply == 0) {
//     console.log(`Supply pile is empty, failed to gain ${gained.name}`);
//     return false;
//   }
//   return true;
// }
// 
// async function buyCard(state: State, bought: CardDef) {
//   if (!await gainCard(state, bought)) {
//     return;
//   }
//   if (state.supply_state[bought.name].tax) {
//     state.debt = state.debt + state.supply_state[bought.name].tax;
//     state.supply_state[bought.name].tax = 0;
//   }
//   return null;
// }
// 
// async function gainCard(state: State, gained: CardDef) {
//   if (!validateGainCard(state, gained)) {
//     return false;
//   }
//   if (gained === CARDS.SILVER) {
//     state.gained_silvers++;
//   }
//   state.gained_cards++;
//   state.supply_state[gained.name].supply = state.supply_state[gained.name].supply - 1;
//   let topdeck = false;
//   if (state.travelling_faired) {
//     topdeck = await yesno(`Topdeck ${gained.name} for travelling fair? `);
//   }
//   if (topdeck) {
//     state.deck.push(gained.name);
//   } else {
//     state.discard.push(gained.name);
//   }
//   return true;
// }
// 
// function findTreasure(hand: Array<Card>): number {
//   for (let i = 0; i < hand.length; i++) {
//     if (CARDS[hand[i]].treasure) {
//       return i;
//     }
//   }
//   return -1;
// }
// 
// function findCard(hand: Array<Card>, card: Card): number {
//   for (let i = 0; i < hand.length; i++) {
//     if (hand[i] == card) {
//       return i;
//     }
//   }
//   return -1;
// }
// 
// function trashCard(state: State, hand: Array<Card>, index: number) {
//   state.trash.push(hand.splice(index, 1)[0]);
// }
// 
// // TODO:  helper functions for asking for card to trash from hand
// 
// function hasTreasure(hand: Array<Card>): boolean {
//   return findTreasure(hand) >= 0;
// }
// 
// function playTreasure(state: State, i: number) {
//   const card = CARDS[state.hand[i]];
//   if (!card.treasure) {
//     throw new Error(`Card ${i} in ${state.hand.join(' ')} is not a treasure`);
//   }
//   state.play.push(state.hand.splice(i, 1)[0]);
//   state.money = state.money + card.treasure;
// }
// 
// function countVictoryPoints(state: State): number {
//   let vps = state.vp_tokens;
//   for (const cards of [state.hand, state.discard, state.deck]) {
//     for (const name of cards) {
//       const card = CARDS[name];
//       if (!card) { throw new Error(`BUG: Invalid card found ${card}`); }
//       if (card.victory) { vps = vps + card.victory; }
//     }
//   }
//   return vps;
// }
// 
// async function main(cheat = false) {
//   const state: State = {
//       deck: [],
//       hand: [],
//       discard: [],
//       play: [],
//       trash: [],
//       buys: 1,
//       debt: 0,
//       borrowed: false,
//       travelling_faired: false,
//       money: 0,
//       minus_card_token: false,
//       take_mission_turn: false,
//       is_mission_turn: false,
//       donated: false,
//       extra_draw: 0,
//       vp_tokens: 0,
//       gained_silvers: 0,
//       gained_cards: 0,
//       saved: [],
//       supply_state: {
//         COPPER: {
//           tax: 1,
//           supply: 60 - 7 * 2,
//         },
//         SILVER: {
//           tax: 1,
//           supply: 40,
//         },
//         GOLD: {
//           tax: 1,
//           supply: 30,
//         },
//         ESTATE: {
//           tax: 1,
//           supply: 8,
//         },
//         DUCHY: {
//           tax: 1,
//           supply: 8,
//         },
//         PROVINCE: {
//           tax: 1,
//           supply: 8,
//         },
//         CURSE: {
//           tax: 1,
//           supply: 10,
//         },
//       },
//   };
//   for (let i = 0; i  < 7; i++) {
//     state.discard.push(CARDS.COPPER.name);
//   }
//   for (let i = 0; i  < 3; i++) {
//     state.discard.push(CARDS.ESTATE.name);
//   }
// 
//   const history = [];
// 
//   let turn = 1;
//   while (true) {
//     if (state.supply_state.PROVINCE.supply === 0) {
//       console.log('NO MORE PROVINCES!');
//       break;
//     }
//     state.buys = 1;
//     state.money = 0;
//     state.borrowed = false;
//     state.donated = false;
//     state.travelling_faired = false;
//     state.gained_silvers = 0;
//     state.gained_cards = 0;
// 
//     history.push({
//       turn: turn,
//       state: JSON.parse(JSON.stringify(state)),
//     });
// 
//     // draw new hand, shuffling if necessary
//     let ndrawn = 5;
//     if (state.extra_draw > 0) {
//       ndrawn = ndrawn + state.extra_draw;
//       state.extra_draw = 0;
//     }
//     for (let i = 0; i < ndrawn; i++) {
//       draw(state);
//     }
//     if (state.saved.length) {
//       state.hand.push(...state.saved)
//       state.saved = [];
//     }
// 
//     showState(state, cheat);
// 
//     while (hasTreasure(state.hand)) {
//       // console.log(JSON.stringify(state, null, 2))
//       const playStr = await ask('Play treasure: ');
// 
//       if (playStr.toUpperCase() === 'NONE' || playStr.toUpperCase() == 'DONE') {
//         break;
//       } else if (playStr.toUpperCase() === 'ALL') {
//         while (hasTreasure(state.hand)) {
//           playTreasure(state, findTreasure(state.hand));
//         }
//       } else {
//         const played = parseCard(playStr);
//         if (!played) {
//           console.log(`Failed to parse ${playStr}`);
//           continue;
//         }
//         const i = findCard(state.hand, played.name);
//         if (i === -1) {
//           console.log(`No ${played.name} in hand`);
//           continue;
//         }
//         playTreasure(state, i);
//       }
//     }
//     payDebt(state);
//     if (state.debt > 0) {
//       console.log(`Ended buy phase with ${state.debt} debt`);
//     }
// 
//     while (state.buys > 0 && state.debt == 0) {
//       const buyStr = await ask(`$${state.money}, ${state.buys} buys. Buy a card: `);
//       if (buyStr.toUpperCase() === 'NONE' || buyStr.toUpperCase() === 'DONE') {
//         break;
//       }
//       const bought = parseCardOrEvent(buyStr);
//       if (!bought) {
//         console.log(`Failed to parse ${buyStr}`);
//         continue;
//       }
//       if (bought.cost > state.money) {
//         console.log(`Can't afford card: ${bought.name}`);
//         continue;
//       }
//       if (isCard(bought)) {
//         if (state.is_mission_turn) {
//           console.log(`Can't buy card on mission turn: ${bought.name}`);
//           continue;
//         }
// 
//         if (!validateGainCard(state, bought)) {
//           continue;
//         }
//       }
//       state.money = state.money - bought.cost;
// 
//       if (bought.debt) {
//         state.debt = state.debt + bought.debt;
//       }
// 
//       if (isCard(bought)) {
//         const err = await buyCard(state, bought);
//         if (err) {
//           throw err; // this shouldn't happen
//         }
//       } else {
//         if (!bought.effect) {
//           console.log(`Unimplemented card: ${bought.name}`);
//           continue;
//         }
//         await bought.effect(state);
//       }
// 
//       payDebt(state);
//       state.buys = state.buys - 1;
//     }
// 
//     state.discard.push(...state.hand);
//     state.hand = [];
//     state.discard.push(...state.play);
//     state.play = [];
// 
//     if (state.donated) {
//       state.discard.push(...state.deck);
//       state.deck = []
//       console.log(`Donate some cards: ${state.discard.join(' ')}`);
//       while (state.discard.length) {
//         const cardStr = await ask('Donate a card? ');
//         if (cardStr.toUpperCase() === 'NONE' || cardStr.toUpperCase() === 'DONE') {
//           break;
//         }
//         const card = parseCard(cardStr);
//         if (!card) { continue; }
//         const index = findCard(state.discard, card.name);
//         if (index === -1) {
//           console.log(`No ${card.name} in deck: ${state.discard.join(' ')}`);
//           continue;
//         }
//         trashCard(state, state.discard, index);
//       }
//     }
// 
//     if (state.take_mission_turn) {
//       if (state.is_mission_turn) {
//         console.log(`Can't mission on a mission turn`);
//       } else {
//         state.is_mission_turn = true;
//         state.take_mission_turn = false;
//         console.log(`-- Taking mission turn --`);
//         continue;
//       }
//     }
//     state.is_mission_turn = false;
//     state.take_mission_turn = false;
// 
//     console.log(`Turn ${turn} ended`);
//     console.log('-----------------------------------');
//     turn++;
//   }
// 
//   showState(state, true);
//   console.log('GAME LOG: ', JSON.stringify(history, null, 2));
// }
// 
// main().catch((e) => console.log('ERROR!', e));
