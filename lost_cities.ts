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

type Card = {
  suit: number,
  rank: number,
  display: string,
};

type State = {
  deck: Array<Card>,
  hands: Array<Array<Card>>,
  discard: Array<Array<Card>>,
  cities: Array<Array<Card>>,
};

type GameOptions = {
  nsuits: number,
};

type Strategy = {
  play:
};

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
