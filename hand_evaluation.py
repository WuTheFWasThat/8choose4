import collections
import contextlib
import itertools
import json
import time

def best_poker_hand(cards):
    all_hands = itertools.combinations(cards, 5)
    best = None
    for hand in all_hands:
        if (not best) or old_compare_poker_hand(hand, best) > 0:
            best = hand
    return best

def old_compare_poker_hand(handA, handB):
    classA = old_full_classify_hand(handA)
    classB = old_full_classify_hand(handB)
    if classA[0] != classB[0]:
        return classA[0] - classB[0]
    else:
        return classA[1] - classB[1]

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
STRAIGHT_FLUSH = 9
KIND4          = 8
FULL_HOUSE     = 7
FLUSH          = 6
STRAIGHT       = 5
KIND3          = 4
TWO_PAIR       = 3
PAIR           = 2
HIGH           = 1

pow_base= 100
pows = [pow_base**i for i in range(5)]

hands_memo = None
def classify_hand(hand):
  return full_classify_hand(hand);
  global hands_memo
  if not hands_memo:
      with profiler('Loading memo...'):
          with open('final_hands_memo.dat') as f:
              hands_memo = json.load(f)
  key = str(sorted(hand))
  return hands_memo[key]

def get_straight(ranks): # set of numbers
  rank_order = [14] + range(2, 15)
  streak = 0
  for i in range(13, -1, -1):
    if rank_order[i] in ranks:
      streak += 1
      if streak == 5:
        return rank_order[i + 4]
    else:
      streak = 0
  return 0

def get_tiebreak(ranks, num = 5): # returns tiebreaker number for a set of 5 cards (taking the 5 highest)
  ranks = list(ranks)
  ranks.sort()
  tiebreak = 0
  for i in range(-1, -num-1, -1):
    tiebreak *= pow_base
    tiebreak += ranks[i]
  return tiebreak


SUITS = ['c', 'd', 'h', 's']
# return (category, strength)
# strength denotes the value for tiebreaking same category

def old_full_classify_hand(hand):
    if (len(hand) != 5): raise Error('hand of wrong size')
    
    #####################
    # ORGANIZE BY SUITS
    #####################

    suits = [card[1] for card in hand]
    # put into buckets
    suit_hands = {x: set() for x in SUITS}
    for card in hand:
      suit_hands[card[1]].add(card[0])

    #####################
    # ORGANIZE BY RANKS
    #####################

    ranks = [card[0] for card in hand]
    ranks.sort()

    is_flush = (suits.count(suits[0]) == 5) 

    # care only about ranks now
    is_straight = True
    for i in range(4):
        if ranks[i+1] != ranks[i] + 1:
            is_straight = False
            break   
    # special A 2 3 4 5 case
    if ranks[0] == 2 and ranks[1] == 3 and ranks[2] == 4 and ranks[3] == 5 and ranks[4] == 14:
        is_straight = True
    
    # put into buckets
    cnt = collections.Counter()
    for x in ranks:
        cnt[x] += 1
    amts = cnt.most_common()
    
    # straight flush
    if (is_flush and is_straight):
        cat = STRAIGHT_FLUSH
        # tiebreak by high card
        stre = ranks[4]
        # A 2 3 4 5 case
        if ranks[4] == 14 and ranks[3] == 5: stre = 5
        return (cat, stre)
    
    # four of a kind
    if amts[0][1] == 4:
        return (KIND4, amts[0][0])
    
    # full house
    if amts[0][1] == 3 and amts[1][1] == 2:
        return (FULL_HOUSE, amts[0][0])
        
    # flush
    if (is_flush):
        cat = FLUSH
        stre = 0
        for i in range(5):
            stre += ranks[i]*pows[i]
        return (cat, stre)
    
    # straight
    if is_straight:
        cat = STRAIGHT
        #tiebreak by high card
        stre = ranks[4]
        #A 2 3 4 5 case
        if ranks[4] == 14 and ranks[3] == 5: stre = 5
        return (cat, stre)
    
    # trips
    if amts[0][1] == 3:
        return (KIND3, amts[0][0])
        
    # 2 pair
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
            stre += tiebreaker[i]*pows[i]
        return (cat, stre)
        
    # pair
    if amts[0][1] == 2:
        cat = PAIR
        #sort other vals
        others = [amts[i][0] for i in range(1,4)]
        others.sort()
        others.append(amts[0][0])
        stre = 0
        for i in range(4):
            stre += others[i]*pows[i]
        return (cat, stre)
        
    #high card
    cat = HIGH
    stre = 0
    for i in range(5):
        stre += ranks[i]*pows[i]
    return (cat, stre)

def full_classify_hand(hand):
    if (len(hand) < 5): raise Error('hand of wrong size')
    
    #####################
    # ORGANIZE BY SUITS
    #####################

    suits = [card[1] for card in hand]
    # put into buckets
    suit_hands = {x: set() for x in SUITS}
    for card in hand:
      suit_hands[card[1]].add(card[0])

    #####################
    # ORGANIZE BY RANKS
    #####################

    ranks = [card[0] for card in hand]
    ranks.sort()
    # put into buckets

    rank_counts = [0 for i in range(15)]
    for x in ranks:
      rank_counts[x] += 1
    rank_count_sets = {x: set() for x in range(1,5)}
    for i in xrange(2, 15):
      count = rank_counts[i]
      if count in rank_count_sets:
        rank_count_sets[count].add(i)
      else:
        assert count == 0

    # CHECK FOR A STRAIGHT FLUSH

    max_straight_flush = 0
    for suit in suit_hands:
      if len(suit_hands[suit]) >= 5:
        straight_num = get_straight(suit_hands[suit])
        if straight_num > max_straight_flush:
          max_straight_flush = straight_num
    if max_straight_flush > 0:
      # tiebreak by high card
      return (STRAIGHT_FLUSH, max_straight_flush)

    # CHECK FOR FOUR OF A KIND

    if len(rank_count_sets[4]) > 0:
      return (KIND4, max(rank_count_sets[4]))

    # CHECK FOR FULL HOUSE

    if (len(rank_count_sets[3]) >= 2) or (len(rank_count_sets[3]) == 1 and len(rank_count_sets[2]) >= 1):
      trips = max(rank_count_sets[3])
      return (FULL_HOUSE, trips)

    # CHECK FOR FLUSH

    max_tiebreak = 0
    for suit in suit_hands:
      if len(suit_hands[suit]) >= 5:
        num = get_tiebreak(suit_hands[suit])
        if num > max_tiebreak:
          max_tiebreak = num
    if max_tiebreak > 0:
      return (FLUSH, max_tiebreak)

    # CHECK FOR STRAIGHT      

    high_rank = get_straight(ranks)
    if high_rank > 0:
      return (STRAIGHT, high_rank)

    # CHECK FOR THREE OF A KIND

    if (len(rank_count_sets[3]) >= 1):
      assert len(rank_count_sets[2]) == 0 and len(rank_count_sets[3]) == 1 and len(rank_count_sets[4]) == 0
      return (KIND3, get_tiebreak(rank_count_sets[1], 2))

    # CHECK FOR TWO-PAIR       

    if (len(rank_count_sets[2]) >= 2):
      assert len(rank_count_sets[3]) == 0 and len(rank_count_sets[4]) == 0
      sorted_pairs = sorted(list(rank_count_sets[2]))
      remaining_candidates = set(sorted_pairs[:-2]).union(rank_count_sets[1])
      tiebreak = sorted_pairs[-1] * pows[2] + sorted_pairs[-2] * pows[1] + max(remaining_candidates)
      return (TWO_PAIR, tiebreak)

    # CHECK FOR PAIR           

    if (len(rank_count_sets[2]) >= 1):
      assert len(rank_count_sets[2]) == 1 and len(rank_count_sets[3]) == 0 and len(rank_count_sets[4]) == 0
      pair = max(rank_count_sets[2])
      tiebreak = pair * pows[3] + get_tiebreak(rank_count_sets[1], 3)
      return (PAIR, tiebreak)

    # CHECK FOR HIGH           
    assert len(rank_count_sets[2]) == 0 and len(rank_count_sets[3]) == 0 and len(rank_count_sets[4]) == 0
    tiebreak = get_tiebreak(rank_count_sets[1])
    return (HIGH, tiebreak)

def hash_hand(hand):
    return str(sorted(hand))

profiling_depth = 0

def pretty_print(msg):
    global profiling_depth
    print '%s%s' % (profiling_depth*'  ', msg)


@contextlib.contextmanager
def profiler(msg):
    global profiling_depth
    pretty_print(msg)
    profiling_depth += 1
    cur_time = time.time()
    yield
    elapsed_time = time.time() - cur_time
    profiling_depth -= 1
    pretty_print('Done! Took %04fs.' % (elapsed_time,))


def precompute_hands():
    deck = [(value, suit) for value in xrange(2, 15) for suit in ('c', 'd', 'h', 's')]
    memo = {}
    max_size = 2598960
    pct_done = 0
    with profiler('Computing %s hand strengths...' % (max_size,)):
        for hand in itertools.combinations(deck, 5):
            strength = classify_hand(hand)
            key = hash_hand(hand)
            assert(key not in memo), 'Collision at %s hands.' % (len(memo),)
            memo[key] = strength
            if len(memo) > (pct_done + 1)*max_size/100:
                pct_done += 1
                pretty_print('%s%% done' % (pct_done,))
    assert(len(memo) == max_size)
    print 'Got %s hands total.' % (len(memo),)
    with profiler('Dumping to JSON...'):
        memo_json = json.dumps(memo)
    with profiler('Writing to disk...'):
        with open('hands_memo.dat', 'w') as f:
            f.write(memo_json)


if __name__ == '__main__':
    #precompute_hands()
    pass
