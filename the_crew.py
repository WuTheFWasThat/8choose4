from dataclasses import dataclass, field

@dataclass
class Category():
    name: str
    max: int | None

WIN_X = Category(name="WIN_X", max=1)
WIN_SIMPLE = Category(name="WIN_SIMPLE", max=2)
WIN_VALUE = Category(name="WIN_VALUE", max=1)
WIN_TRUMP = Category(name="WIN_TRUMP", max=1)
WIN_NOT = Category(name="WIN_NOT", max=2)
WIN_NO_OPEN = Category(name="WIN_NO_OPEN", max=1)
WIN_CONSECUTIVE = Category(name="WIN_CONSECUTIVE", max=1)
WIN_SUIT = Category(name="WIN_SUIT", max=1)
WIN_WHICH = Category(name="WIN_WHICH", max=1)
WIN_WITH_SMALL = Category(name="WIN_WITH_SMALL", max=1)
WIN_9S = Category(name="WIN_9S", max=1)
DEFAULT = Category(name="DEFAULT", max=None)

@dataclass
class Mission():
    desc: str
    difficulties: list[int]
    category: Category
    shared: bool = False
    conflicts: list["Mission"] = field(default_factory=list)

ALL_MISSIONS = []
def add_mission(desc, difficulties, category=DEFAULT, shared=False, conflicts=()):
    mission = Mission(
        category=category,
        desc=desc,
        difficulties=difficulties,
        shared=shared,
        conflicts=list(conflicts)
    )
    ALL_MISSIONS.append(mission)

add_mission(
    "Win X tricks (predict the exact number and show)",
    [3, 2, 2],
    WIN_X,
)
add_mission(
    "Win X tricks (predict the exact number but keep hidden)",
    [4, 3, 3],
    WIN_X,
)
add_mission(
    "Win the same number of tricks as the captain (the captain can’t take this mission)",
    [4, 3, 3],
    WIN_X,
)
add_mission(
    "Win fewer tricks than the captain (the captain can’t take this mission)",
    [2, 2, 2],
    WIN_X,
)
add_mission(
    "Win more tricks than the captain (the captain can't take this mission)",
    [2, 2, 3],
    WIN_X,
)
add_mission(
    "Win fewer tricks than everyone else",
    [2, 2, 3],
    WIN_X,
)
add_mission(
    "Win more tricks than everyone else",
    [2, 3, 3],
    WIN_X,
)
add_mission(
    "Win more tricks than everyone else together",
    [3, 4, 5],
    WIN_X,
)

add_mission(
    "Win more tricks than everyone else together",
    [3, 4, 5],
    WIN_X,
)

add_mission(
    "Win a trick where all cards are of lower value than 7",
    [2, 3, 3],
    WIN_VALUE,
)
add_mission(
    "Win a trick where all cards are of greater value than 5",
    [2, 3, 4],
    WIN_VALUE,
)

add_mission(
    "Win a trick that has only even numbers (2,4,6,8)",
    [3, 5, 6],
    WIN_VALUE,
)

add_mission(
    "Win a trick that has only odd numbers (1,3,5,7,9)",
    [2, 4, 5],
    WIN_VALUE,
)

add_mission(
    "Win a trick with a total value higher than 23/28/31 (3/4/5 players) without trumps",
    [3, 3, 4],
    WIN_VALUE,
)

add_mission(
    "Win a trick with a total value lower than 8/12/16 (3/4/5 players) without trumps",
    [3, 3, 4],
    WIN_VALUE,
)

add_mission(
    "Win a trick with a total value of 22 or 23",
    [3, 3, 4],
    WIN_VALUE,
)

add_mission(
    "Win a trick with a 6.",
    [2, 3, 4],
    WIN_WITH_SMALL,
)
add_mission(
    "Win a trick with a 5.",
    [2, 3, 4],
    WIN_WITH_SMALL,
)
add_mission(
    "Win a trick with a 3.",
    [3, 4, 5],
    WIN_WITH_SMALL,
)
add_mission(
    "Win a trick with a 2.",
    [3, 4, 5],
    WIN_WITH_SMALL,
)

win_5_with_7 = add_mission(
    "Win a 5 with a 7.",
    [1, 2, 2],
    WIN_WITH_SMALL,
    # conflicts=[nowin_7],
)

add_mission(
    "Win an 8 with a 4.",
    [3, 4, 5],
    WIN_WITH_SMALL,
)

add_mission(
    "Win any 6 with a another 6.",
    [2, 3, 4],
)


SUITS = ["♠", "♥", "♣", "♦"]
for suit in SUITS:
     for rank in range(1, 7):
        add_mission(
            f"Win the {suit} {rank}",
            [1, 1, 1],
            category=WIN_SIMPLE,
        )

add_mission(
    "Win all four 3s.",
    [3, 4, 5],
)

add_mission(
    "Win at least three 5s.",
    [3, 4, 5],
)

add_mission(
    "Win at least two 7s.",
    [2, 2, 2],
)

add_mission(
    "Win at least three 9s.",
    [3, 4, 5],
    WIN_9S,
)

add_mission(
    "Win all four 9s.",
    [4, 5, 6],
    WIN_9S,
)

add_mission(
    "Win exactly two 9s",
    [2, 3, 3],
    WIN_9S,
)

add_mission(
    "Win exactly one 9",
    [2, 2, 2],
    WIN_9S,
)


add_mission(
    "Win exactly three 6s",
    [3, 4, 4],
)

for suit in SUITS:
    add_mission(
        f"Win the {suit} 1,2 and 3",
        [2, 3, 3],
    )

add_mission(
    f"Win at least one of each number 1-9",
    [4, 5, 6],
)

add_mission(
    f"Win a 7, 8, and 9 of different suits",
    [4, 4, 5],
)

add_mission(
    "Win the ♣ 6 and the ♦ 7",
    [2, 2, 3],
)

add_mission(
    "Win the ♠ 5 and ♦ 6",
    [2, 2, 3],
)

add_mission(
    "Win the ♥ 5 and ♣ 8",
    [2, 2, 3],
)

add_mission(
    "Win the ♣ 5 and ♠ 8",
    [2, 2, 3],
)

add_mission(
    "Win the ♠ 9 and ♦ 8",
    [2, 2, 3],
)

add_mission(
    "Win the ♠ 1 and ♥ 7",
    [2, 2, 2],
)

add_mission(
    "Win the ♦ 9 and ♣ 7",
    [2, 3, 3],
)

add_mission(
    "Win the ♥ 3 and the ♦ 4 and 5",
    [3, 4, 4],
)

add_mission(
    "Win the ♥ 2 in the last trick",
    [3, 4, 5],
)

add_mission(
    "Two 1s in the last trick",
    [5, 4, 4],
    shared=True,
)

add_mission(
    "Win exactly one ♠ and one ♥ card",
    [4, 4, 4],
    WIN_SUIT,
)

for suit in SUITS[:2]:
    add_mission(
        f"Win at least seven {suit} cards",
        [3, 3, 3],
        WIN_SUIT,
    )
    add_mission(
        f"Win exactly one {suit} card",
        [3, 3, 3],
        WIN_SUIT,
    )

for suit in SUITS[2:]:
    add_mission(
        f"Win at least five {suit} cards",
        [2, 2, 2],
        WIN_SUIT,
    )
    add_mission(
        f"Win exactly two {suit} cards",
        [3, 4, 4],
        WIN_SUIT,
    )


add_mission(
    "Win no ♠ cards.",
    [2, 2, 2],
    WIN_NOT,
)

add_mission(
    "Win at least one card of each suit (excluding trump)",
    [2, 3, 4],
    WIN_SUIT,
)

add_mission(
    "Win all cards of at least one suit (excluding trump)",
    [3, 4, 5],
    WIN_SUIT,
)

add_mission(
    "Win exactly one trump, or hold all trumps",
    [3, 3, 3],
    WIN_TRUMP,
)

add_mission(
    "Win the J trump",
    [None, 2, 2],
    WIN_TRUMP,
)

add_mission(
    "Win the Q trump",
    [2, 2, 2],
    WIN_TRUMP,
)

add_mission(
    "Win the K trump",
    [2, 2, 2],
    WIN_TRUMP,
)

add_mission(
    "Win exactly 3 trumps, or hold all trumps",
    [None, 3, 3],
    WIN_TRUMP,
)

add_mission(
    "Win exactly 2 trumps, or hold all trumps",
    [3, None, None],
    WIN_TRUMP,
)

add_mission(
    "Win the ♠ 7 with a trump",
    [3, 3, 3],
)

add_mission(
    "Win the ♥ 9 with a trump",
    [3, 3, 3],
)

# add_mission(
#     "Don’t open a trick with a ♠, ♦ or ♣ card",
#     [4, 3, 3],
#     WIN_NO_OPEN,
# )

add_mission(
    "Don't open a trick with a ♠ or ♥ card",
    [2, 1, 1],
    WIN_NO_OPEN,
)

add_mission(
    "Don't open a trick with a ♦ or ♣ card",
    [2, 1, 1],
    WIN_NO_OPEN,
)

add_mission(
    "Don't open a trick with a trump card",
    [2, 2, 2],
    WIN_NO_OPEN,
)

add_mission(
    "Don't win a trick with a ♦ card",
    [4, 3, 3],
    WIN_NO_OPEN,
)

add_mission(
    "Don't win a trick with a ♥ card",
    [4, 3, 3],
    WIN_NO_OPEN,
)

add_mission(
    "Don't win any trumps",
    [1, 1, 1],
    WIN_NOT,
)

for suit in SUITS:
    add_mission(
        f"Don’t win any {suit} cards",
        [2, 2, 2],
        WIN_NOT,
    )

nowin_7 = add_mission(
    f"Don’t win with a 7",
    [3, 3, 3],
    shared=True,
    conflicts=[win_5_with_7],
)

nowin_8 = add_mission(
    f"Don’t win with a 8",
    [4, 4, 4],
    shared=True,
)

add_mission(
    f"Don’t play trump in a trick opened with ♠",
    [3, 3, 3],
    shared=True,
)

add_mission(
    f"Don’t open a trick with ♠",
    [5, 5, 5],
    shared=True,
)

add_mission(
    f"On one trick, each card besides the opener must be played face down",
    [2, 2, 2],
    shared=True,
)


add_mission(
    "Don’t win any ♠ or ♣ cards",
    [3, 3, 3],
    WIN_NOT,
)

add_mission(
    "Don’t win any ♦ or ♥ cards",
    [3, 3, 3],
    WIN_NOT,
)

add_mission(
    "Don’t win any 8s or 9s",
    [3, 3, 2],
    WIN_NOT,
)

add_mission(
    "Don’t win any 9s",
    [1, 1, 1],
    WIN_NOT,
)

add_mission(
    "Don’t win any 5s",
    [1, 2, 2],
    WIN_NOT,
)

add_mission(
    "Don’t win any 1s",
    [2, 2, 2],
    WIN_NOT,
)

add_mission(
    "Don’t win any 1s, 2s or 3s",
    [3, 3, 3],
    WIN_NOT,
)

add_mission(
    "Don’t win any of the first four tricks",
    [1, 2, 3],
    WIN_NOT,
)

add_mission(
    "Don’t win any of the first three tricks",
    [1, 2, 2],
    WIN_NOT,
)

add_mission(
    "Don’t win any of the first five tricks",
    [2, 3, 3],
    WIN_NOT,
)

add_mission(
    "Don’t win any tricks",
    [4, 3, 3],
    WIN_NOT,
)

add_mission(
    "Win the last trick",
    [2, 3, 3],
    WIN_X,
)

add_mission(
    "Win the first three tricks",
    [2, 3, 4],
    WIN_X,
)

add_mission(
    "Win the first two tricks",
    [1, 1, 2],
    WIN_X,
)

add_mission(
    "Win the first trick",
    [1, 1, 1],
    WIN_X,
)

add_mission(
    "Win the first and the last trick",
    [3, 4, 4],
    WIN_X,
)

add_mission(
    "Win only the last trick",
    [4, 4, 4],
    WIN_X,
)

add_mission(
    "Win only the first trick",
    [4, 3, 3],
    WIN_X,
)

add_mission(
    "Win exactly one trick",
    [3, 2, 2],
    WIN_X,
)

add_mission(
    "Win exactly two tricks",
    [2, 2, 2],
    WIN_X,
)

add_mission(
    "Win exactly four tricks",
    [2, 3, 5],
    WIN_X,
)

add_mission(
    "Do not win two consecutive tricks.",
    [3, 2, 2],
    WIN_CONSECUTIVE,
)

add_mission(
    "Nobody can win two consecutive tricks.",
    [5, 4, 3],
    WIN_CONSECUTIVE,
    shared=True
)

add_mission(
    "Win two consecutive tricks",
    [1, 1, 1],
    WIN_CONSECUTIVE,
)

add_mission(
    "Win three consecutive tricks",
    [2, 3, 4],
    WIN_CONSECUTIVE,
)

add_mission(
    "Win exactly three consecutive tricks.",
    [3, 3, 4],
    WIN_CONSECUTIVE,
)

add_mission(
    "Win exactly two consecutive tricks.",
    [3, 3, 3],
    WIN_CONSECUTIVE,
)

add_mission(
    "Win the same amount of ♠ and ♦ cards (more than 0)",
    [4, 4, 4],
)

add_mission(
    "Win the same amount of ♥ and ♦ cards in a trick (more than 0)",
    [2, 3, 3],
)

add_mission(
    "Win the same amount of ♠ and ♣ cards in a trick (more than 0)",
    [2, 3, 3],
)

add_mission(
    "Win more ♦ cards than ♣ cards",
    [1, 1, 1],
)

add_mission(
    "Win more ♠ cards than ♥ cards",
    [1, 1, 1],
)

import streamlit as st
import random
from collections import defaultdict

if st.toggle("show rules", value=False):
    st.header("rules")
    st.markdown("""
Game is played with:
- 1-9 of each suit
- four trumps: J Q K Joker, remove the J for 3 players

Captain is person who holds joker, who announces themselves
They pick missions first, and have the first lead

Start at level 1.  After each win, go up a level.
After each failure, you may choose whether to re-roll the missions.
""")

st.header("settings")
players = st.radio("Players", [3, 4, 5], horizontal=True)
difficulty = st.slider("Difficulty", min_value=1, max_value=13, value=None, step=1)

# Add a session state to track when to regenerate
if 'random_seed' not in st.session_state:
    st.session_state.random_seed = random.randint(0, 2**32)

# Add the reroll button
if st.button("Reroll Missions"):
    st.session_state.random_seed += 1  # Increment seed to get new random results


def get_missions_and_mods(players, difficulty):
    # Use the seed to get consistent randomization within each "roll"
    random.seed(st.session_state.random_seed)
    missions = []
    mods = []
    players_idx = players - 3
    cat_counts = defaultdict(int)
    difficulty += players
    all_conflicts = []

    if random.random() < 0.1:
        mods.append(
            f"**Shared hints**:  the entire team is allowed {players-1} hints (one player can use multiple)"
        )
    else:
        mods.append(
            "**Individual hints**: Each player is allowed one hint"
        )
    if random.random() < 0.1:
        mods.append(
            "**Reveal-only hints**: hints reveal any (possibly-trump) card, but no additional information about it"
        )
    elif random.random() < 0.1:
        mods.append(
            "**Count hints**: hints reveal the number of cards you have in some non-trump suit"
        )
    else:
        mods.append(
            "**Standard hints**: Hints can only reveal any card that is highest, lowest, or both in a non-trump suit, along with that information (highest/lowest/both)"
        )

    if random.random() < 0.1:
        mods.append(
            "Mission selection proceeds for two rounds"
        )
        difficulty += 1

    if random.random() < 0.1:
        mods.append(
            "**Trading (cw)**: After selecting missions, everyone can pass one card face down to the left"
        )
        difficulty += 3
    elif random.random() < 0.1:
        mods.append(
            "**Trading (ccw)**: After selecting missions, everyone can pass one card face down to the right"
        )
        difficulty += 3

    sum_difficulty = 0
    while sum_difficulty != difficulty:
        mission = random.choice(ALL_MISSIONS)
        mission_difficulty = mission.difficulties[players_idx]
        if mission_difficulty is None:
            continue
        if mission_difficulty + sum_difficulty > difficulty:
            continue
        if cat_counts[mission.category.name] == mission.category.max:
            continue
        if mission in all_conflicts:
            continue
        conflicts = False
        for conflict in mission.conflicts:
            if conflict in missions:
                conflicts = True
                break
        if conflicts:
            continue
        all_conflicts.append(mission)
        all_conflicts.extend(mission.conflicts)
        sum_difficulty += mission_difficulty
        cat_counts[mission.category.name] += 1
        missions.append(mission)
    return missions, mods

missions, mods = get_missions_and_mods(players, difficulty)

col_mission, col_mods = st.columns([2, 1])  # Adjust ratio as needed
with col_mission:
    st.header("missions")
    for i, mission in enumerate(missions):
        col1, col2, col3 = st.columns([2, 1, 1])  # Adjust ratio as needed
        with col1:
            st.markdown(f"- {mission.desc}")
        with col2:
            if mission.shared:
                st.text("(shared)")
            else:
                st.text_input("assigned to", key=f"mission-assign-{st.session_state.random_seed}-{i}")
        with col3:
            st.checkbox("complete", value=False, key=f"mission-check-{st.session_state.random_seed}-{i}", label_visibility='hidden')
        # st.markdown(f"- {mission.desc}")
        # st.text_input("assigned to")


with col_mods:
    st.header("modifications")
    for mod in mods:
        st.markdown(f"- {mod}")
