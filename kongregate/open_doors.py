
directions = [(1,0), (-1,0), (0,1), (0,-1)]

class Board:
  # n = width
  # m = height
  # start = (i, j) coordinates of start square
  # finish = (i, j) coordinates of finish square
  # unpassable = set of (i, j) coordinates of unpassable squares
  # doors = set of (i, j, curdir, otherdir)
  def __init__(self, n, m, start, target, unpassable, doors):
    self.n = n
    self.m = m
    self.start = start
    self.target = target
    self.unpassable = unpassable
    self.doors = doors
  def move(self, direction):
