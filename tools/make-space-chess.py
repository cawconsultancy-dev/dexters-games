"""Make games/space-chess.html from games/chess.html (same game, space pieces, its own saved game).
Run from the repo root after any change to chess.html: python3 tools/make-space-chess.py"""
s=open('games/chess.html',encoding='utf-8').read()
s=s.replace("<title>Chess</title>","<title>Space Chess</title>").replace("<script>\n(function(){","<script>window.CHESS_SET='space';</script>\n<script>\n(function(){",1)
s=s.replace("localStorage.getItem('chess_'+k)","localStorage.getItem('schess_'+k)").replace("localStorage.setItem('chess_'+k,","localStorage.setItem('schess_'+k,")
assert "CHESS_SET='space'" in s and "schess_" in s
open('games/space-chess.html','w',encoding='utf-8').write(s);print('made space-chess.html')
