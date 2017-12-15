#http://www.kongregate.com/games/Onefifth/coins?acomplete=coins
from sets import Set

def dist_from_goal(curr_state, goal):
  tot = 0
  for square, color in goal.iteritems():
    if curr_state.get(square) != color:
      tot += 1
  return tot

NEIGHBORS = [(1,0), (-1,0), (0,1), (0,-1), (1,-1), (-1,1)]
#return a list of all neighbors of square
def get_neighbors(square):
  x = square[0]
  y = square[1]
  ans = set()
  for dx, dy in NEIGHBORS:
    ans.add((x+dx,y+dy))
  return ans

#return a set of all legal positions to place square
#assumes square in state
def legal_moves_set(state, square):
  if square not in state:
    raise Exception("blah")
  sets = [Set() for i in [0,1]]
  for sq, color in state.iteritems():
    if sq != square:
      sets[color].update(get_neighbors(sq))
  both = sets[0].intersection(sets[1])
  #excise any already occupied square
  return both.difference(Set(state.iterkeys()))

def legal_moves(state, square):
  return [Move(square, sq) for sq in legal_moves_set(state, square)]
  
class Move:
  def __init__(self, from_sq, to_sq):
    self.from_sq = from_sq
    self.to_sq = to_sq
  def __repr__(self):
    return str(self.from_sq) + "->" + str(self.to_sq)

class GamePath:
  def __init__(self, start_state, curr_state = None, moves = []):
    self.start_state = start_state
    self.curr_state = curr_state if curr_state else start_state
    self.moves = moves
    self.num_moves = len(moves)
  def next_moves(self):
    all_moves = []
    for sq in self.curr_state.iterkeys():
      all_moves.extend(legal_moves(self.curr_state, sq))
    return all_moves
  def is_done(self, goal):
    return self.curr_state == goal
  def make_move(self, move):
    new_state = self.curr_state.copy()
    new_state[move.to_sq] = new_state[move.from_sq]
    del new_state[move.from_sq]
    new_moves = self.moves[:]
    new_moves.append(move)
    return GamePath(self.start_state, new_state, new_moves)

def BFS(s, t, limit = 999):
  queue = [s]
  i = 0
  while (queue):
    i += 1
    print i
    newqueue = []
    for v in queue:
      if (v.is_done(t)): return v
      for move in v.next_moves():
        w = v.make_move(move)
        if dist_from_goal(w.curr_state, t) > limit-i: continue
        #assert len(w.curr_state) == len(t)
        newqueue.append(w)
        if (w.is_done(t)):
          print w.moves
          return w
    queue = newqueue
          
if __name__ == '__main__':
  #Black = 0, White = 1

  # coordinate system:
  # START anywhere
  # x moves right
  # y moves up-right

  #goal = {
  #    (0,0) : 0,
  #    (1,-1) : 0,
  #    (2,-2) : 0,
  #    (3,-2) : 1,
  #    (3,-1) : 1,
  #    (3,0) : 1,
  #}
  #start_state = {
  #   (0,0): 0,
  #   (0,1): 0,
  #   (0,2): 0,
  #   (1,2): 1,
  #   (2,1): 1,
  #   (3,0): 1,
  #}

  goal = {
      (0, 0) : 0,
      (1, 0) : 0,
      (2, 0) : 0,
      (-1,0) : 1,
      (-2,0) : 1,
  }
  start_state = {
      (0,0) : 0,
      (1,0) : 0,
      (2,0) : 0,
      (0,1) : 1,
      (1,1) : 1,
  }
  print goal
  gp = GamePath(start_state)
  end = BFS(gp, goal, 7)
