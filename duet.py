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
    GRAY = '\033[97m'

def bold(str):
    return colors.BOLD + str + colors.END

def colored(str, color):
    return color + str + colors.END

def strike(text):
    return u'\u0336'.join([c for c in text])

def colored_for_state(str, state):
    if state == -1:
        return colored(str, colors.RED)
    elif state == 1:
        return colored(str, colors.BLUE)
    else:
        assert state == 0
        return colored(str, colors.YELLOW)

def print_grid(words, states, guesses_state, reverse=False):
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
            padding = 20 - len(word)
            prefix = '  '
            if guesses_state[index] is not None:
                (was_me, was_correct, round) = guesses_state[index]
                if not was_me:
                    prefix = u'\u25b2'
                else:
                    prefix = ' '
                if was_correct:
                    prefix += colored(u'\u2713', colors.GREEN)
                    word = strike(word)
                else:
                    prefix += colored(u'\u2717', colors.RED)
                    if was_me:
                        word = strike(word)

            str += prefix + ' ' + colored_for_state(word, state) + ' ' * padding
        print(str)
    print()

def find_word(words, word):
    try:
        return words.index(word)
    except ValueError:
        return -1

def ask_word(question, words):
    while True:
        word = raw_input(question)
        if word == '-':
            return None
        word = word.upper()
        index = find_word(words, word)
        if index >= 0:
            return word
        print('That word is not on the board!')

def other(player):
    assert player == 1 or player == 2
    return 2 if player == 1 else 1

def setup(dictionary):
    words = sorted(random.sample(dictionary, 25))

    # states: 1 = good, 0 = bystander, -1 = assassin
    p1board = {}
    p2board = {}

    i = 0
    def add_state(num, p1, p2, i):
        for _ in range(num):
            p1board[words[i]] = p1
            p2board[words[i]] = p2
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

    return words, p1board, p2board

def duet(args):
    player = args.player

    assert args.player == 1 or args.player == 2
    random.seed(args.seed)
    with open(args.dictionary) as f:
        dictionary = map(lambda x: x.upper(), filter(len, f.read().split()))
    words, p1board, p2board = setup(dictionary)

    game_log = []

    all_guesses = {} # dict from index to (player, correct, round)

    def print_game():
        guesses_state = []
        for i in range(25):
            if words[i] in all_guesses:
                (p, correct, round) = all_guesses[words[i]]
                guesses_state.append((p == player, correct, round))
            else:
                guesses_state.append(None)
        if player == 1:
            print_grid(words, p1board, guesses_state)
        else:
            # could do reverse=True, but no need..
            print_grid(words, p2board, guesses_state)

    round = 1
    cluer = 1
    ncorrect = 0
    lost = False

    def write_log():
        if args.logfile:
            with open(args.logfile, 'w') as f:
                f.write(json.dumps({
                    'won': not lost,
                    'board': [p1board, p2board],
                    'log': game_log
                }, indent=2))

    while round <= 9:
        print()
        print('-- ROUND 1 --')
        print()
        print_game()

        if cluer == 1:
            state = p1board
        else:
            state = p2board

        if cluer == player:
            clue = raw_input('Give a clue: ')
        else:
            clue = raw_input('What did they clue? ')

        round_guesses = []
        while True:
            if cluer == player:
                guessed = ask_word('What did they guess (Dash if nothing)? ', words)
                who = 'They'
            else:
                guessed = ask_word('Guess a word (Dash to stop): ', words)
                who = 'You'
            if guessed is None:
                break
            round_guesses.append(guessed)
            if state[guessed] == -1:
                print(colored('YOU LOSE (guessed an assassin)!', colors.RED))
                lost = True
                break
            elif state[guessed] == 0:
                print(colored('%s guessed a bystander!' % who, colors.YELLOW))
                all_guesses[guessed] = (other(cluer), False, round)
                break
            else:
                print(colored('%s recovered an agent!  %s may guess again.' % (who, who), colors.GREEN))
                all_guesses[guessed] = (other(cluer), True, round)
                ncorrect += 1
                print_game()
                if ncorrect == 15: # won!
                    break

        game_log.append({
            'round': round,
            'clue': clue,
            'guesses': round_guesses,
            'ncorrect': ncorrect,
        })
        if lost:
            return write_log()

        if ncorrect == 15:
            print(colored('YOU WIN!', colors.GREEN))
            return write_log()

        round += 1
        cluer = other(cluer)

    lost = True
    print(colored('YOU LOSE (no more turns)!', colors.GREEN))
    return write_log()

if __name__ == "__main__":
    args = parser.parse_args()
    duet(args)
