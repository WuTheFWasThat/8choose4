# NOTE: THIS WAS NEVER FINISHED, SINCE MY ACHIEVEMENT WAS OBTAINED :)

# 0,0 is top
# first coordinate walks right/down
# second coordinate walks left/down

moves = [(-1, -1), (0, -1), (-1, 0), (0, 1), (1, 0), (1, 1)]

class Board:
  def __init__(self, n, boardlist):
    # corners = 0,0 .. 5,0 .. 0,5.. 10,5 .. 5,10.. 10,10
    self.n = n
    self.input_board = [[None for x in range(2*n-1)] for y in range(2*n-1)]

    # x if sure is x, including 0
    # * if sure is something, None if sure is nothing
    # ? if unsure
    self.working_board = [[None for x in range(2*n-1)] for y in range(2*n-1)]
    self.worked = [[False for x in range(2*n-1)] for y in range(2*n-1)]

    i = j = 0 

    def increment_i_j(i, j):
      j += 1
      if j == 2*n-1:
        j = 0
        i += 1
      return i, j

    self.blocks = [0 for x in range(7)]

    # for board:

    # _ means no block there, but placeable
    # x means block with value x
    # __ means no block placeable
    # _x means block locked with value x

    # for working board:

    # ? means unsure
    # * means block must be there
    # - means no block placeable
    # x means block locked with value x
    for x in boardlist:
      x = str(x)
      while not ( -n < i - j < n):
        i, j = increment_i_j(i, j)
      self.input_board[i][j] = x
      if len(x) == 1:
        if not x == '_':
          val = int(x)
          self.blocks[val] += 1
        self.working_board[i][j] = '?_'
      else:
        if x == '__':
          self.working_board[i][j] = '__'
        else:
          self.working_board[i][j] = int(x[1])
      i, j = increment_i_j(i, j)
    print self.blocks

  def deduce(self):
    success = False
    for i in range(2*self.n-1):
      for j in range(2*self.n-1):
        if self.worked[i][j]: continue
        work_success = self.deduce_square(i, j)
        self.worked[i][j] = self.worked[i][j] or work_success
        success = success or work_success
    if success:
      print 'success!'
      self.print_board()

      self.deduce()

  def deduce_square(self, i, j):
    def get_neighbor_amts():
      neighbors_yes = 0;
      neighbors_no = 0;
      neighbors_maybe = 0;
      maybes = []
      verbose = False
      if verbose:
        print
      for (di, dj) in moves:
        newi, newj = i + di, j + dj
        if (newi < 0 or newi >= 2*self.n - 1 or newj < 0 or newj >= 2*self.n-1):
          neighbors_no += 1
        else:
          neighbor = self.working_board[newi][newj]
          if verbose:
            print neighbor
          if neighbor == '__':
            neighbors_no += 1
          elif neighbor == '?_':
            neighbors_maybe += 1
            maybes.append((newi, newj))
          else:
            neighbors_yes += 1 
      if verbose:
        print i, j
        print neighbors_no, neighbors_maybe, neighbors_yes
      assert neighbors_no + neighbors_maybe + neighbors_yes == 6
      return (neighbors_no, neighbors_yes, neighbors_maybe, maybes)

    value = self.working_board[i][j]
    if value == '_*': 
      (neighbors_no, neighbors_yes, neighbors_maybe, maybes) = get_neighbor_amts()
      if neighbors_maybe == 0:
        self.working_board[i][j] = neighbors_yes
        assert self.blocks[neighbors_yes] > 0
        self.blocks[neighbors_yes] -= 1
      return True
    elif value == '?_':
      return False
    elif value == '__':
      return False
    else: # locked some integer
      (neighbors_no, neighbors_yes, neighbors_maybe, maybes) = get_neighbor_amts()
      assert neighbors_yes + neighbors_maybe >= value

      if (neighbors_yes + neighbors_maybe == value):
        # all maybes must be yesses
        for (newi, newj) in maybes:
          self.working_board[newi][newj] = '_*'
        return True

      if (neighbors_yes == value):
        # all maybes must be nos
        for (newi, newj) in maybes:
          self.working_board[newi][newj] = '__'
        return True

      return False

  def print_board(self, working = True):
    # _ means no block there, but placeable
    # x means block with value x
    # __ means no block placeable
    # _x means block locked with value x

    if working:
        board = self.working_board
    else:
        board = self.input_board
    strboard = [['   ' for x in range(2*self.n-1)] for y in range(4*self.n-3)]
    for i in range(2*self.n-1):
      for j in range(2*self.n-1):
        if not ( -self.n < i - j < self.n): continue
        val = board[i][j]
        if val == '_':
          val = ' - '
        elif type(val) == int:
          val = ' ' + str(val) + ' '
        elif val == '__':
          val = '(-)'
        elif len(val) == 2:
          if val[0] == '?':
            val = ' ' + val[1] + ' '
          else:
            assert val[0] == '_'
            val = '(' + val[1] + ')'
          # working_board
        strboard[j+i][i-j + self.n - 1] = val
    return '\n'.join([''.join(strboard[y]) for y in range(4*self.n - 3)])

_ = '_'
__ = '__'
_0 = '_0'
_1 = '_1'
_2 = '_2'
_3 = '_3'
_4 = '_4'
_5 = '_5'
_6 = '_6'

# _ means no block there, but placeable
# x means block with value x
# __ means no block placeable
# _x means block locked with value x

boardlist = [
    5, 4, 5, 5, 6, 3,
    _, 2, 3, 6, 4, _5, _,
    _4, 3, 3, 5, 5, 3, __, 4,
    4, 5, 4, 5, 3, 6, 5, 3, 3,
    3, 6, __, 3, 4, 3, __, _5, 4, 5,
    3, 5, _3, 3, 5, _, 5, 4, 4, 5, _,
    _, 2, __, _, _, _5, _6, 4, 5, __,
    _3, 4, 6, _, 4, _5, 6, _6, _3,
    _, 4, 1, 4, _, 5, 5, 3,
    4, _, _, 5, 4, 4, 4,
    4, 3, 5, 5, __, 4
]

board = Board(6, boardlist)

print board.print_board(False)
print
print board.print_board()
print
board.deduce()
print board.print_board()
print
