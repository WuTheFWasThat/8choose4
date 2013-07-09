import random
import copy
import time
import hand_evaluation

# card representation is (card_number, card_suit), where
#
# card_number is an integer between 1 and 13, and 
card_numbers = range(1, 14)
# card_suit is in the set set(['c', 'd', 'h', 's'])
card_suits = ['c', 'd', 'h', 's']

string_to_number_mapping = {
    '1'  : 14,
    '2'  : 2,
    '3'  : 3,
    '4'  : 4,
    '5'  : 5,
    '6'  : 6,
    '7'  : 7,
    '8'  : 8,
    '9'  : 9,
    '10' : 10,
    '11' : 11,
    '12' : 12,
    '13' : 13,
    '14' : 14,
    'j'  : 11,
    'q'  : 12,
    'k'  : 13,
    'a'  : 14
}

def string_to_card(string):
  num = string[0:-1]
  suit = string[-1]
  try:
    num = int(num)
  except:
    num = string_to_number_mapping[num]
  return (num, suit)

hand_size = 8
num_passed = 4

def get_random(array):
  return array[random.randrange(len(array))]

def get_random_card():
  return (get_random(card_numbers), get_random(card_suits))

# generator which gets all (n C k) combinations
def choose_generator(n, k):
  for i in choose_generator_helper(n, set(), 0, k):
    yield i

def choose_generator_helper(n, chosen, first_index, k):
  if k == 0: yield chosen
  for i in range(first_index, n):
    for j in choose_generator_helper(n, copy.copy(chosen).union([i]), i+1, k - 1):
      yield j

def generate_hands():
  cards_set = set(); # set of 16 cards
  hands = []; # 2 by hand_size array of cards
  hand = []
  
  for i in range(2 * hand_size):
    card = get_random_card()
    while card in cards_set:
      card = get_random_card()
    cards_set.add(card)

    hand.append(card)
    if len(hand) == hand_size:
      hands.append(hand)
      hand = []

  return hands 

if __name__=="__main__":
  hands = generate_hands()
  print hands

  t = time.time()
  payoff_matrix = []
  for pass1 in choose_generator(hand_size, num_passed):
    row = []
    for pass2 in choose_generator(hand_size, num_passed):
      hand_A = set() 
      hand_B = set() 
      for i in range(hand_size):
        if i in pass1: hand_B.add(hands[0][i])
        else:          hand_A.add(hands[0][i])
        if i in pass2: hand_A.add(hands[1][i])
        else:          hand_B.add(hands[1][i])
      best_hand_A = hand_evaluation.best_poker_hand(hand_A)
      best_hand_B = hand_evaluation.best_poker_hand(hand_B)
      winner = hand_evaluation.poker_hand_comparator(best_hand_A, best_hand_B)
      row.append(winner)
    payoff_matrix.append(row)
  
  print time.time() - t , 'seconds elapsed'
  print payoff_matrix
