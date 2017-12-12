from __future__ import division
from __future__ import print_function

import argparse
import json
import random
import sys

parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('--seed', type=int, default=0, help='Random seed')
parser.add_argument('--dictionary', type=str, default='duet_words.txt',
                    help='Words to use')
parser.add_argument('--logfile', type=str, default='game_log.json',
                    help='Where to write game log')
parser.add_argument('--player', type=int, default=1,
                    help='Player 1 or 2?')

class colors:
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    RED = '\033[91m'
    END = '\033[0m'

def colored(str, color):
    return color + str + colors.END

def strike(text):
    return ''.join([u'\u0336{}'.format(c) for c in text])

def colored_for_state(str, state):
    if state == -1:
        return colored(str, colors.RED)
    elif state == 1:
        return colored(str, colors.BLUE)
    else:
        assert state == 0
        return colored(str, colors.YELLOW)

def print_grid(words, states, reverse=False):
    assert len(words) == 25
    print()
    for i in range(5):
        str = '    '
        for j in range(5):
            if reverse:
                index = 5*(4-i) + (4-j)
            else:
                index = 5*i + j
            word = words[index]
            state = states[word]
            str += colored_for_state('{:<20}'.format(words[index]), state)
        print(str)
    print()

def find_word(words, word):
    return words.index(word.upper())

def ask_word(question, words):
    while True:
        word = raw_input(question)
        index = find_word(words, word)
        if index >= 0:
            return index

def other(player):
    assert player == 1 or player == 2
    return 2 if player == 1 else 1

def setup(dictionary):
    words = sorted(random.sample(dictionary, 25))

    # states: 1 = good, 0 = bystander, -1 = assassin
    p1state = {}
    p2state = {}

    i = 0
    def add_state(num, p1, p2, i):
        for _ in range(num):
            p1state[words[i]] = p1
            p2state[words[i]] = p2
            i += 1
        assert i <= len(words)
        return i

    # 5 cards only p1 knows
    i = add_state(5, 1, 0, i)
    # 5 cards only p2 knows
    i = add_state(5, 0, 1, i)
    # 3 cards both p1 and p2 know
    i = add_state(3, 1, 1, i)
    # 1 assassin card only p1 knows
    i = add_state(1, -1, 0, i)
    # 1 assassin card only p2 knows
    i = add_state(1, 0, -1, i)
    # 1 assassin card only p1 knows, also good for p2
    i = add_state(1, -1, 1, i)
    # 1 assassin card only p2 knows, also good for p1
    i = add_state(1, 1, -1, i)
    # 1 assassin card both p1 and p2 know
    i = add_state(1, -1, -1, i)
    # the rest are bystanders
    i = add_state(7, 0, 0, i)
    assert i == len(words)

    random.shuffle(words)

    return words, p1state, p2state

def duet(args):
    player = args.player

    assert args.player == 1 or args.player == 2
    random.seed(args.seed)
    with open(args.dictionary) as f:
        dictionary = map(lambda x: x.upper(), filter(len, f.read().split()))
    words, p1state, p2state = setup(dictionary)
    if args.player == 1:
        print_grid(words, p1state)
    else:
        # could do reverse=True, but no need..
        print_grid(words, p2state)

    game_log = []
    round = 1
    cluer = 1
    while round <= 9:

        if cluer == player:
            clue = raw_input('Give a clue? ')
        else:
            clue = raw_input('What did they clue? ')

        game_log.append({
            'round': round,
            'clue': clue,
        })
        round += 1
        cluer = other(cluer)

    index = ask_word('Guess a word? ', words)

    if args.logfile:
        with open(args.logfile, 'w') as f:
            f.write(json.dumps(game_log, indent=2))

if __name__ == "__main__":
    args = parser.parse_args()
    duet(args)
