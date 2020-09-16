from base_server import Base_handler, Server_thread
from collections import defaultdict as dd
import time

class Player():
    def __init__(self, name):
        self.name = name
        self.beat = time.time()
        self.coin = 0


class GBV():
    def __init__(self):
        self.now     =  0
        self.players =  dd(lambda: None)
        self.chat    =  []
        self.lines   =  []

        self.playing =  0
        self.painter =  0
        self.draw_id =  0

    @property
    def alives(self):
        self.clean()
        res = [self.players[u].name for u in self.players if self.players[u]]
        return res

    def clean(self):
        ima = time.time()
        for u in self.players:
            if self.players[u] and (abs(ima - self.players[u].beat) > 6):
                print('Die: {}, {}; beat: {}, {}'.format(u, self.players[u].name, ima, self.players[u].beat))
                self.players[u] = None

    def beat(self, uid):
        if not self.players[uid]: return {'res' : 'dead'}
        self.players[uid].beat = time.time()
        # print('{} new beat: {}'.format(self.players[uid].name, self.players[uid].beat))
        return {'res' : 'ok'}
    
    def add_player(self, data):
        self.now += 1
        self.players[self.now] = Player(data['name'])
        print('New player: ', self.now, self.players[self.now].name)
        return {'uid' : self.now}

    def add_say(self, uid, cont):
        print('Add speak: ', self.players[uid].name, cont)
        self.chat.append((self.players[uid].name, cont))
        return {'res' : 0}

    def ask_say(self, x):
        if x>=len(self.chat): return {'n' : 0}
        return {'n' : len(self.chat)-x, 'data' : self.chat[x:]}

    def add_lines(self, lines):
        self.lines += lines
        return {'res' : 0}

    def ask_lines(self, x):
        if x>=len(self.lines): return {'lines' : []}
        return {'lines' : self.lines[x:]}

    def redraw(self, uid):
        # if self.painter != uid: return {'res' : 1}
        self.lines  = []
        self.draw_id +=  1
        return {'res' : 0}

    def ask_info(self, uid):
        return {
            'draw_id' : self.draw_id, 
            'users'   : self.alives,
        }


class S(Base_handler):
    def run(self, data):
        global G
        if 'cmd' not in data: return
        if ('uid' in data) and (G.players[data['uid']]==None): return
        if data['cmd'] == 'reg':
            return G.add_player(data)

        elif data['cmd'] == 'beat':
            return G.beat(data['uid'])

        elif data['cmd'] == 'say':
            return G.add_say(data['uid'], data['cont'])

        elif data['cmd'] == 'ask_chat':
            return G.ask_say(data['from'])

        elif data['cmd'] == 'up_line':
            return G.add_lines(data['lines'])

        elif data['cmd'] == 'ask_line':
            return G.ask_lines(data['from'])

        elif data['cmd'] == 'redraw':
            return G.redraw(data['uid'])

        elif data['cmd'] == 'info':
            return G.ask_info(data['uid'])




if __name__ == '__main__':
    global G
    G = GBV()
    # Game_server(S, 6789)
    td = Server_thread(S, 6789)
    td.start()

    while True:
        x = input('CMD: ')
        if x=='u':
            print(G.alives)
