from __future__ import division
from __future__ import print_function
from builtins import input

import argparse
import json
import random

parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('--seed', type=int, default=0, help='Random seed')
parser.add_argument('--dictionary', type=str, default='dictionaries/kodenames.txt',
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

def colored(str, color):
    return color + str + colors.END

def strike(text):
    return u'\u0336'.join([c for c in text]) + u'\u0336'

def colored_for_state(str, state):
    if state == -1:
        return colored(str, colors.RED)
    elif state == 1:
        return colored(str, colors.BLUE)
    else:
        assert state == 0
        return colored(str, colors.YELLOW)

def print_grid(words, states, guesses_state):
    assert len(words) == 25
    for i in range(5):
        str = '    '
        for j in range(5):
            index = 5*i + j
            word = words[index]
            state = states[word]
            padding = 20 - len(word)
            prefix = '   '
            if guesses_state[index] is not None:
                (was_me, was_correct, round) = guesses_state[index]
                if not was_me:
                    prefix = u'\u25b2 '
                else:
                    prefix = '  '
                if was_correct:
                    prefix += colored(u'\u2713', colors.GREEN)
                    word = strike(word)
                else:
                    prefix += colored(u'\u2717', colors.RED)
                    if was_me:
                        word = strike(word)

            str += prefix + ' ' + colored_for_state(word, state) + ' ' * padding
        print(str)

def ask_word(question, words):
    while True:
        word = input(question).upper()
        if word == '-':
            return None
        try:
            words.index(word)
            return word
        except ValueError:
            print('That word is not on the board!')

def other(player):
    assert player == 1 or player == 2
    return 2 if player == 1 else 1

# TODO: implement replaying from logs

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

    i = add_state(5, 1, 0, i)   # 5 cards only p1 knows
    i = add_state(5, 0, 1, i)   # 5 cards only p2 knows
    i = add_state(3, 1, 1, i)   # 3 cards both p1 and p2 know
    i = add_state(1, -1, 0, i)  # 1 assassin card only p1 knows
    i = add_state(1, 0, -1, i)  # 1 assassin card only p2 knows
    i = add_state(1, -1, 1, i)  # 1 assassin card only p1 knows, also good for p2
    i = add_state(1, 1, -1, i)  # 1 assassin card only p2 knows, also good for p1
    i = add_state(1, -1, -1, i) # 1 assassin card both p1 and p2 know
    i = add_state(7, 0, 0, i)   # the rest are bystanders
    assert i == len(words)

    random.shuffle(words)

    return words, p1board, p2board

def duet(args):
    player = args.player
    assert player == 1 or player == 2

    with open(args.dictionary) as f:
        dictionary = list(map(lambda x: x.upper(), filter(len, f.read().split())))
    random.seed(args.seed)
    words, p1board, p2board = setup(dictionary)

    all_guesses = {} # dict from index to (player, correct, round)

    def print_game():
        guesses_state = []
        for i in range(25):
            if words[i] in all_guesses:
                (p, correct, round) = all_guesses[words[i]]
                guesses_state.append((p == player, correct, round))
            else:
                guesses_state.append(None)
        print()
        print_grid(words, p1board if player == 1 else p2board, guesses_state)
        print()

    game_log = []
    lost = False

    def write_log():
        if args.logfile:
            with open(args.logfile, 'w') as f:
                f.write(json.dumps({
                    'won': not lost,
                    'board': [p1board, p2board],
                    'log': game_log
                }, indent=2))

    round = 1
    cluer = random.randint(1, 2)
    ncorrect = 0
    nmistakes = 0
    while round <= 9:
        print()
        print('-' * 50 + ' ROUND %d of 9 ' % round + '-' * 50)
        print('%d/15 agents remaining' % (15 - ncorrect))
        print_game()

        state = p1board if cluer == 1 else p2board

        clue = input('Give a clue: ' if cluer == player else 'What did they clue? ')

        round_guesses = []
        while True:
            who = 'They' if cluer == player else 'You'
            guessed = ask_word('What did %s guess (Dash if nothing)? ' % who.lower(), words)
            if guessed is None: break
            round_guesses.append(guessed)
            if state[guessed] == -1:
                print(colored('YOU LOSE (guessed an assassin)!', colors.RED))
                lost = True
                break
            elif state[guessed] == 0:
                print(colored('%s guessed a bystander!' % who, colors.YELLOW))
                all_guesses[guessed] = (other(cluer), False, round)
                nmistakes += 1
                break
            else:
                print(colored('%s recovered an agent!  %s may guess again.' % (who, who), colors.GREEN))
                all_guesses[guessed] = (other(cluer), True, round)
                ncorrect += 1
                print_game()
                if ncorrect == 15: break # won!

        game_log.append({
            'round': round,
            'clue': clue,
            'guesses': round_guesses,
            'ncorrect': ncorrect,
            'nmistakes': nmistakes,
        })
        if lost: return write_log()

        if ncorrect == 15:
            print(colored('YOU WIN!', colors.GREEN))
            return write_log()

        round += 1
        cluer = other(cluer)

    # TODO: implement sudden death

    lost = True
    print(colored('YOU LOSE (out of time)!', colors.GREEN))
    return write_log()

if __name__ == "__main__":
    args = parser.parse_args()
    duet(args)
