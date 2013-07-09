import collections
import itertools

#testing
def get_card(i):
    ranks = range(1,14)
    rank = ranks[i % 13]
    suits = ['c', 'd', 'h', 's']
    suit = suits[i % 4]
    return (rank, suit)
    
def get_cards(*args):
    return [get_card(i) for i in args]

#give best 5 card hand out of a list of cards
def best_poker_hand(cards):
    all_hands = itertools.combinations(cards, 5)
    best = None
    for hand in all_hands:
        if (not best) or compare_poker_hand(hand, best) > 0:
            best = hand
    return best
    
#returns < 0 if hand a < hand b
#returns 0 if hand a ties hand b
# returns > 0 if hand a > hand b
def compare_poker_hand(handA, handB):
    classA = classify_hand(handA)
    classB = classify_hand(handB)
    if classA[0] != classB[0]:
        return classA[0] - classB[0]
    else:
        return classA[1] - classB[1]

def poker_hand_comparator(handA, handB):
  diff = compare_poker_hand(handA, handB)
  if diff > 0:
    return 1
  elif diff == 0:
    return 0
  else:
    return -1
    
#categories:
STRAIGHT_FLUSH = -1
KIND4 = -2
FULL_HOUSE = -3
FLUSH = -4
STRAIGHT = -5
KIND3 = -6
TWO_PAIR = -7
PAIR = -8
HIGH = -9

#return (category, strength)
#strength denotes the value for tiebreaking same category
def classify_hand(hand):
    if (len(hand) != 5): raise Error('hand of wrong size')
    
    #flush?
    suits = [card[1] for card in hand]
    is_flush = (len(set(suits)) == 1)
    
    #care only about ranks now
    ranks = [card[0] for card in hand]
    #replace aces (1) with (14) (sigh)
    ranks = [14 if x==1 else x for x in ranks]
    ranks.sort()
    
    #straight?
    is_straight = True
    for i in range(4):
        if ranks[i+1] != ranks[i] + 1:
            is_straight = False
            break   
    #special A 2 3 4 5 case
    if ranks[0] == 2 and ranks[1] == 3 and ranks[2] == 4 and ranks[3] == 5 and ranks[4] == 14:
        is_straight = True
    
    #put into buckets
    cnt = collections.Counter()
    for x in ranks:
        cnt[x] += 1
    amts = cnt.most_common()
    
    
    #straight flush
    if (is_flush and is_straight):
        cat = STRAIGHT_FLUSH
        #tiebreak by high card
        stre = ranks[4]
        #A 2 3 4 5 case
        if ranks[4] == 14 and ranks[3] == 5: str = 5
        return (cat, stre)
    
    #four of a kind
    if amts[0][1] == 4:
        return (KIND4, amts[0][0])
    
    #full house
    if amts[0][1] == 3 and amts[1][1] == 2:
        return (FULL_HOUSE, amts[0][0])
        
    #flush
    if (is_flush):
        cat = FLUSH
        stre = 0
        for i in range(5):
            stre += ranks[i]*(100**i)
        return (cat, stre)
    
    #straight
    if is_straight:
        cat = STRAIGHT
        #tiebreak by high card
        stre = ranks[4]
        #A 2 3 4 5 case
        if ranks[4] == 14 and ranks[3] == 5: str = 5
        return (cat, stre)
    
    #trips
    if amts[0][1] == 3:
        return (KIND3, amts[0][0])
        
    #2 pair
    if amts[0][1] == 2 and amts[1][1] == 2:
        cat = TWO_PAIR
        #sort pairvalues
        pv1 = amts[0][0]
        pv2 = amts[1][0]
        if pv1 < pv2:
            pv1, pv2 = (pv2, pv1)
        tiebreaker = [amts[2][0], pv2, pv1]
        stre = 0
        for i in range(3):
            stre += tiebreaker[i]*(100**i)
        return (cat, stre)
        
    #pair
    if amts[0][1] == 2:
        cat = PAIR
        #sort other vals
        others = [amts[i][0] for i in [1,2,3]]
        others.sort()
        others.append(amts[0][0])
        stre = 0
        for i in range(4):
            stre += others[i]*(100**i)
        return (cat, stre)
        
    #high card
    cat = HIGH
    stre = 0
    for i in range(5):
        stre += ranks[i]*(100**i)
    return (cat, stre)
