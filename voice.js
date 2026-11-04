/* Shared voice for every game. Uses the voice chosen in Grown-ups (saved on this device);
   otherwise picks the most natural British English voice the tablet has. */
(function(){
 var ss=window.speechSynthesis;if(!ss||ss.__dgVoice)return;ss.__dgVoice=true;
 var KEY='dg_voice';
 function pref(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
 function quality(v){var n=v.name.toLowerCase(),s=0;
  if(/premium/.test(n))s+=40;else if(/enhanced|natural|neural/.test(n))s+=30;
  if(/emma/.test(n))s+=50;if(/martha|arthur|serena|kate|daniel|jamie|stephanie|oliver|libby|sonia|ryan|maisie|thomas|hazel|george|susan/.test(n))s+=8;
  if(/google uk english/.test(n))s+=12;if(/microsoft/.test(n)&&/online/.test(n))s+=25;
  if(/compact|eloquence|eddy|grandma|grandpa|rocko|shelley|flo|reed|sandy|bad news|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|kathy|bahh/.test(n))s-=60;
  if(v.localService)s+=2;return s;}
 function english(){return ss.getVoices().filter(function(v){return /^en[-_]/i.test(v.lang);});}
 function best(){var em=english().filter(function(v){return /emma/i.test(v.name);}).sort(function(a,b){return quality(b)-quality(a);});if(em.length)return em[0];var vs=english(),gb=vs.filter(function(v){return /en[-_]GB/i.test(v.lang);});var pool=gb.length?gb:vs;
  return pool.slice().sort(function(a,b){return quality(b)-quality(a);})[0]||null;}
 function current(){var p=pref(),vs=ss.getVoices();if(p&&p.name){for(var i=0;i<vs.length;i++)if(vs[i].name===p.name)return vs[i];}return best();}

 var SAYS=[[/\bWD J1330\+6435\b/g,'W D J 1330 plus 6435'],[/\bexoplanet(s?)\b/gi,'exo planet$1'],[/\b2M1207\b/g,'2 M 1207'],[/\bK2-18/g,'K 2 18'],[/\bM87\b/g,'M 87'],
  [/\bTRAPPIST\b/g,'Trappist'],[/\bWASP\b/g,'Wasp'],[/\bKELT\b/g,'Kelt'],[/\bTrES\b/g,'Tres'],[/\bHAT-P\b/g,'Hat P'],[/\bCoRoT\b/g,'Corot'],[/\bTON\b/g,'Ton'],
  [/\b(HD|GJ|LHS|LTT|TOI|HR|YZ|BH|ISS)\b/g,function(m){return m.split('').join(' ');}],[/\bBH(\d)/g,'B H $1'],
  [/(\d)-?([a-h])(?=$|[\s,.!?])/g,function(m,d,l){return d+' '+l.toUpperCase();}],[/(\d) ([a-h])(?=$|[,.!?])/g,function(m,d,l){return d+' '+l.toUpperCase();}],
  [/([A-Za-z])-(\d)/g,'$1 $2'],[/([A-Za-z']) ([b-h])(?=$|[,.!?])/g,function(m,w,l){return w+' '+l.toUpperCase();}],
  [/\bBetelgeuse\b/g,'Beetle juice'],[/\bQuaoar\b/g,'Kwa war'],[/\bHaumea\b/g,'How may ah'],[/\bMakemake\b/g,'Mah kay mah kay'],[/\bGonggong\b/g,'Gong gong'],
  [/\bCharon\b/g,'Kair on'],[/\bIo\b/g,'Eye oh'],[/\bGliese\b/g,'Glee zuh'],[/\bPsyche\b/g,'Sigh key'],[/\bRyugu\b/g,'Ree oo goo'],[/\bHygiea\b/g,'High jee ah'],
  [/\bDeimos\b/g,'Day moss'],[/\bPhobos\b/g,'Foe boss'],[/\bEnceladus\b/g,'En sell a dus'],[/\bDimorphos\b/g,'Die mor fuss'],[/\bApophis\b/g,'A poff iss'],
  [/\bMimas\b/g,'My mass'],[/\bCeres\b/g,'Seer eez'],[/\bEris\b/g,'Ee riss'],[/\bSalacia\b/g,'Sa lay sha'],[/\bVaruna\b/g,'Va roo na'],[/\bRigel\b/g,'Rye jel'],[/\bSpica\b/g,'Spy ka'],
  [/\bGaia\b/g,'Guy ah'],[/\bTeegarden's\b/g,'Tee garden\'s'],[/\bPoltergeist\b/g,'Pole ter guyst']];
 function sayFix(t){if(!t)return t;for(var i=0;i<SAYS.length;i++)t=t.replace(SAYS[i][0],SAYS[i][1]);return t;}
 var orig=ss.speak.bind(ss);
 ss.speak=function(u){try{if(u&&u.text)u.text=sayFix(u.text);}catch(e){}try{var p=pref();u.rate=p&&p.rate?p.rate:0.95;u.pitch=p&&p.pitch?p.pitch:1;}catch(e){}try{var v=current();if(v){u.voice=v;u.lang=v.lang;}}catch(e){}return orig(u);};
 window.DGVoice={list:function(){return english().sort(function(a,b){var ga=/GB/i.test(a.lang)?1:0,gb=/GB/i.test(b.lang)?1:0;return gb-ga||quality(b)-quality(a);});},quality:quality,current:current,best:best,
  set:function(name,rate,pitch){try{localStorage.setItem(KEY,JSON.stringify({name:name,rate:rate||0.95,pitch:pitch||1}));}catch(e){}},
  pref:pref,sayFix:sayFix,
  test:function(text){ss.cancel();var u=new SpeechSynthesisUtterance(text||"Hello Dexter! Let's play.");ss.speak(u);}};
 if(ss.addEventListener)ss.addEventListener('voiceschanged',function(){});ss.getVoices();
})();
