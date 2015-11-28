import random
import copy
import time
import hand_evaluation
import itertools

# card representation is (card_number, card_suit), where
#
# card_number is an integer between 1 and 13, and 
card_numbers = range(2, 15)
# card_suit is in the set set(['c', 'd', 'h', 's'])
card_suits = ['c', 'd', 'h', 's']

string_to_number_mapping = {
  '1' : 14,
  '2' : 2,
  '3' : 3,
  '4' : 4,
  '5' : 5,
  '6' : 6,
  '7' : 7,
  '8' : 8,
  '9' : 9,
 '10' : 10,
 '11' : 11,
 '12' : 12,
 '13' : 13,
 '14' : 14,
  'j' : 11,
  'J' : 11,
  'q' : 12,
  'Q' : 12,
  'k' : 13,
  'K' : 13,
  'a' : 14,
  'A' : 14,
}

number_to_string_mapping = {
    1 :  'A',
    2 :  '2',
    3 :  '3',
    4 :  '4',
    5 :  '5',
    6 :  '6',
    7 :  '7',
    8 :  '8',
    9 :  '9',
   10 : '10',
   11 :  'J',
   12 :  'Q',
   13 :  'K',
   14 :  'A',
}

def string_to_card(string):
  num = string[0:-1]
  suit = string[-1]
  try:
    num = int(num)
  except:
    num = string_to_number_mapping[num]
  return (num, suit)

def card_to_string(card):
  return number_to_string_mapping[card[0]] + card[1]

hand_size =  8
num_passed = 4

def get_random(array):
  return array[random.randrange(len(array))]

def get_random_card():
  return (get_random(card_numbers), get_random(card_suits))

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

  return (hands[0], hands[1])

def get_payoff_matrix(hand_A, hand_B):
  payoff_matrix = []
  for pass1 in itertools.combinations(range(hand_size), num_passed):
    row = []
    for pass2 in itertools.combinations(range(hand_size), num_passed):
      new_hand_A = set() 
      new_hand_B = set() 
      for i in range(hand_size):
        if i in pass1: new_hand_B.add(hand_A[i])
        else:          new_hand_A.add(hand_A[i])
        if i in pass2: new_hand_A.add(hand_B[i])
        else:          new_hand_B.add(hand_B[i])
      winner = hand_evaluation.poker_hand_comparator(new_hand_A, new_hand_B)

      # best_hand_A = hand_evaluation.best_poker_hand(new_hand_A)
      # best_hand_B = hand_evaluation.best_poker_hand(new_hand_B)
      # old_winner = hand_evaluation.poker_hand_comparator(best_hand_A, best_hand_B)
      # if (winner != old_winner): print winner, old_winner

      row.append(winner)
    payoff_matrix.append(row)
  return payoff_matrix

def get_pass(i):
  it = 0
  for handpass in itertools.combinations(range(hand_size), num_passed):
    if it == i:
      return handpass
    it+=1

def find_winning_play(hand_A, hand_B, payoff_matrix, verbose = False):
  if verbose:
    print
    print '---------------------------------------------------------'
    print
    print 'Player A\'s hand: ', [card_to_string(x) for x in hand_A]
    print 'Player B\'s hand: ', [card_to_string(x) for x in hand_B]
    print
  n = len(payoff_matrix)
  for i in range(n):
    winning = True
    for j in range(n):
      if payoff_matrix[i][j] == -1:
        winning = False
        break
    if winning:
      if verbose: 
        handpass = get_pass(i)
        print 'Player A has winning strategy by passing:'
        print [card_to_string(hand_A[x]) for x in handpass]
      return 1
  for j in range(n):
    winning = True
    for i in range(n):
      if payoff_matrix[i][j] == 1:
        winning = False
        break
    if winning:
      if verbose: 
        handpass = get_pass(j)
        print 'Player B has winning strategy by passing:'
        print [card_to_string(hand_B[x]) for x in handpass]
      return -1
  if verbose:
    print 'No winning play!'
    print
    print '---------------------------------------------------------'
  return 0
  
if __name__=="__main__":
  tally = {1: 0, 0: 0, -1: 0}
  while True:
    t = time.time()
    (hand_A, hand_B) = generate_hands()
    payoff_matrix = get_payoff_matrix(hand_A, hand_B)
    #print 'got payoff matrix'
    #print time.time() - t , 'seconds elapsed'
  
    t = time.time()
    winner = find_winning_play(hand_A, hand_B, payoff_matrix)
    tally[winner] += 1
    print tally
    print (tally[1] + tally[-1]) / (tally[1] + tally[-1] + tally[0] + 0.0) 

