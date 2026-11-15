"""Make the 3D versions of the number run games from the flat originals.
Run from the repo root: python3 tools/make-run3d.py
The 3D file is the original game with its drawing swapped for games/lib/run3d.js, so any later
change to a flat game's rules can be carried into the 3D one by running this again."""
import json

LAND = dict(sky=['#58b4f0', '#d6efff'], fog='#d6efff', stars=False)
GAMES = {
    'number-ball-run': dict(name='Number Ball Run', draw='drawBall', obstacle='spike', tags=False,
        theme=dict(sky=['#0f0c2e', '#2b1d5c'], stars=True, track='#3b2a6b', edge='#ffd400', under='#1a1440', scenery='space')),
    'planet-number-run': dict(name='Planet Number Run', draw='drawPlanet', obstacle='comet', obsDraw='drawComet', obsK=0.55, tags=True,
        theme=dict(sky=['#05041a', '#1c1245'], stars=True, track='#3c2878', edge='#7fd8ff', under='#120d33', scenery='space')),
    'animal-number-run': dict(name='Animal Number Run', draw='drawPlanet', obstacle='comet', obsDraw='drawComet', obsK=0.62, tags=True,
        theme=dict(LAND, track='#c9a46a', edge='#ffffff', ground='#5cb85c', scenery='trees')),
    'country-number-run': dict(name='Country Number Run', draw='drawPlanet', obstacle='comet', obsDraw='drawComet', obsK=0.62, tags=True,
        theme=dict(LAND, track='#bfb49c', edge='#ffd400', ground='#5cb85c', scenery='trees')),
    'uk-town-run': dict(name='UK Town Run', draw='drawPlanet', obstacle='comet', obsDraw='drawComet', obsK=0.62, tags=True,
        theme=dict(LAND, track='#5a5f68', edge='#ffffff', ground='#6cbf5f', scenery='mixed')),
}

def rep(s, a, b):
    assert s.count(a) == 1, (a, s.count(a))
    return s.replace(a, b)

for gid, c in GAMES.items():
    s = open(f'games/{gid}.html', encoding='utf-8').read()
    name = c['name']
    s = rep(s, f'<title>{name}</title>', f'<title>{name} 3D</title>\n<script src="lib/three.min.js"></script>\n<script src="lib/run3d.js"></script>')
    s = rep(s, "const cv=document.getElementById('c'),cx=cv.getContext('2d');", "const cv=document.getElementById('c');let cx=cv.getContext('2d');")
    # the 3D track is longer than the flat one, so stretch the hit test along the track to match (1 if 3D could not start)
    s = rep(s, "const dx=o.x-player.x,dy=oy-playerY;", "const dx=o.x-player.x,dy=(oy-playerY)*(window.R3ZK||1);")
    s = s.replace(f"title('{name}',", f"title('{name} 3D',", 1)
    cfg = {k: v for k, v in c.items() if k != 'name'}
    s = rep(s, '</body>', f'<script>Run3D.install({json.dumps(cfg)});</script>\n</body>')
    open(f'games/{gid}-3d.html', 'w', encoding='utf-8').write(s)
    print('made', gid + '-3d.html')
