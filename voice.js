/* Shared voice for every game. Uses the voice chosen in Grown-ups (saved on this device);
   otherwise picks the most natural British English voice the tablet has. */
(function(){
 var ss=window.speechSynthesis;if(!ss||ss.__dgVoice)return;ss.__dgVoice=true;
 var KEY='dg_voice';
 function pref(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
 function quality(v){var n=v.name.toLowerCase(),s=0;
  if(/premium/.test(n))s+=40;else if(/enhanced|natural|neural/.test(n))s+=30;
  if(/martha|arthur|serena|kate|daniel|jamie|stephanie|oliver|libby|sonia|ryan|maisie|thomas|hazel|george|susan/.test(n))s+=8;
  if(/google uk english/.test(n))s+=12;if(/microsoft/.test(n)&&/online/.test(n))s+=25;
  if(/compact|eloquence|grandma|grandpa|rocko|shelley|flo|reed|sandy|bad news|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|kathy|bahh/.test(n))s-=60;
  if(v.localService)s+=2;return s;}
 function english(){return ss.getVoices().filter(function(v){return /^en[-_]/i.test(v.lang);});}
 function best(){var vs=english(),gb=vs.filter(function(v){return /en[-_]GB/i.test(v.lang);});var pool=gb.length?gb:vs;
  return pool.slice().sort(function(a,b){return quality(b)-quality(a);})[0]||null;}
 function current(){var p=pref(),vs=ss.getVoices();if(p&&p.name){for(var i=0;i<vs.length;i++)if(vs[i].name===p.name)return vs[i];}return best();}
 var orig=ss.speak.bind(ss);
 ss.speak=function(u){try{var p=pref();u.rate=p&&p.rate?p.rate:0.95;u.pitch=p&&p.pitch?p.pitch:1;}catch(e){}try{var v=current();if(v){u.voice=v;u.lang=v.lang;}}catch(e){}return orig(u);};
 window.DGVoice={list:function(){return english().sort(function(a,b){var ga=/GB/i.test(a.lang)?1:0,gb=/GB/i.test(b.lang)?1:0;return gb-ga||quality(b)-quality(a);});},quality:quality,current:current,best:best,
  set:function(name,rate,pitch){try{localStorage.setItem(KEY,JSON.stringify({name:name,rate:rate||0.95,pitch:pitch||1}));}catch(e){}},
  pref:pref,
  test:function(text){ss.cancel();var u=new SpeechSynthesisUtterance(text||"Hello Dexter! Let's play.");ss.speak(u);}};
 if(ss.addEventListener)ss.addEventListener('voiceschanged',function(){});ss.getVoices();
})();
