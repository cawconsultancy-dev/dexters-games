"""Make the 3D versions of the arcade games from the flat originals.
Run from the repo root: python3 tools/make-arcade3d.py [game ...]
Each 3D game is the original game (same rules, scores and menus) plus games/lib/shell3d.js and the
game's own 3D world from tools/arcade3d/<game>.js, which replaces only the drawing.
Small patches below only change where things appear (for example further down the road so they
do not pop into view); they never change how the game plays."""
import sys

GAMES = {
    'turbo-lanes': dict(title='Turbo Lanes', patches=[
        # cars, coins and stars start further down the road so they come out of the distance
        ("lanes.forEach(l=>traffic.push({lane:l,y:-80*S,", "lanes.forEach(l=>traffic.push({lane:l,y:-80*S-AH,"),
        ("coins.push({lane:l,y:-40*S-i*48*S,", "coins.push({lane:l,y:-40*S-AH-i*48*S,"),
        ("stars.push({lane:rint(0,2),y:-60*S,", "stars.push({lane:rint(0,2),y:-60*S-AH,"),
        ("traffic=traffic.filter(c=>c.y<H+150*S&&c.y>-400*S);", "traffic=traffic.filter(c=>c.y<H+150*S&&c.y>-400*S-AH);"),
    ]),
    'dino-dash': dict(title='Dino Dash', patches=[]),
    'sky-hopper': dict(title='Sky Hopper', patches=[]),
    'tower-stack': dict(title='Sky Tower', patches=[]),
    'comet-flyer': dict(title='Comet Flyer', patches=[]),
    'ring-tower': dict(title='Tower Stack', patches=[]),
    'push-crate': dict(title='Push the Crate', patches=[]),
    'space-maze': dict(title='Space Maze', patches=[]),
    'robot-code': dict(title='Robot Code', patches=[]),
    'laser-mirrors': dict(title='Laser Mirrors', patches=[]),
    'balance-scales': dict(title='Balance Scales', patches=[]),
    'shadow-match': dict(title='Shadow Match', patches=[]),
    # Rocket Race is not built on the game shell: its board is swapped for a 3D one by tools/arcade3d/rocket-race.js
    'rocket-race': dict(title='Rocket Race', dom=True, patches=[("title:'Rocket Race',", "title:'Rocket Race 3D',"), ('<title>Rocket Race</title>', '<title>Rocket Race 3D</title>')]),
}

def rep(s, a, b):
    assert s.count(a) == 1, (a, s.count(a))
    return s.replace(a, b)

want = sys.argv[1:] or list(GAMES)
for gid in want:
    c = GAMES[gid]
    s = open(f'games/{gid}.html', encoding='utf-8').read()
    if c.get('dom'):
        for a, b in c['patches']:
            s = rep(s, a, b)
        s = rep(s, '</body>', '<script src="lib/three.min.js"></script>\n<script>\n' + open(f'tools/arcade3d/{gid}.js', encoding='utf-8').read() + '</script>\n</body>')
        open(f'games/{gid}-3d.html', 'w', encoding='utf-8').write(s)
        print('made', gid + '-3d.html'); continue
    s = rep(s, '<script src="../voice.js"></script>', '<script src="../voice.js"></script>\n<script src="lib/three.min.js"></script>\n<script src="lib/shell3d.js"></script>')
    s = rep(s, f"const G={{title:'{c['title']}',", f"var AH=0;\nconst G={{title:'{c['title']} 3D',")
    for a, b in c['patches']:
        s = rep(s, a, b)
    s = rep(s, '\nboot();\n</script>', '\nboot();\n</script>\n<script>\n' + open(f'tools/arcade3d/{gid}.js', encoding='utf-8').read() + '</script>')
    open(f'games/{gid}-3d.html', 'w', encoding='utf-8').write(s)
    print('made', gid + '-3d.html')
