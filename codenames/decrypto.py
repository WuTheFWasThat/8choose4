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

if __name__ == "__main__":
    args = parser.parse_args()
    n = 4
    # duet(args)
    with open(args.dictionary) as f:
        dictionary = list(map(lambda x: x.upper(), filter(len, f.read().split())))
    random.seed(args.seed)
    while True:
        words = random.sample(dictionary, n)
        print(words)
        for _ in range(2):
            x = None
            while x != 'y':
                x = input('get order?')
            i = list(range(1, n+1))
            random.shuffle(i)
            print(i[:-1])
        input('Game over!')

