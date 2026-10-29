const V='dg-v7';
const FILES=["./", "index.html", "manifest.webmanifest", "fonts/fredoka.woff2", "img/dexter-planet.jpg", "img/logo-192.png", "img/logo-180.png", "img/logo-512.png", "img/icon-maskable-192.png", "img/icon-maskable-512.png", "games/animal-game.html", "games/animal-number-run.html", "games/clock-rocket.html", "games/cosmic-quiz.html", "games/countries-game.html", "games/country-number-run.html", "games/crazy-snake.html", "games/drum-copycat.html", "games/fish-tank.html", "games/galaxy-treasure-hunt.html", "games/letter-trails.html", "games/number-ball-run.html", "games/number-bond-blast.html", "games/pattern-train.html", "games/planet-drop.html", "games/planet-number-run.html", "games/robo-snack.html", "games/rocket-race.html", "games/shape-puzzles.html", "games/shapes-game.html", "games/star-catcher.html", "games/story-shuffle.html", "games/vehicle-drop.html", "games/vehicle-game.html", "games/word-monster.html", "games/bubble-pop.html", "games/comet-flyer.html", "games/dino-dash.html", "games/fruit-swipe.html", "games/magic-paint.html", "games/monster-match.html", "games/sky-hopper.html", "games/star-notes.html", "games/tower-stack.html", "games/turbo-lanes.html", "games/pipe-flow.html", "games/uk-city-finder.html", "games/uk-county-spotter.html", "games/uk-jigsaw.html", "games/uk-town-run.html"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
/* pages and games: try the network first so updates show straight away, fall back to the saved copy when offline.
   images and fonts: serve the saved copy straight away and refresh it in the background. */
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 const page=e.request.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/')||u.pathname.endsWith('.js')||u.pathname.endsWith('.webmanifest');
 e.respondWith(caches.open(V).then(async c=>{
  if(page){try{const r=await fetch(e.request,{cache:'no-store'});if(r.ok)c.put(e.request,r.clone());return r;}catch(err){return (await c.match(e.request,{ignoreSearch:true}))||(await c.match('./'))||Response.error();}}
  const hit=await c.match(e.request,{ignoreSearch:true});
  const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r;}).catch(()=>hit);
  return hit||net;}));});
