import collections
import copy
import random
import sys
import logging
# sys.path.append('..')
import card_utils
from card_utils import Card
# from ..cardgames import card_utils
# from ... import card_utils

def find_duplicate_suits(hand):
    counts = collections.defaultdict(int)
    for card in hand:
        counts[card.suit] += 1
    return [suit for suit in counts.iterkeys() if counts[suit] > 1]

def remove_card_from_hand(hand, removed_card):
    new_hand = [card for card in hand if removed_card != card]
    assert len(new_hand) == len(hand) - 1
    return new_hand

class Strategy(object):
    # takes a hand, outputs a tuple:
    #   (chosen card, [revealed cards])
    # attempting to signal one of the remaining cards in the hand
    def p1(self, hand):
        raise NotImplementedError("Not P1 strategy implemented")

    # takes a list of revealed cards, and attempts to guess a card
    # remaining in the hand
    def p2(self, revealed):
        raise NotImplementedError("Not P1 strategy implemented")

class SimpleStrategy(Strategy):
    # interpret a sequence of cards as a number
    def p1(self, hand):
        for chosen_card in hand:
            hand_no_chosen = remove_card_from_hand(hand, chosen_card)
            other_cards_of_suit = [card for card in hand_no_chosen if card.suit == chosen_card.suit]
            for other_card_in_suit in other_cards_of_suit:
                hand_no_suit = remove_card_from_hand(hand_no_chosen, other_card_in_suit)

                matching_value_cards = [card for card in hand_no_suit if card.value == chosen_card.value]
                if len(matching_value_cards) > 0:
                    return (chosen_card, [other_card_in_suit, matching_value_cards[0]])

                # failed to find matching value, try to find something to sum

        return None

    def p2(self, revealed_cards):
        if len(revealed_cards) == 2:
            return Card(revealed_cards[0].suit, revealed_cards[1].value)
        return None

class WinningStrategy(Strategy):
    value_to_perm = {
        1: [0, 1, 2],
        2: [0, 2, 1],
        3: [1, 0, 2],
        4: [1, 2, 0],
        5: [2, 0, 1],
        6: [2, 1, 0],
    }

    # interpret a sequence of cards as a number
    def p1(self, hand):
        cards_by_suit = collections.defaultdict(list)
        for card in hand:
            cards_by_suit[card.suit].append(card)
        # since there are 5 cards and 4 suits, there's at least 1 duplicate suit
        chosen_suit = [suit for suit in cards_by_suit.iterkeys() if len(cards_by_suit[suit]) > 1][0]
        candidate_card_1 = cards_by_suit[chosen_suit][0]
        candidate_card_2 = cards_by_suit[chosen_suit][1]
        chosen = None
        revealed = []
        difference = -1
        if (candidate_card_1.value.value - candidate_card_2.value.value) % 13 < 7:
            chosen = candidate_card_1
            revealed.append(candidate_card_2)
            difference = (candidate_card_1.value.value - candidate_card_2.value.value) % 13
        else:
            chosen = candidate_card_2
            revealed.append(candidate_card_1)
            difference = (candidate_card_2.value.value - candidate_card_1.value.value) % 13
        hand = remove_card_from_hand(hand, chosen)
        hand = remove_card_from_hand(hand, revealed[0])
        hand.sort()
        assert (difference > 0) and (difference < 7)
        perm = self.value_to_perm[difference]
        for i in range(3):
            revealed.append(hand[perm[i]])
        return (chosen, revealed)

    def p2(self, revealed_cards):
        chosen_suit = revealed_cards[0].suit

        firstval = revealed_cards[0].value.value
        # add perm to value
        remaining = revealed_cards[1:]
        assert len(remaining) == 3
        resorted = sorted(zip(remaining, range(3)))
        chosen_perm = [0 for i in range(3)]
        for i in range(3):
            chosen_perm[resorted[i][1]] = i
        for (value, perm) in self.value_to_perm.iteritems():
            if perm == chosen_perm:
                chosen_value = (firstval + value - 1) % 13 + 1
                return Card(chosen_suit, card_utils.VALUES[chosen_value])
        return None

HANDSIZE = 5

class Engine(object):
    def simulate(self, strat):
        hand = random.sample(card_utils.DECK, HANDSIZE)

        print
        print '===================================='
        print 'HAND', hand
        choice = strat.p1([x.__deepcopy__() for x in hand])
        if choice is None:
            print 'p1 gave up, poop'
            return 0
        (chosen, revealed) = choice
        assert chosen in hand
        for reveal in revealed:
            assert reveal in hand
            assert reveal != chosen

        print 'P1 has chosen: ', chosen
        print 'P1 revealed: ', revealed

        p2_choice = strat.p2(revealed)
        if p2_choice is None:
            print 'p2 gave up, poop'
            return 0
        if p2_choice == chosen:
            print 'Yay p2 wins'
            return 1
        else:
            print 'Boo, p2 chose %s but was supposed to be %s' % (p2_choice, chosen)
            return -1

ntrials = 1000
score = 0
# strat = SimpleStrategy()
strat = WinningStrategy()
engine = Engine()

for rnd in range(ntrials):
    score += engine.simulate(strat)
    print 'Score  %d out of %d rounds' % (score, rnd+1)
