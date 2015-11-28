# -*- coding: utf-8 -*-

DEFAULT_COLOR = 'black'
COLOR_CODES = {
    'red': '\033[91m',
    'green': '\033[92m',
    'yellow': '\033[93m',
    'light_purple': '\033[94m',
    'purple': '\033[95m',
}
COLOR_CODES_END = '\033[0m'

def colorize(string, color):
    if color != DEFAULT_COLOR:
        string = COLOR_CODES[color] + string + COLOR_CODES_END
    return string

class CardSuit(object):
    def __init__(self, suit, display, color, value):
        self.suit = suit
        self.display = display
        assert color == DEFAULT_COLOR or color in COLOR_CODES
        self.color = color
        self.value = value
    def __eq__(self, other):
        return self.suit == other.suit
    def __lt__(self, other):
        return self.value < other.value
    def __gt__(self, other):
        return self.value > other.value
    def __uncolored_str__(self):
        return self.display.encode('utf-8')
    def __str__(self):
        return colorize(self.__uncolored_str__(), self.color)
    def __repr__(self):
        return self.__str__()
    def __hash__(self):
        return hash(self.suit)
    def __copy__(self):
        return self.__deepcopy__()
    def __deepcopy__(self):
        return CardSuit(self.suit, self.display, self.color, self.value)

class CardValue(object):
    def __init__(self, value, display):
        self.value = value
        self.display = display

    def __eq__(self, other):
        return self.value == other.value
    def __lt__(self, other):
        return self.value < other.value
    def __gt__(self, other):
        return self.value > other.value
    def __str__(self):
        return self.display
    def __repr__(self):
        return self.__str__()
    def __copy__(self):
        return self.__deepcopy__()
    def __deepcopy__(self):
        return CardValue(self.value, self.display)


class Card(object):
    def __init__(self, suit, value):
        assert type(suit).__name__ == 'CardSuit'
        self.suit = suit

        assert type(value).__name__ == 'CardValue'
        self.value = value

    def __eq__(self, other):
        return (self.value == other.value) and (self.suit == other.suit)
    def __lt__(self, other):
        return (self.value < other.value) or ((self.value == other.value) and (self.suit < other.suit))
    def __gt__(self, other):
        return (self.value > other.value) or ((self.value == other.value) and (self.suit > other.suit))

    def __str__(self):
        return colorize(str(self.value) + self.suit.__uncolored_str__(), self.suit.color)
    def __repr__(self):
        return self.__str__()
    def __copy__(self):
        return Card(self.suit.__copy__(), self.value.__copy__())
    def __deepcopy__(self):
        return Card(self.suit.__deepcopy__(), self.value.__deepcopy__())

CLUBS    = CardSuit('Clubs', u'\u2667', 'black', 1)
DIAMONDS = CardSuit('Diamonds', u'\u2662', 'red', 2)
HEARTS   = CardSuit('Hearts', u'\u2661', 'red', 3)
SPADES   = CardSuit('Spades', u'\u2664', 'black', 4)

SUITS = [ CLUBS, DIAMONDS, HEARTS, SPADES]

ACE   = CardValue(1, 'A')
TWO   = CardValue(2, '2')
THREE = CardValue(3, '3')
FOUR  = CardValue(4, '4')
FIVE  = CardValue(5, '5')
SIX   = CardValue(6, '6')
SEVEN = CardValue(7, '7')
EIGHT = CardValue(8, '8')
NINE  = CardValue(9, '9')
TEN   = CardValue(10, '10')
JACK  = CardValue(11, 'J')
QUEEN = CardValue(12, 'Q')
KING  = CardValue(13, 'K')
VALUES = {
    1: ACE,
    2: TWO,
    3: THREE,
    4: FOUR,
    5: FIVE,
    6: SIX,
    7: SEVEN,
    8: EIGHT,
    9: NINE,
    10: TEN,
    11: JACK,
    12: QUEEN,
    13: KING,
}

DECK = [
    Card(suit, value)
    for suit in SUITS
    for value in VALUES.itervalues()
]

