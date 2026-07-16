/* ============================================================
   JINACODE — "28 DAYS. WATCH IT SHIP."
   Scroll-scrubbed build: the four-week engagement as a journey.
   The world assembles as the mission clock ticks Day 0 → 28.
   ============================================================ */
(function(){
'use strict';
var clamp=function(x,a,b){return Math.min(b,Math.max(a,x));};
var lerp=function(a,b,t){return a+(b-a)*t;};
var ease=function(t){return 1-Math.pow(1-clamp(t,0,1),3);};
function sstep(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}
function smoother(t){t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);}

var COL={
  ink:'#f7f1e9', muted:'rgba(236,222,210,0.66)', dim:'rgba(236,222,210,0.40)',
  amber:'#ffb36b', A:'#f7943f', B:'#ff6a3d', C:'#ff3d7f',
  panel:'rgba(16,10,24,0.92)', stroke:'rgba(255,170,110,0.20)', btnInk:'#20090f'
};

var glc=document.getElementById('gl');
var gl=glc.getContext('webgl',{antialias:false,alpha:false})||glc.getContext('experimental-webgl',{antialias:false,alpha:false});
if(!gl){var fb=document.getElementById('fallback');if(fb)fb.style.display='block';}

/* ================= PATH (shared JS ⇄ GLSL) ================= */
var WSCALE=6;                                           /* interstellar spacing: 6x beat gaps */
function pathX(z){return 1.10*Math.sin(z*0.0166667);}   /* gentle highway sweep, stretched */
function pathY(z){return 0.80+0.18*Math.sin(z*0.0108333);} /* rider-height chase cam */
var RW=0.85;                                            /* road half-width */

/* ================= BEATS (the story spine) ================= */
/* look:[yawOff,pitchOff,rollOff,yOff,xOff] applied when seated at the beat */
var BEATS=[
 {z:5.0, day:null,phase:'THE BRIEF',    panel:'hero',    look:[0,0.01,0,0.42,0]},
 {z:11.0,day:null,phase:'UPLINK',       panel:'trust',   look:[0,0,0,0,0]},
 {z:17.0,day:0,   phase:'SCOPE',        panel:'step0',   look:[0.05,-0.01,0.02,0,0]},
 {z:23.0,day:3,   phase:'EMBED',        panel:'step1',   look:[-0.05,0,-0.02,0,0]},
 {z:29.0,day:4,   phase:'WHY US',      panel:'whyIntro',look:[0,0,0,0,0]},
 {z:35.0,day:5,   phase:'WHY US',      panel:'whyA',    look:[0.05,0,0.01,0,0]},
 {z:41.0,day:6,   phase:'WHY US',      panel:'whyB',    look:[-0.05,0,-0.01,0,0]},
 {z:47.0,day:7,   phase:'FIRST COMMITS',panel:'ai',      look:[0,0.02,0,0.08,0]},
 {z:54.0,day:14,  phase:'FIRST DEPLOY', panel:'stats',   look:[0.14,0.09,0.02,0.22,0]},
 {z:61.0,day:21,  phase:'SHIP',         panel:'step2',   look:[0,0.02,0,0.08,0]},
 {z:68.0,day:28,  phase:'HAND OFF',     panel:'step3',   look:[0,-0.13,0,1.05,0]},
 {z:75.0,day:null,phase:'PICK YOUR POD',panel:'pods',    look:[0,-0.08,0,0.8,0]},
 {z:81.0,day:null,phase:'UPLINK',       panel:'cta',     look:[0,0.02,0,0.25,0]},
 {z:87.0,day:null,phase:'SYSMAP',       panel:'footer',  look:[0,-0.05,0,0.45,0]}
];
BEATS.push({z:93.0,day:null,phase:'JUNCTION',panel:'jHome',look:[0,0.02,0,0.30,0]});
var NB=BEATS.length, READ_D=2.05, HAND_Z=68.0;
var GATES=[{z:17,d:0},{z:23,d:3},{z:47,d:7},{z:54,d:14},{z:61,d:21},{z:68,d:28}];
/* ---------- the whole site as branch roads ---------- */
var ROUTES={
 home:{label:'HOME',L:'work',R:'product',beats:BEATS,tint:[1.0,0.58,0.30],css:['#f7943f','#ff6a3d','#ff3d7f']},
 product:{label:'PRODUCT',L:'work',R:'contact',tint:[0.62,0.52,1.0],css:['#8f7bff','#b06bff','#ff5bd0'],beats:[
  {z:5, id:'top',      phase:'THE SERVICE GRID',panel:'prodHero',   look:[0,0.01,0,0.42,0]},
  {z:11,id:'voice',    phase:'SVC 01 · VOICE AI',panel:'svcVoice',  look:[0.05,0,0.01,0,0]},
  {z:17,id:'wa',       phase:'SVC 02 · WHATSAPP',panel:'svcWA',     look:[-0.05,0,-0.01,0,0]},
  {z:23,id:'rag',      phase:'SVC 03 · CHAT & RAG',panel:'svcRAG',  look:[0.05,0,0.01,0,0]},
  {z:29,id:'agentic',  phase:'SVC 04 · AGENTIC',panel:'svcAgent',   look:[-0.05,0,-0.01,0,0]},
  {z:35,id:'webmobile',phase:'SVC 05 · WEB & MOBILE',panel:'svcWeb',look:[0.05,0,0.01,0,0]},
  {z:41,id:'offshore', phase:'SVC 06 · OFFSHORE',panel:'svcTeam',   look:[-0.05,0,-0.01,0,0]},
  {z:47,id:'tiers',    phase:'PICK YOUR POD',panel:'pods',          look:[0,-0.08,0,0.8,0]},
  {z:53,phase:'JUNCTION',panel:'jProduct',                          look:[0,0.02,0,0.30,0]}
 ]},
 work:{label:'WORK',L:'about',R:'product',tint:[0.34,0.72,1.0],css:['#4db8ff','#5b8cff','#7bffee'],beats:[
  {z:5, phase:'SHIPPED',  panel:'workHero',look:[0,0.01,0,0.42,0]},
  {z:11,phase:'CASE 01·02',panel:'workA',  look:[0.05,0,0.01,0,0]},
  {z:17,phase:'CASE 03·04',panel:'workB',  look:[-0.05,0,-0.01,0,0]},
  {z:23,phase:'NEXT SLOT', panel:'workCTA',look:[0,0.01,0,0.1,0]},
  {z:29,phase:'JUNCTION',  panel:'jWork',  look:[0,0.02,0,0.30,0]}
 ]},
 about:{label:'ABOUT',L:'work',R:'contact',tint:[0.40,0.95,0.58],css:['#5bff9e','#4be3a8','#b8ff5b'],beats:[
  {z:5, phase:'WHO WE ARE',panel:'aboutHero',look:[0,0.01,0,0.42,0]},
  {z:11,phase:'HOW WE WORK',panel:'aboutA', look:[0.05,0,0.01,0,0]},
  {z:17,id:'principles',phase:'PRINCIPLES', panel:'aboutB', look:[-0.05,0,-0.01,0,0]},
  {z:23,phase:'JUNCTION',   panel:'jAbout', look:[0,0.02,0,0.30,0]}
 ]},
 story:{label:'OUR STORY',L:'about',R:'contact',tint:[1.0,0.80,0.48],css:['#ffd27b','#ffb35b','#ff8f5b'],beats:[
  {z:5, id:'belief',  phase:'THE BELIEF',       panel:'storyHero',    look:[0,0.01,0,0.3,0]},
  {z:11,id:'lesson',  phase:'THE TURNING POINT',panel:'storyLesson',  look:[0.05,0,0.01,0,0]},
  {z:17,id:'founders',phase:'THE FOUNDERS',     panel:'storyFounders',look:[-0.05,0,-0.01,0,0]},
  {z:23,id:'advisors',phase:'THE ADVISORS',     panel:'storyAdvisors',look:[0.05,0,0.01,0,0]},
  {z:29,id:'crew',    phase:'THE CREW',         panel:'storyCrew',    look:[-0.05,0,-0.01,0,0]},
  {z:35,id:'creed',   phase:'THE CREED',        panel:'storyCreed',   look:[0.05,0,0.01,0,0]},
  {z:41,phase:'JUNCTION',panel:'jStory',look:[0,0.02,0,0.30,0]}
 ]},
 case1:{label:'REEL 01',L:'work',R:'case2',tint:[1.0,0.34,0.36],css:['#ff5b5b','#ff3d6e','#ff7b4b'],beats:[
  {z:6, phase:'NOW SCREENING',panel:'scr1',look:[0,0.02,0,0.45,0],rd:1.5},
  {z:12,phase:'JUNCTION',panel:'jCase',look:[0,0.02,0,0.30,0]}
 ]},
 case2:{label:'REEL 02',L:'work',R:'case3',tint:[1.0,0.34,0.36],css:['#ff5b5b','#ff3d6e','#ff7b4b'],beats:[
  {z:6, phase:'NOW SCREENING',panel:'scr2',look:[0,0.02,0,0.45,0],rd:1.5},
  {z:12,phase:'JUNCTION',panel:'jCase',look:[0,0.02,0,0.30,0]}
 ]},
 case3:{label:'REEL 03',L:'work',R:'case4',tint:[1.0,0.34,0.36],css:['#ff5b5b','#ff3d6e','#ff7b4b'],beats:[
  {z:6, phase:'NOW SCREENING',panel:'scr3',look:[0,0.02,0,0.45,0],rd:1.5},
  {z:12,phase:'JUNCTION',panel:'jCase',look:[0,0.02,0,0.30,0]}
 ]},
 case4:{label:'REEL 04',L:'work',R:'case5',tint:[1.0,0.34,0.36],css:['#ff5b5b','#ff3d6e','#ff7b4b'],beats:[
  {z:6, phase:'NOW SCREENING',panel:'scr4',look:[0,0.02,0,0.45,0],rd:1.5},
  {z:12,phase:'JUNCTION',panel:'jCase',look:[0,0.02,0,0.30,0]}
 ]},
 case5:{label:'REEL 05',L:'work',R:'case6',tint:[1.0,0.34,0.36],css:['#ff5b5b','#ff3d6e','#ff7b4b'],beats:[
  {z:6, phase:'NOW SCREENING',panel:'scr5',look:[0,0.02,0,0.45,0],rd:1.5},
  {z:12,phase:'JUNCTION',panel:'jCase',look:[0,0.02,0,0.30,0]}
 ]},
 case6:{label:'REEL 06',L:'work',R:'case7',tint:[1.0,0.34,0.36],css:['#ff5b5b','#ff3d6e','#ff7b4b'],beats:[
  {z:6, phase:'NOW SCREENING',panel:'scr6',look:[0,0.02,0,0.45,0],rd:1.5},
  {z:12,phase:'JUNCTION',panel:'jCase',look:[0,0.02,0,0.30,0]}
 ]},
 case7:{label:'REEL 07',L:'work',R:'contact',tint:[1.0,0.34,0.36],css:['#ff5b5b','#ff3d6e','#ff7b4b'],beats:[
  {z:6, phase:'NOW SCREENING',panel:'scr7',look:[0,0.02,0,0.45,0],rd:1.5},
  {z:12,phase:'JUNCTION',panel:'jCase',look:[0,0.02,0,0.30,0]}
 ]},
 contact:{label:'CONTACT',L:'home',R:'product',tint:[1.0,0.72,0.30],css:['#ffd24b','#ff9d3f','#ff3d7f'],beats:[
  {z:5, phase:'UPLINK',  panel:'cta',     look:[0,0.01,0,0.3,0]},
  {z:11,phase:'DIRECT',  panel:'contactB',look:[0,0.01,0,0.2,0]},
  {z:17,phase:'SYSMAP',  panel:'footer',  look:[0,-0.05,0,0.45,0]},
  {z:23,phase:'JUNCTION',panel:'jContact',look:[0,0.02,0,0.30,0]}
 ]}
};
var curRoute='home',trans=null,swapLock=0,reelT0=0,pendingBeat=null;
var curTint=[1.0,0.58,0.30];
/* '#voice' / '#tiers' anchors → beat index on the target route */
function anchorBeat(route,href){
  if(!href||!ROUTES[route])return null;
  var m=href.match(/#([\w-]+)$/);
  if(!m)return null;
  var bs=ROUTES[route].beats;
  for(var i=0;i<bs.length;i++)if(bs[i].id===m[1])return i;
  return null;
}
function routeOf(href){
  if(!href)return null;
  if(href.indexOf('mailto:')===0)return null;
  var cm=href.match(/case([1-7])/);
  if(cm)return 'case'+cm[1];
  if(href.indexOf('story')>=0)return 'story';
  if(href.indexOf('product')>=0)return 'product';
  if(href.indexOf('work')>=0)return 'work';
  if(href.indexOf('about')>=0)return 'about';
  if(href.indexOf('contact')>=0)return 'contact';
  if(href.indexOf('index')>=0)return 'home';
  return null;
}

/* buildings flanking the path: [z, side(-1/1), dist, halfW, height, halfD] */
var BOXES=[
 [ 7.5,-1,4.8,0.70,1.60,0.60],[ 9.5, 1,5.4,0.90,2.40,0.70], /* landing skyline */
 [11.5,-1,6.0,0.80,1.30,0.60],[13.5, 1,4.6,0.60,3.00,0.60],
 [18.0,-1,3.2,0.60,1.20,0.55],[21.0, 1,3.6,0.75,1.80,0.60],
 [25.5,-1,3.0,0.55,2.20,0.50],[31.0, 1,4.0,0.90,1.40,0.70],
 [37.0,-1,3.6,0.65,2.60,0.55],[42.5, 1,3.1,0.60,1.90,0.55],
 [48.5,-1,4.2,0.95,2.30,0.75],[52.5, 1,3.4,0.66,3.60,0.66], /* the Day-14 tower */
 [58.0,-1,3.2,0.60,2.80,0.55],[64.0, 1,3.8,0.85,2.40,0.65],
 [69.5,-1,3.5,0.62,3.00,0.58],[75.5, 1,3.3,0.70,2.00,0.60],
 [81.0,-1,4.0,0.90,2.60,0.70],[86.5, 1,3.6,0.75,2.20,0.60]
];
BOXES.push([0,-1,0,0.05,0.4,0.05],[0,1,0,0.05,0.4,0.05],[0,-1,0,0.05,0.4,0.05],[0,1,0,0.05,0.4,0.05]);
var NBOX=BOXES.length;
/* ---- interstellar spacing: every board sits a warp-jump apart ---- */
(function(){
  for(var r in ROUTES){
    var bs=ROUTES[r].beats;
    for(var i=0;i<bs.length;i++)bs[i].z*=WSCALE;
  }
  for(var g2=0;g2<GATES.length;g2++)GATES[g2].z*=WSCALE;
  for(var b2=0;b2<BOXES.length;b2++)BOXES[b2][0]*=WSCALE;
})();

/* ================= STATE ================= */
var W=0,H=0,dpr=1,asp=1.6,isMob=false,FOCAL=1.12,focalCur=1.12;
var Jt=0,Js=0,camZ=0.6,prevZ=0.6,speed=0,vel=0,svz=0;
var glitch=0,lastAmb=0;
var mouseX=.5,mouseY=.5,msX=.5,msY=.5;
var booted=false,fontsReady=false,navLock=false,atlasReady=false;
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var curBeat=-1,curDay=-999;
var cam={pos:[0,1.05,0.6],fwd:[0,0,1],right:[1,0,0],up:[0,1,0]};
var panels=[],activeIdx=[],hovP=-1,hovL=-1;

/* ================= ATLAS (content texture) ================= */
var atlas=document.createElement('canvas');
var ctx=atlas.getContext('2d');
var AW=2048,AH=2048,COLS=2,cellW=1024,logicalW=940,cs=1;

/* ---------- images baked into the atlas (photos, logo) ---------- */
var IMG={
  logo:    {src:'assets/img/logo-mark.png'},
  tapan:   {src:'assets/img/team/tapan-jain.jpg'},
  amit:    {src:'assets/img/team/amit-joshi.jpg'},
  pawan:   {src:'assets/img/team/pawan-kumar-jain.jpg'},
  prasun:  {src:'assets/img/team/prasun-mishra.jpg'},
  shivhari:{src:'assets/img/team/shivhari-garg.jpg'},
  shot1:   {src:'assets/img/work/exim-routes.png'},
  shot2:   {src:'assets/img/work/humanities-app.png'},
  shot3:   {src:'assets/img/work/ifh-voice-audit.png'},
  shot4:   {src:'assets/img/work/peppolbridge.jpg'},
  shot5:   {src:'assets/img/work/jinaconnect.jpg'},
  shot6:   {src:'assets/img/work/claudally.jpg'},
  shot7:   {src:'assets/img/work/gst365.jpg'},
  cgrp:    {src:'assets/img/team/crew/crew-group.jpg'},
  cnv:     {src:'assets/img/team/crew/crew-nvidia.jpg'},
  cfes:    {src:'assets/img/team/crew/crew-festive.jpg'},
  cdin:    {src:'assets/img/team/crew/crew-dinner.jpg'},
  crev:    {src:'assets/img/team/crew/crew-review.jpg'},
  coff:    {src:'assets/img/team/crew/crew-office.jpg'}
};
var imgsSettled=false,imgBlocked=false;
(function(){
  var pend=0;
  function done(){if(--pend<=0&&!imgsSettled){imgsSettled=true;try{resize();}catch(e){}}}
  for(var k in IMG){(function(o){
    pend++;
    var im=new Image();
    if(o.cors)im.crossOrigin='anonymous';
    im.onload=function(){o.el=im;o.ok=true;done();};
    im.onerror=function(){o.ok=false;done();};
    im.src=o.src;
  })(IMG[k]);}
  /* offline / slow CDN: boot anyway */
  setTimeout(function(){if(!imgsSettled){imgsSettled=true;try{resize();}catch(e){}}},4200);
})();
function imgOf(k){var o=IMG[k];return (!imgBlocked&&o&&o.ok&&o.el&&o.el.naturalWidth>0)?o.el:null;}
/* circular portrait with a brand ring; falls back to an initials medallion */
function portrait(x,y,r,key,initials){
  var im=imgOf(key);
  if(im){
    ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.clip();
    var s=Math.min(im.naturalWidth,im.naturalHeight);
    ctx.drawImage(im,(im.naturalWidth-s)/2,(im.naturalHeight-s)*0.25,s,s,x-r,y-r,r*2,r*2);
    ctx.restore();
  }else{
    ctx.fillStyle='rgba(255,236,220,0.09)';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
    ctx.fillStyle=COL.amber;ctx.font=font(700,Math.round(r*0.66));
    ctx.textAlign='center';ctx.fillText(initials,x,y+r*0.24);ctx.textAlign='left';
  }
  ctx.strokeStyle=grad(x-r,y-r,r*2);ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(x,y,r+3.5,0,7);ctx.stroke();
}

function font(w,s){return w+' '+s+'px "Space Grotesk", sans-serif';}
function setLS(v){try{ctx.letterSpacing=v;}catch(e){}}
function wrapLines(fnt,text,maxW){
  ctx.font=fnt;
  var words=String(text).split(' '),lines=[],cur='';
  for(var i=0;i<words.length;i++){
    var t=cur?cur+' '+words[i]:words[i];
    if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=words[i];}
    else cur=t;
  }
  if(cur)lines.push(cur);
  return lines;
}
function grad(x,y,w){var g=ctx.createLinearGradient(x,y,x+w,y+w*0.25);g.addColorStop(0,COL.A);g.addColorStop(.52,COL.B);g.addColorStop(1,COL.C);return g;}
function rr(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function eyebrow(x,y,text,center,cw){
  ctx.font='700 13.5px "Space Mono", monospace';setLS('3px');
  var w=ctx.measureText(text.toUpperCase()).width+16;
  var bx=center?x+(cw-w)/2:x;
  ctx.fillStyle=COL.B;
  ctx.shadowColor='rgba(255,106,61,.8)';ctx.shadowBlur=10;
  ctx.beginPath();ctx.arc(bx+4,y-4,3.5,0,7);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle=COL.amber;
  ctx.fillText(text.toUpperCase(),bx+16,y);
  setLS('0px');
  return w;
}
var curLinks=null;
function button(x,y,label,href,style,wOverride){
  ctx.font=font(600,17);
  var w=wOverride||ctx.measureText(label).width+48+(style==='p'?26:0);
  if(style==='p'){
    ctx.fillStyle=grad(x,y,w);rr(x,y,w,52,12);ctx.fill();
    ctx.fillStyle=COL.btnInk;ctx.font=font(600,17);
    ctx.fillText(label,x+24,y+32);
    ctx.font=font(700,16);ctx.fillText('→',x+w-34,y+31.5);
  }else{
    ctx.strokeStyle='rgba(255,180,120,.42)';ctx.lineWidth=1.4;
    rr(x,y,w,52,12);ctx.stroke();
    ctx.fillStyle='#ffd9b8';ctx.font=font(600,17);
    ctx.fillText(label,x+24,y+32);
  }
  if(curLinks)curLinks.push({x:x,y:y,w:w,h:52,href:href,label:label});
  return w;
}
function link(x,y,label,href){
  ctx.font='400 14.5px Inter, sans-serif';
  var w=ctx.measureText(label).width;
  ctx.fillStyle=COL.muted;ctx.fillText(label,x,y+16);
  if(curLinks)curLinks.push({x:x,y:y,w:w,h:22,href:href,label:label});
}
function cellBG(w,h){
  ctx.fillStyle=COL.panel;rr(0,0,w,h,18);ctx.fill();
  ctx.strokeStyle=COL.stroke;ctx.lineWidth=1.5;rr(1,1,w-2,h-2,18);ctx.stroke();
  ctx.strokeStyle='rgba(255,150,90,.55)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(24,1);ctx.lineTo(92,1);ctx.stroke();
}
function dayTag(x,y,txt){
  ctx.font='700 11px "Space Mono", monospace';setLS('2px');
  ctx.fillStyle='rgba(255,120,70,.16)';
  var w=ctx.measureText(txt).width+24;
  rr(x,y-15,w,22,11);ctx.fill();
  ctx.strokeStyle='rgba(255,170,110,.4)';ctx.lineWidth=1;rr(x+.5,y-14.5,w-1,21,10.5);ctx.stroke();
  ctx.fillStyle=COL.amber;ctx.fillText(txt,x+12,y);setLS('0px');
  return w;
}

/* ---------- panel content builders (draw at 0,0, width LW, return height) ---------- */
function bHero(LW){
  var y=54;
  eyebrow(44,y,'Forward-Deployed Engineering · Productized');y+=30;
  var s=isMob?50:72, lh=s*1.08;
  ctx.font=font(700,s);ctx.fillStyle=COL.ink;
  ctx.fillText('Ship what’s stuck.',44,y+lh*0.82);
  ctx.fillStyle=grad(44,y+lh,LW*0.8);
  ctx.fillText('We embed.',44,y+lh*1.86);
  ctx.fillText('You accelerate.',44,y+lh*2.90);
  y+=lh*3+26;
  var lede='Senior engineers in your repo, your standups, your stack — shipping to production every week.';
  var ls=wrapLines('400 21px Inter, sans-serif',lede,LW-96);
  ctx.font='400 21px Inter, sans-serif';ctx.fillStyle=COL.muted;
  for(var i=0;i<ls.length;i++)ctx.fillText(ls[i],44,y+i*33);
  y+=ls.length*33+30;
  var b1=button(44,y,'Get started','mailto:tapan@jinacode.systems?subject=Project%20enquiry%20-%20jinacode.systems&body=What%20I%27m%20trying%20to%20build:%0A%0A','p');
  if(44+b1+16+220<LW)button(44+b1+16,y,'See how it works','product.html','g');
  else {y+=66;button(44,y,'See how it works','product.html','g');}
  y+=52+40;
  var items=[['14d','first prod deploy'],['+40%','velocity lift'],['100%','senior, no juniors']];
  var cw=(LW-88)/3;
  for(var k=0;k<3;k++){
    ctx.font=font(700,28);ctx.fillStyle='#ffd9b8';ctx.fillText(items[k][0],44+k*cw,y+22);
    ctx.font='400 13.5px Inter, sans-serif';ctx.fillStyle=COL.dim;ctx.fillText(items[k][1],44+k*cw,y+42);
  }
  y+=64;
  ctx.font='400 15px "Space Mono", monospace';ctx.fillStyle=COL.amber;
  ctx.fillText('> POD ASSIGNED — DAY 0 STARTS BELOW ▼',44,y);
  return y+40;
}
function bTrust(LW){
  var y=48;
  ctx.font='700 13.5px "Space Mono", monospace';setLS('3px');ctx.fillStyle=COL.dim;
  ctx.textAlign='center';
  ctx.fillText('TRUSTED TO BUILD INSIDE TEAMS SHIPPING',LW/2,y);setLS('0px');
  y+=44;
  ctx.font=font(700,isMob?19:30);ctx.fillStyle='rgba(255,220,190,.75)';
  ctx.fillText('AI PLATFORMS · FINTECH · DEVELOPER TOOLS · HEALTH',LW/2,y);
  y+=34;
  ctx.fillStyle='rgba(255,120,90,.4)';
  ctx.fillText('LOGISTICS · RETAIL MEDIA · CLIMATE',LW/2,y);
  ctx.textAlign='left';
  return y+44;
}
/* mission-log narration panel: day tag → one big statement → one support line → system log */
function mkLog(tag,big,gradLast,support,logline){
  return function(LW){
    var y=56;
    dayTag(44,y,tag);y+=54;
    var lines=big.split('\n');
    var s=isMob?38:54, lh=s*1.16;
    ctx.font=font(700,s);
    for(var i=0;i<lines.length;i++){
      ctx.fillStyle=(gradLast&&i===lines.length-1)?grad(44,y+i*lh,LW*0.8):COL.ink;
      ctx.fillText(lines[i],44,y+lh*0.82+i*lh);
    }
    y+=lines.length*lh+20;
    if(support){
      var ls=wrapLines('400 20px Inter, sans-serif',support,LW-96);
      ctx.font='400 20px Inter, sans-serif';ctx.fillStyle=COL.muted;
      for(var j=0;j<ls.length;j++)ctx.fillText(ls[j],44,y+j*31);
      y+=ls.length*31+22;
    }
    if(logline){
      ctx.strokeStyle=COL.stroke;ctx.beginPath();ctx.moveTo(44,y-6);ctx.lineTo(LW-44,y-6);ctx.stroke();
      ctx.font='400 15px "Space Mono", monospace';ctx.fillStyle=COL.amber;
      ctx.fillText('> '+logline+' ▮',44,y+22);
      y+=34;
    }
    return y+40;
  };
}
function bWhyIntro(LW){
  var y=54;
  eyebrow(44,y,'Why it works');y+=40;
  var s=isMob?36:50, lh=s*1.18;
  ctx.font=font(700,s);ctx.fillStyle=COL.ink;
  ctx.fillText('Consultants advise',44,y+lh*0.82);
  ctx.fillText('from the outside.',44,y+lh*1.82);
  ctx.fillStyle=grad(44,y,LW*0.8);
  ctx.fillText('We build from the inside.',44,y+lh*2.82);
  y+=lh*3+24;
  ctx.font='400 20px Inter, sans-serif';ctx.fillStyle=COL.muted;
  ctx.fillText('The gap between idea and shipped is where projects die.',44,y);
  ctx.font=font(600,20);ctx.fillStyle='#ffd9b8';
  ctx.fillText('We live in the gap.',44,y+31);
  return y+31+48;
}
function mkCards(cards){
  return function(LW){
    var y=40, ch;
    for(var i=0;i<cards.length;i++){
      var ls=wrapLines('400 18px Inter, sans-serif',cards[i][1],LW-140);
      ch=88+ls.length*28;
      ctx.fillStyle='rgba(255,236,220,0.045)';rr(32,y,LW-64,ch,14);ctx.fill();
      ctx.strokeStyle=COL.stroke;ctx.lineWidth=1;rr(32.5,y+.5,LW-65,ch-1,14);ctx.stroke();
      ctx.font='700 13.5px "Space Mono", monospace';ctx.fillStyle=COL.B;
      ctx.fillText(cards[i][2],56,y+32);
      ctx.font=font(600,24);ctx.fillStyle=COL.ink;ctx.fillText(cards[i][0],56,y+58);
      ctx.font='400 18px Inter, sans-serif';ctx.fillStyle=COL.muted;
      for(var j=0;j<ls.length;j++)ctx.fillText(ls[j],56,y+88+j*28);
      y+=ch+18;
    }
    return y+22;
  };
}
/* ---------- people cards: circular photo + name + bio ---------- */
function mkPeople(items,r){
  return function(LW){
    var y=40, R=r||52;
    for(var i=0;i<items.length;i++){
      var it=items[i]; /* [imgKey, initials, tag, name, bio] */
      var tx=32+24+R*2+26, tw=LW-64-(tx-32)-24;
      var ls=wrapLines('400 17.5px Inter, sans-serif',it[4],tw);
      var ch=Math.max(R*2+48,92+ls.length*26);
      ctx.fillStyle='rgba(255,236,220,0.045)';rr(32,y,LW-64,ch,14);ctx.fill();
      ctx.strokeStyle=COL.stroke;ctx.lineWidth=1;rr(32.5,y+.5,LW-65,ch-1,14);ctx.stroke();
      portrait(32+24+R,y+ch/2,R,it[0],it[1]);
      ctx.font='700 12.5px "Space Mono", monospace';ctx.fillStyle=COL.B;
      ctx.fillText(it[2],tx,y+34);
      ctx.font=font(600,23);ctx.fillStyle=COL.ink;ctx.fillText(it[3],tx,y+62);
      ctx.font='400 17.5px Inter, sans-serif';ctx.fillStyle=COL.muted;
      for(var j=0;j<ls.length;j++)ctx.fillText(ls[j],tx,y+92+j*26);
      y+=ch+18;
    }
    return y+22;
  };
}
function bAI(LW){
  var y=56;
  dayTag(44,y,'DAY 7 · FIRST COMMITS');y+=54;
  var s=isMob?38:54, lh=s*1.16;
  ctx.font=font(700,s);ctx.fillStyle=COL.ink;
  ctx.fillText('Day 7. First commits',44,y+lh*0.82);
  ctx.fillStyle=grad(44,y+lh,LW*0.7);
  ctx.fillText('are in.',44,y+lh*1.82);
  y+=lh*2+22;
  ctx.font='400 20px Inter, sans-serif';ctx.fillStyle=COL.muted;
  ctx.fillText('AI dies in the last mile. That’s the mile we run.',44,y);
  y+=34;
  var checks=['AI agents & smart search, tested','Fast and affordable to run','Systems that hold up','Monitoring built in'];
  for(var k=0;k<checks.length;k++){
    ctx.font=font(700,15);ctx.fillStyle=COL.B;ctx.fillText('▸',44,y+20);
    ctx.font='500 18px Inter, sans-serif';ctx.fillStyle='rgba(240,228,216,.85)';
    ctx.fillText(checks[k],68,y+20);
    y+=34;
  }
  y+=20;
  button(44,y,'See the Pod','product.html','g');
  return y+52+40;
}
function bStats(LW){
  var y=56;
  dayTag(44,y,'DAY 14 · TELEMETRY');y+=54;
  var s=isMob?38:54, lh=s*1.16;
  ctx.font=font(700,s);ctx.fillStyle=COL.ink;
  ctx.fillText('Day 14. First',44,y+lh*0.82);
  ctx.fillStyle=grad(44,y+lh,LW*0.85);
  ctx.fillText('production deploy.',44,y+lh*1.82);
  y+=lh*2+16;
  ctx.font='400 15px Inter, sans-serif';ctx.fillStyle=COL.muted;
  ctx.fillText('Our median. The deploy — not the demo.',44,y+8);
  y+=44;
  var stats=[['3×','faster than hiring'],['92%','extend or re-engage'],['0','juniors, ever']];
  var cw=(LW-88)/3;
  for(var i=0;i<3;i++){
    var sx=44+i*cw;
    ctx.font=font(700,42);ctx.fillStyle='#ffd9b8';
    ctx.fillText(stats[i][0],sx,y+30);
    ctx.font='400 14px Inter, sans-serif';ctx.fillStyle=COL.dim;
    ctx.fillText(stats[i][1],sx,y+52);
  }
  y+=76;
  ctx.strokeStyle=COL.stroke;ctx.beginPath();ctx.moveTo(44,y-8);ctx.lineTo(LW-44,y-8);ctx.stroke();
  ctx.font='400 15px "Space Mono", monospace';ctx.fillStyle=COL.amber;
  ctx.fillText('> DEPLOY 0.1.0 → PROD ✓',44,y+20);
  return y+20+44;
}
function mkTier(t){
  return function(LW){
    var y=48;
    if(t.f){
      ctx.font='700 10px "Space Mono", monospace';setLS('2px');
      var tg='MOST PICKED',tw=ctx.measureText(tg).width+22;
      ctx.fillStyle=grad(LW-tw-30,y,tw);rr(LW-tw-30,y-16,tw,22,11);ctx.fill();
      ctx.fillStyle=COL.btnInk;ctx.fillText(tg,LW-tw-19,y);setLS('0px');
    }
    ctx.font=font(600,22);ctx.fillStyle=COL.ink;ctx.fillText(t.n,40,y+6);y+=48;
    ctx.font=font(700,30);ctx.fillStyle='#ffd9b8';ctx.fillText(t.p,40,y);
    ctx.font='400 12.5px Inter, sans-serif';ctx.fillStyle=COL.dim;
    ctx.fillText(t.ps,44+ctx.measureText('').width+(function(){ctx.font=font(700,30);var w=ctx.measureText(t.p).width;ctx.font='400 12.5px Inter, sans-serif';return w;})(),y);
    y+=30;
    var ls=wrapLines('400 15px Inter, sans-serif',t.d,LW-80);
    ctx.font='400 15px Inter, sans-serif';ctx.fillStyle=COL.muted;
    for(var i=0;i<ls.length;i++)ctx.fillText(ls[i],40,y+i*23);
    y+=ls.length*23+16;
    for(var k=0;k<t.li.length;k++){
      ctx.font=font(700,13);ctx.fillStyle=COL.B;ctx.fillText('✓',40,y);
      ctx.font='400 14px Inter, sans-serif';ctx.fillStyle='rgba(240,228,216,.75)';
      ctx.fillText(t.li[k],62,y);
      y+=28;
    }
    y+=14;
    button(40,y,t.b,'mailto:tapan@jinacode.systems?subject=Project%20enquiry%20-%20jinacode.systems&body=What%20I%27m%20trying%20to%20build:%0A%0A',t.s,LW-80);
    return y+52+36;
  };
}
function bCTA(LW){
  var y=70;
  ctx.textAlign='center';
  ctx.font=font(700,isMob?44:60);ctx.fillStyle=COL.ink;
  ctx.fillText('What’s stuck?',LW/2,y+16);y+=72;
  ctx.font='400 20px Inter, sans-serif';ctx.fillStyle=COL.muted;
  ctx.fillText('30 minutes. An honest answer — even if it’s “don’t build it.”',LW/2,y);y+=44;
  ctx.textAlign='left';
  ctx.font=font(600,17);
  var bw=ctx.measureText('Book an intro call').width+74;
  button((LW-bw)/2,y,'Book an intro call','mailto:tapan@jinacode.systems?subject=Project%20enquiry%20-%20jinacode.systems&body=What%20I%27m%20trying%20to%20build:%0A%0A','p');
  y+=52+30;
  ctx.textAlign='center';
  ctx.font='400 12px "Space Mono", monospace';ctx.fillStyle=COL.amber;
  ctx.fillText('> YOUR DAY 0 IS ONE CALL AWAY',LW/2,y);
  ctx.textAlign='left';
  return y+40;
}
function bFooter(LW){
  var y=52;
  var lg=imgOf('logo');
  if(lg){var lw2=58,lh3=lw2*(lg.naturalHeight/lg.naturalWidth);ctx.drawImage(lg,LW-44-lw2,y-22,lw2,lh3);}
  ctx.font='700 20px "Space Mono", monospace';ctx.fillStyle='#ffd9b8';
  ctx.fillText('{ JINA CODE }',44,y);y+=34;
  var tag=wrapLines('400 14px Inter, sans-serif','Forward-deployed engineering, productized. Senior engineers embedded to ship production AI and software — fast.',LW-88);
  ctx.font='400 14px Inter, sans-serif';ctx.fillStyle=COL.dim;
  for(var i=0;i<tag.length;i++)ctx.fillText(tag[i],44,y+i*23);
  y+=tag.length*23+26;
  var cols=[
    ['SERVICES',[['Voice AI','product.html#voice'],['WhatsApp automation','product.html#wa'],['Chatbots & RAG','product.html#rag'],['Agentic workflows','product.html#agentic'],['Web & mobile','product.html#webmobile'],['Offshore pods','product.html#offshore']]],
    ['COMPANY',[['The Pod','product.html'],['Pod tiers','product.html#tiers'],['Case reels','work.html'],['About','about.html'],['Our story','story.html'],['Contact','mailto:tapan@jinacode.systems?subject=Project%20enquiry%20-%20jinacode.systems&body=What%20I%27m%20trying%20to%20build:%0A%0A']]],
    ['GET STARTED',[['Book a call','mailto:tapan@jinacode.systems?subject=Project%20enquiry%20-%20jinacode.systems&body=What%20I%27m%20trying%20to%20build:%0A%0A'],['tapan@jinacode.systems','mailto:tapan@jinacode.systems']]]
  ];
  var colW=(LW-88)/3, y0=y, maxR=0;
  for(var c=0;c<3;c++){
    var hx=44+c*colW;
    ctx.font='700 11px "Space Mono", monospace';setLS('2px');
    ctx.fillStyle=COL.amber;ctx.fillText(cols[c][0],hx,y0);setLS('0px');
    for(var r=0;r<cols[c][1].length;r++){
      link(hx,y0+16+r*28,cols[c][1][r][0],cols[c][1][r][1]);
    }
    if(cols[c][1].length>maxR)maxR=cols[c][1].length;
  }
  y=y0+16+maxR*28+30;
  ctx.strokeStyle=COL.stroke;ctx.beginPath();ctx.moveTo(44,y-16);ctx.lineTo(LW-44,y-16);ctx.stroke();
  ctx.font='400 11px "Space Mono", monospace';ctx.fillStyle=COL.dim;
  ctx.fillText('© 2026 JINACODE SYSTEMS',44,y+6);
  ctx.fillStyle=COL.B;
  ctx.fillText('DAY 28+ — RUNNING WITHOUT US ▮',44,y+28);
  return y+52;
}
function mkGate(txt){
  return function(LW){
    ctx.textAlign='center';
    ctx.font='700 42px "Space Mono", monospace';setLS('4px');
    ctx.fillStyle=COL.amber;
    ctx.shadowColor='rgba(255,140,80,.9)';ctx.shadowBlur=18;
    ctx.fillText(txt,LW/2,58);
    ctx.shadowBlur=0;setLS('0px');ctx.textAlign='left';
    return 88;
  };
}

function mkShop(name){
  return function(LW){
    var H3=210;
    ctx.fillStyle='#0a0712';rr(0,0,LW,H3,8);ctx.fill();
    ctx.strokeStyle='rgba(255,190,140,.35)';ctx.lineWidth=2;rr(1,1,LW-2,H3-2,8);ctx.stroke();
    for(var a5=0;a5<6;a5++){ctx.fillStyle=a5%2?'rgba(255,120,70,.5)':'rgba(255,236,220,.25)';rr(a5*(LW/6)+3,26,LW/6-6,12,3);ctx.fill();}
    /* logo mark */
    var mx=LW/2-((name.length*19)/2)-34, my=76;
    ctx.shadowColor='rgba(255,200,150,.8)';ctx.shadowBlur=14;
    if(name==='MICROSOFT'){
      var mc=['#f25022','#7fba00','#00a4ef','#ffb900'];
      for(var q5=0;q5<4;q5++){ctx.fillStyle=mc[q5];ctx.fillRect(mx+(q5%2)*17,my-28+Math.floor(q5/2)*17,15,15);}
    }else if(name==='AWS'){
      ctx.strokeStyle='#ff9900';ctx.lineWidth=4;ctx.beginPath();
      ctx.arc(mx+16,my-18,17,0.15*Math.PI,0.85*Math.PI);ctx.stroke();
      ctx.beginPath();ctx.moveTo(mx+33,my-6);ctx.lineTo(mx+38,my-14);ctx.lineTo(mx+29,my-12);ctx.closePath();
      ctx.fillStyle='#ff9900';ctx.fill();
    }else if(name==='NVIDIA'){
      ctx.strokeStyle='#76b900';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(mx+16,my-18,14,-0.4*Math.PI,0.9*Math.PI);ctx.stroke();
      ctx.beginPath();ctx.arc(mx+20,my-18,7,0.6*Math.PI,1.9*Math.PI);ctx.stroke();
    }else if(name==='ANTHROPIC'){
      ctx.strokeStyle='#e8ddd0';ctx.lineWidth=5;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(mx+4,my-4);ctx.lineTo(mx+16,my-32);ctx.lineTo(mx+28,my-4);ctx.stroke();
      ctx.beginPath();ctx.moveTo(mx+11,my-14);ctx.lineTo(mx+21,my-14);ctx.stroke();ctx.lineCap='butt';
    }else{ /* CLAUDE starburst */
      ctx.strokeStyle='#d97706';ctx.lineWidth=4;ctx.lineCap='round';
      for(var r5=0;r5<8;r5++){var an=r5*Math.PI/4;
        ctx.beginPath();ctx.moveTo(mx+16+Math.cos(an)*6,my-18+Math.sin(an)*6);
        ctx.lineTo(mx+16+Math.cos(an)*16,my-18+Math.sin(an)*16);ctx.stroke();}
      ctx.lineCap='butt';
    }
    ctx.shadowBlur=0;
    ctx.textAlign='left';ctx.font='700 30px "Space Mono", monospace';setLS('2px');
    ctx.shadowColor='rgba(255,170,110,.9)';ctx.shadowBlur=16;
    ctx.fillStyle='#ffd9b8';ctx.fillText(name,mx+52,86);ctx.shadowBlur=0;setLS('0px');
    ctx.textAlign='center';
    ctx.font='400 12px "Space Mono", monospace';ctx.fillStyle=COL.dim;
    ctx.fillText('IN OUR STACK — DAILY',LW/2,112);
    ctx.fillStyle='rgba(255,200,140,.13)';rr(24,132,LW-48,56,6);ctx.fill();
    for(var w5=0;w5<4;w5++){ctx.fillStyle='rgba(255,220,180,.35)';rr(40+w5*((LW-80)/4),146,(LW-80)/4-14,28,4);ctx.fill();}
    ctx.textAlign='left';
    return H3;
  };
}
function mkJunction(l,r){
  return function(LW){
    ctx.textAlign='center';
    ctx.font='700 15px "Space Mono", monospace';setLS('3px');
    ctx.fillStyle=COL.dim;ctx.fillText('JUNCTION — CHOOSE YOUR ROAD',LW/2,40);setLS('0px');
    ctx.font='700 30px "Space Mono", monospace';
    ctx.fillStyle=COL.amber;
    ctx.shadowColor='rgba(255,140,80,.8)';ctx.shadowBlur=14;
    ctx.fillText('←  '+l.toUpperCase(),LW*0.27,88);
    ctx.fillText(r.toUpperCase()+'  →',LW*0.73,88);
    ctx.shadowBlur=0;ctx.textAlign='left';
    return 118;
  };
}
function mkBigLine(tag,big,gradLast,support){
  return function(LW){
    var y=56;
    if(tag){dayTag(44,y,tag);y+=54;}
    var lines=big.split('\n');
    var sz=isMob?40:58, lh=sz*1.14;
    ctx.font=font(700,sz);
    for(var i=0;i<lines.length;i++){
      ctx.fillStyle=(gradLast&&i===lines.length-1)?grad(44,y+i*lh,LW*0.8):COL.ink;
      ctx.fillText(lines[i],44,y+lh*0.82+i*lh);
    }
    y+=lines.length*lh+18;
    if(support){
      ctx.font='400 20px Inter, sans-serif';ctx.fillStyle=COL.muted;
      ctx.fillText(support,44,y+4);
      y+=34;
    }
    return y+36;
  };
}
/* candid photo tile, cover-cropped with a face-friendly bias */
function coverTile(key,x,y,w,h){
  var im=imgOf(key);
  ctx.save();rr(x,y,w,h,12);
  if(im){
    ctx.clip();
    var iw=im.naturalWidth,ih=im.naturalHeight,s=Math.max(w/iw,h/ih);
    ctx.drawImage(im,(iw-w/s)/2,(ih-h/s)*0.35,w/s,h/s,x,y,w,h);
  }else{ctx.fillStyle='rgba(255,236,220,0.05)';ctx.fill();}
  ctx.restore();
  ctx.strokeStyle=COL.stroke;ctx.lineWidth=1;rr(x+.5,y+.5,w-1,h-1,12);ctx.stroke();
}
/* the crew billboard: field footage of the actual team */
function bStoryCrew(LW){
  var y=56;
  dayTag(44,y,'THE CREW · FIELD FOOTAGE');y+=54;
  var s=isMob?36:48, lh=s*1.16;
  ctx.font=font(700,s);ctx.fillStyle=COL.ink;
  ctx.fillText('Small crew.',44,y+lh*0.82);
  ctx.fillStyle=grad(44,y+lh,LW*0.6);
  ctx.fillText('Senior only.',44,y+lh*1.82);
  y+=lh*2+26;
  var w=LW-88,g=14;
  if(isMob){
    coverTile('cgrp',44,y,w,240);y+=240+g;
    var w2=(w-g)/2,h2=150;
    coverTile('cnv',44,y,w2,h2);coverTile('cdin',44+w2+g,y,w2,h2);y+=h2+g;
    coverTile('crev',44,y,w2,h2);coverTile('cfes',44+w2+g,y,w2,h2);y+=h2+g;
  }else{
    var lw2=Math.round(w*0.60), rw=w-lw2-g, lh2=330, rh=(lh2-g)/2;
    coverTile('cgrp',44,y,lw2,lh2);
    coverTile('cnv',44+lw2+g,y,rw,rh);
    coverTile('cfes',44+lw2+g,y+rh+g,rw,rh);
    y+=lh2+g;
    var w3=(w-2*g)/3,h3=170;
    coverTile('cdin',44,y,w3,h3);
    coverTile('crev',44+w3+g,y,w3,h3);
    coverTile('coff',44+2*(w3+g),y,w3,h3);
    y+=h3+g;
  }
  y+=12;
  var cap=wrapLines('400 18px Inter, sans-serif','Office days, demo nights, NVIDIA AI Summit, GITEX — the crew behind every pod.',w);
  ctx.font='400 18px Inter, sans-serif';ctx.fillStyle=COL.muted;
  for(var c9=0;c9<cap.length;c9++)ctx.fillText(cap[c9],44,y+6+c9*28);
  y+=cap.length*28+12;
  return y+36;
}
function bContact(LW){
  var y=56;
  dayTag(44,y,'UPLINK · DIRECT');y+=54;
  var sz=isMob?38:52, lh=sz*1.14;
  ctx.font=font(700,sz);ctx.fillStyle=COL.ink;
  ctx.fillText('Tell us what',44,y+lh*0.82);
  ctx.fillStyle=grad(44,y+lh,LW*0.7);
  ctx.fillText('you’re shipping.',44,y+lh*1.82);
  y+=lh*2+24;
  ctx.font='400 20px Inter, sans-serif';ctx.fillStyle=COL.muted;
  ctx.fillText('30-min call → scope → your Day 0.',44,y);y+=42;
  button(44,y,'Book an intro call','mailto:tapan@jinacode.systems?subject=Project%20enquiry%20-%20jinacode.systems&body=What%20I%27m%20trying%20to%20build:%0A%0A','p');
  y+=52+26;
  link(44,y,'tapan@jinacode.systems','mailto:tapan@jinacode.systems');
  return y+22+40;
}
/* ---------- service billboard: one board per service on the product road ---------- */
function mkService(o){ /* {num,name,big,support,checks,stack,statB,statL,reelL,reelH,extra} */
  return function(LW){
    var y=56;
    dayTag(44,y,'SERVICE '+o.num+' · '+o.name);y+=54;
    var lines=o.big.split('\n');
    var sz=isMob?34:46, lh=sz*1.14;
    ctx.font=font(700,sz);
    for(var i=0;i<lines.length;i++){
      ctx.fillStyle=(i===lines.length-1)?grad(44,y+i*lh,LW*0.8):COL.ink;
      ctx.fillText(lines[i],44,y+lh*0.82+i*lh);
    }
    y+=lines.length*lh+16;
    var ls=wrapLines('400 19px Inter, sans-serif',o.support,LW-96);
    ctx.font='400 19px Inter, sans-serif';ctx.fillStyle=COL.muted;
    for(var j=0;j<ls.length;j++)ctx.fillText(ls[j],44,y+j*29);
    y+=ls.length*29+18;
    for(var k=0;k<o.checks.length;k++){
      ctx.font=font(700,15);ctx.fillStyle=COL.B;ctx.fillText('▸',44,y+19);
      ctx.font='500 17.5px Inter, sans-serif';ctx.fillStyle='rgba(240,228,216,.86)';
      ctx.fillText(o.checks[k],68,y+19);
      y+=31;
    }
    y+=14;
    ctx.strokeStyle=COL.stroke;ctx.beginPath();ctx.moveTo(44,y-6);ctx.lineTo(LW-44,y-6);ctx.stroke();
    var sl2=wrapLines('400 13.5px "Space Mono", monospace','> '+o.stack,LW-96);
    ctx.font='400 13.5px "Space Mono", monospace';ctx.fillStyle=COL.amber;
    for(var m3=0;m3<sl2.length;m3++)ctx.fillText(sl2[m3],44,y+18+m3*22);
    y+=sl2.length*22+26;
    ctx.font=font(700,40);ctx.fillStyle=grad(44,y,300);
    ctx.fillText(o.statB,44,y+14);
    ctx.font='400 14px Inter, sans-serif';ctx.fillStyle=COL.dim;
    ctx.fillText(o.statL,44+ctx.measureText('').width+(function(){ctx.font=font(700,40);var w=ctx.measureText(o.statB).width;ctx.font='400 14px Inter, sans-serif';return w;})()+18,y+13);
    y+=40;
    var b1=button(44,y,'Book a call','mailto:tapan@jinacode.systems?subject=Project%20enquiry%20-%20jinacode.systems&body=What%20I%27m%20trying%20to%20build:%0A%0A','p');
    button(44+b1+14,y,o.reelL,o.reelH,'g');
    y+=52;
    if(o.extra){
      y+=18;
      for(var x2=0;x2<o.extra.length;x2++)link(44+x2*230,y,o.extra[x2][0],o.extra[x2][1]);
      y+=22;
    }
    return y+38;
  };
}
function drawMock(x,y,w,h,kind,url){ /* kind = [[in],[built],[out]] */
  ctx.fillStyle='#0d0a16';rr(x,y,w,h,10);ctx.fill();
  ctx.strokeStyle='rgba(255,190,140,.25)';ctx.lineWidth=1.5;rr(x+.5,y+.5,w-1,h-1,10);ctx.stroke();
  ctx.fillStyle='rgba(255,236,220,.06)';rr(x,y,w,30,10);ctx.fill();
  for(var d3=0;d3<3;d3++){ctx.fillStyle=['#ff5f57','#febc2e','#28c840'][d3];ctx.beginPath();ctx.arc(x+18+d3*16,y+15,4.5,0,7);ctx.fill();}
  ctx.font='400 11px "Space Mono", monospace';ctx.fillStyle=COL.dim;ctx.fillText(url,x+70,y+19);
  var iy=y+46,ix=x+18,iw=w-36;
  var bw3=(iw-96)/3;
  for(var f4=0;f4<3;f4++){
    var bx3=ix+f4*(bw3+48);
    ctx.fillStyle=f4===1?'rgba(255,120,70,.16)':'rgba(255,236,220,.07)';
    rr(bx3,iy,bw3,120,10);ctx.fill();
    ctx.strokeStyle=f4===1?'rgba(255,170,110,.6)':COL.stroke;ctx.lineWidth=1.4;
    rr(bx3+.7,iy+.7,bw3-1.4,118.6,10);ctx.stroke();
    ctx.font='700 11px "Space Mono", monospace';setLS('2px');
    ctx.fillStyle=COL.amber;ctx.fillText(['INPUT','WE BUILT','OUTCOME'][f4],bx3+14,iy+24);setLS('0px');
    ctx.font=(f4===1?'600':'400')+' 16px Inter, sans-serif';
    ctx.fillStyle=f4===1?'#ffd9b8':COL.muted;
    for(var g4=0;g4<kind[f4].length;g4++)ctx.fillText(kind[f4][g4],bx3+14,iy+52+g4*24);
    if(f4<2){ctx.font=font(700,24);ctx.fillStyle=COL.B;ctx.fillText('→',bx3+bw3+14,iy+68);}
  }
}
/* real product still inside the browser chrome; falls back to the flow mock */
function drawShot(x,y,w,h,kind,url,key,live){
  var im=imgOf(key);
  if(!im){drawMock(x,y,w,h,kind,url);}
  else{
    ctx.fillStyle='#0d0a16';rr(x,y,w,h,10);ctx.fill();
    ctx.strokeStyle='rgba(255,190,140,.25)';ctx.lineWidth=1.5;rr(x+.5,y+.5,w-1,h-1,10);ctx.stroke();
    ctx.fillStyle='rgba(255,236,220,.06)';rr(x,y,w,30,10);ctx.fill();
    for(var d3=0;d3<3;d3++){ctx.fillStyle=['#ff5f57','#febc2e','#28c840'][d3];ctx.beginPath();ctx.arc(x+18+d3*16,y+15,4.5,0,7);ctx.fill();}
    ctx.font='400 11px "Space Mono", monospace';ctx.fillStyle=COL.dim;ctx.fillText(url,x+70,y+19);
    var cy=y+30,chh=h-30,iw=im.naturalWidth,ih=im.naturalHeight;
    ctx.save();rr(x,y,w,h,10);ctx.clip();
    if(ih>iw){ /* portrait app shot → three storyboard panes (top/middle/bottom) */
      var pw=(w-16)/3;
      for(var p3=0;p3<3;p3++){
        var sh2=Math.min(ih,iw*(chh/pw));
        ctx.drawImage(im,0,(ih-sh2)*(p3*0.5),iw,sh2,x+p3*(pw+8),cy,pw,chh);
      }
    }else{ /* landscape → widescreen cover crop, biased to the hero */
      var s6=Math.max(w/iw,chh/ih),sw6=w/s6,sh6=chh/s6;
      ctx.drawImage(im,(iw-sw6)/2,Math.min(ih-sh6,ih*0.06),sw6,sh6,x,cy,w,chh);
    }
    var g6=ctx.createLinearGradient(0,cy+chh-56,0,cy+chh);
    g6.addColorStop(0,'rgba(5,2,8,0)');g6.addColorStop(1,'rgba(5,2,8,.6)');
    ctx.fillStyle=g6;ctx.fillRect(x,cy+chh-56,w,56);
    ctx.restore();
  }
  ctx.font='700 10px "Space Mono", monospace';setLS('1px');
  var tag=live?'● LIVE — CLICK TO VISIT':'● PRIVATE DEPLOYMENT';
  ctx.fillStyle=live?'#5bff9e':COL.dim;
  ctx.fillText(tag,x+w-ctx.measureText(tag).width-14,y+19);setLS('0px');
  if(live&&curLinks)curLinks.push({x:x,y:y,w:w,h:h,href:live,label:'Visit live site ↗'});
}
function mkScreen(idx,title,setup,build2,result,statB,statL,nextHref,svcL,svcH,shotKey,live){
  return function(LW){
    var H2=700;
    /* cinema frame */
    ctx.fillStyle='#07040c';rr(0,0,LW,H2,10);ctx.fill();
    ctx.strokeStyle='rgba(255,190,140,.30)';ctx.lineWidth=2;rr(1,1,LW-2,H2-2,10);ctx.stroke();
    /* sprocket holes */
    ctx.fillStyle='rgba(255,220,190,.14)';
    for(var sp3=0;sp3<9;sp3++){rr(14,26+sp3*58,16,26,4);ctx.fill();rr(LW-30,26+sp3*58,16,26,4);ctx.fill();}
    ctx.font='700 12px "Space Mono", monospace';setLS('3px');
    ctx.fillStyle=COL.amber;
    ctx.fillText('REEL 0'+idx+' / 07',56,44);
    ctx.fillStyle=COL.dim;ctx.fillText('JINACODE PICTURES — FILMED IN PRODUCTION',LW-470,44);setLS('0px');
    ctx.font=font(700,isMob?32:46);ctx.fillStyle=COL.ink;
    ctx.fillText(title,56,104);
    var FLOWS=[
     [['Trade docs,','shipment data'],['OCR pipelines,','secure APIs'],['IPO-grade','platform']],
     [['Dense humanities','curricula'],['LMS: courses,','journeys, CMS'],['Web + mobile','learners']],
     [['Recorded','support calls'],['STT + NLP','audit engine'],['Scored','questionnaires']],
     [['40+ client','ERPs'],['Canonical model','+ rule-packs'],['Live Peppol','invoices']],
     [['5 channels,','12 providers'],['One API','+ MCP server'],['Broadcasts, inbox,','AI agents']],
     [['Tally Prime','books'],['Claude MCP','server'],['Accounts in','plain language']],
     [['Show-cause','notices'],['Issues → grounds','→ precedents'],['Signable draft','in hours']]];
    var KIND=FLOWS[idx-1]||FLOWS[0];
    var URLS=['jinacode.systems/eris','jinacode.systems/humanities','jinacode.systems/ifh-voice','peppolbridge.jinacode.systems','jinaconnect.jinacode.systems','claudally.jinacode.systems','gst365.co.in'];
    drawShot(56,128,LW-112,246,KIND,URLS[idx-1]||'',shotKey,live);
    /* three acts */
    var acts=[['SETUP',setup],['BUILD',build2],['RESULT',result]];
    var cw=(LW-112-40)/3;
    for(var a2=0;a2<3;a2++){
      var ax=56+a2*(cw+20);
      ctx.font='700 12px "Space Mono", monospace';setLS('2px');
      ctx.fillStyle=COL.B;ctx.fillText('0'+(a2+1)+' · '+acts[a2][0],ax,398);setLS('0px');
      ctx.strokeStyle=COL.stroke;ctx.beginPath();ctx.moveTo(ax,410);ctx.lineTo(ax+cw-14,410);ctx.stroke();
      var ls=wrapLines('400 19px Inter, sans-serif',acts[a2][1],cw-14);
      ctx.font='400 19px Inter, sans-serif';ctx.fillStyle=COL.muted;
      for(var l2=0;l2<ls.length;l2++)ctx.fillText(ls[l2],ax,438+l2*29);
    }
    /* outcome stat */
    ctx.font=font(700,60);ctx.fillStyle=grad(56,545,340);
    ctx.fillText(statB,56,583);
    ctx.font='400 16px Inter, sans-serif';ctx.fillStyle=COL.dim;
    ctx.fillText(statL,56,611);
    /* reel nav + service cross-link */
    button(56,H2-76,'← All cases','work.html','g');
    ctx.font=font(600,17);
    var nw=ctx.measureText('Next reel').width+74;
    button(LW-56-nw,H2-76,'Next reel',nextHref,'p');
    if(svcL){
      ctx.font=font(600,17);
      var sw2=ctx.measureText(svcL).width+48;
      button((LW-sw2)/2,H2-76,svcL,svcH,'g');
    }
    return H2;
  };
}
function mkCases(items,start){
  return function(LW){
    var y=40;
    for(var i=0;i<items.length;i++){
      var ls=wrapLines('400 18px Inter, sans-serif',items[i][1],LW-140);
      var ch=96+ls.length*28+62;
      ctx.fillStyle='rgba(255,236,220,0.045)';rr(32,y,LW-64,ch,14);ctx.fill();
      ctx.strokeStyle=COL.stroke;ctx.lineWidth=1;rr(32.5,y+.5,LW-65,ch-1,14);ctx.stroke();
      ctx.font='700 13.5px "Space Mono", monospace';ctx.fillStyle=COL.B;
      ctx.fillText('REEL 0'+(start+i),56,y+34);
      ctx.font=font(600,24);ctx.fillStyle=COL.ink;ctx.fillText(items[i][0],56,y+64);
      ctx.font='400 18px Inter, sans-serif';ctx.fillStyle=COL.muted;
      for(var j=0;j<ls.length;j++)ctx.fillText(ls[j],56,y+94+j*28);
      button(56,y+ch-66,'▶ Watch reel 0'+(start+i),'case'+(start+i)+'.html','g');
      y+=ch+18;
    }
    return y+22;
  };
}
/* ---------- atlas build & panel placement ---------- */
function buildAtlas(){
  var maxT=gl?gl.getParameter(gl.MAX_TEXTURE_SIZE):4096;
  AW=Math.min(4096,maxT);
  COLS=3; cellW=Math.floor(AW/COLS);
  /* (packing may bump COLS below if the atlas would overflow) */
  logicalW=isMob?600:880;
  cs=cellW/ (isMob?640:940);        /* px per logical */
  var LW=isMob?640:940;

  var tiers=[
   {n:'Strike',p:'1 engineer',ps:'/ dedicated',d:'One senior engineer. One sharply defined outcome. Weeks, not quarters.',li:['1 senior engineer','2–6 weeks','Weekly demo + handover'],b:'Enquire',s:'g',f:false},
   {n:'Pod',p:'2–3 engineers',ps:'/ team',d:'A senior team that owns an entire product area, end to end.',li:['2–3 engineers + a lead','Owns the whole area','Weekly increments','Quality testing & monitoring'],b:'Get started',s:'p',f:true},
   {n:'Platform',p:'Scaled',ps:'/ multi-pod',d:'Several pods, one architecture — delivery at program scale.',li:['Several teams','A chief architect','Quarterly planning'],b:'Talk to us',s:'g',f:false}
  ];
  var defs=[
   {id:'hero', draw:bHero, hw:1.90},
   {id:'trust',draw:bTrust,hw:1.95},
   {id:'step0',draw:mkLog('DAY 0–3 · SCOPE','Day 0. Find\nwhat’s stuck.',true,'One session. One metric. One provable slice.','SCOPE.LOCK — TARGET ACQUIRED'),hw:1.70},
   {id:'step1',draw:mkLog('DAY 3–7 · EMBED','Day 3. We’re in\nyour repo.',true,'Access, plan and first commits — all inside week one.','git push origin main — ACCEPTED'),hw:1.70},
   {id:'step2',draw:mkLog('WEEK 2–4 · SHIP','Day 21. The engine\nis running.',true,'Working software every week. You set the priorities.','RELEASE CADENCE: WEEKLY — STABLE'),hw:1.70},
   {id:'step3',draw:mkLog('DAY 28 · HAND OFF','Day 28.\nYours. Running.',true,'Docs, tests, pairing — then we hand you the keys.','POD DETACHED — SYSTEMS NOMINAL'),hw:1.70},
   {id:'whyIntro',draw:bWhyIntro,hw:1.85},
   {id:'whyA',draw:mkCards([['On your team, not sidelined','Real code in week one — not a deck in month three.','01'],['AI that actually launches','Demos are easy. We build the evals, guardrails and plumbing that make them real.','02'],['Progress you can see','A live demo every week. Software you can click, not status you have to trust.','03']]),hw:1.35},
   {id:'whyB',draw:mkCards([['Senior by default','Everyone has run production systems. No trainees, no swaps after signing.','04'],['Knowledge stays with you','We document and pair as we go — your team owns it when we step away.','05'],['Fixed scope, fixed price','You know the outcome and the invoice before day one.','06']]),hw:1.35},
   {id:'ai',draw:bAI,hw:1.90},
   {id:'stats',draw:bStats,hw:1.80},
   {id:'pod0',draw:mkTier(tiers[0]),hw:0.78,lw:460},
   {id:'pod1',draw:mkTier(tiers[1]),hw:0.78,lw:460},
   {id:'pod2',draw:mkTier(tiers[2]),hw:0.78,lw:460},
   {id:'cta',draw:bCTA,hw:1.70},
   {id:'footer',draw:bFooter,hw:1.85},
   /* --- route pages --- */
   {id:'prodHero',draw:mkLog('THE SERVICE GRID','Six boards.\nSix ways we ship.',true,'One bar for all of them: senior pods, fixed scope, production or it didn’t happen. Every board links to a reel shot in production. Ride on.','GRID ONLINE — 6/6 SERVICES LIT'),hw:1.80},
   {id:'svcVoice',draw:mkService({num:'01',name:'VOICE AI',big:'Real-time voice\nagents at scale.',
    support:'Live conversations, intent and action — plus post-call audit, QA and analytics. Compliant across languages, regions and deployments.',
    checks:['Live agents — barge-in, diarization, low latency','Post-call intelligence: audit, QA, analytics','IVR replacement on SIP, Asterisk & PSTN','Actions into CRM, ticketing, booking, payments','Cloud, private-cloud or on-prem'],
    stack:'WHISPER · NVIDIA NEMO · LIVEKIT · SIP/ASTERISK · HUGGING FACE',
    statB:'₹5–9',statL:'per minute, end-to-end runtime',
    reelL:'▶ Reel 03 · IFH Voice Audit',reelH:'case3.html'}),hw:1.85},
   {id:'svcWA',draw:mkService({num:'02',name:'WHATSAPP AUTOMATION',big:'WhatsApp that\ncloses the loop.',
    support:'Not canned replies — a conversational system that understands intent, talks to your tools, and executes: support, sales, bookings, payments.',
    checks:['Auto-resolve FAQs, tickets & order tracking','Lead capture → qualification → CRM push','Scheduling, payments & refunds in-chat','Message → intent → RAG → action → log','Human handoff exactly when it matters'],
    stack:'WA BUSINESS API · RAG PIPELINES · SALESFORCE · HUBSPOT · ZOHO · ZENDESK',
    statB:'24/7',statL:'support, sales & collections in-chat',
    reelL:'▶ Reel 05 · JinaConnect',reelH:'case5.html'}),hw:1.85},
   {id:'svcRAG',draw:mkService({num:'03',name:'CHATBOTS & RAG',big:'Chatbots & RAG,\nbuilt for production.',
    support:'Grounded answers with citations from your approved sources — intent, retrieval and safe actions across your business systems.',
    checks:['Hallucination control: retrieval-first + thresholds','Source-grounded answers, citations included','Hybrid retrieval, re-ranking, live re-indexing','Tenant isolation, RBAC, full audit trails','On-prem, private cloud — air-gapped if needed'],
    stack:'OPENAI + OSS LLMS · PINECONE · WEAVIATE · QDRANT · FAISS',
    statB:'0',statL:'ungrounded answers shipped',
    reelL:'▶ Reel 07 · GST365',reelH:'case7.html'}),hw:1.85},
   {id:'svcAgent',draw:mkService({num:'04',name:'AGENTIC WORKFLOWS',big:'Agents that execute,\nnot just answer.',
    support:'Multi-step AI that reasons, uses tools and acts inside defined boundaries — state-driven workflows, not prompt chains.',
    checks:['Planning, branching, retries, validation','Tool-using agents: APIs, DBs, internal systems','Bounded autonomy + human checkpoints','Full audit log of every decision & action','Versioned workflows with rollback'],
    stack:'LANGGRAPH · PYTHON ORCHESTRATION · MCP · OBSERVABILITY BAKED IN',
    statB:'5',statL:'stages: frame → pilot → production → scale',
    reelL:'▶ Reel 06 · Claudally',reelH:'case6.html'}),hw:1.85},
   {id:'svcWeb',draw:mkService({num:'05',name:'WEB & MOBILE',big:'Platforms for web.\nMission-critical mobile.',
    support:'Enterprise-grade web applications and offline-first mobile — AI embedded in the core, engineering that holds at scale.',
    checks:['AI-first: copilots, RAG & agentic backends','Django · FastAPI · Postgres · Redis · Celery','Microservices, Docker, K8s on AWS/GCP','Flutter, Swift & Kotlin — offline-first sync','Dashboards, ERP/CRM extensions, portals'],
    stack:'DISCOVERY → DESIGN → DEVELOP → VALIDATE, DEMOS EVERY CYCLE',
    statB:'1 team',statL:'web, mobile & backend — no handoffs',
    reelL:'▶ Reel 01 · ERIS',reelH:'case1.html',
    extra:[['Reel 02 · Humanities →','case2.html'],['Reel 04 · PeppolBridge →','case4.html']]}),hw:1.85},
   {id:'svcTeam',draw:mkService({num:'06',name:'OFFSHORE / ONSITE PODS',big:'Your delivery arm,\nwhite-label.',
    support:'For agencies and consultancies: senior pods that plug into your tools, under your brand — you stay client-facing, we execute.',
    checks:['Backend (Python/Django) · Frontend (React/Next)','Mobile (Flutter/native) and QA engineers','Shortlisted profiles inside 48 hours','T&M billing, timezone-aligned, no rigidity','Your Slack, your Jira, your GitHub'],
    stack:'DISCOVER → SHORTLIST (48H) → EVALUATE → INTEGRATE → SHIP',
    statB:'48h',statL:'from brief to shortlisted engineers',
    reelL:'▶ All reels',reelH:'work.html'}),hw:1.85},
   {id:'workHero',draw:mkBigLine('SHIPPED','Built inside.\nShipped for real.',true,'Seven reels, filmed in production — real systems, real clients, real numbers.'),hw:1.85},
   {id:'workA',draw:mkCases([['ERIS · Exim Routes','IPO-stage trade intelligence platform.'],['Institute of Humanities','Digital learning, web + mobile.'],['IFH Voice Audit','Calls → structured audit intelligence.']],1),hw:1.45},
   {id:'workB',draw:mkCases([['PeppolBridge','ERP→Peppol connector layer, 5 markets.'],['JinaConnect','Open-source multi-channel CPaaS.'],['Claudally','Drive Tally Prime with Claude.'],['GST365','Litigation intelligence for tax practices.']],4),hw:1.45},
   {id:'scr1',draw:mkScreen(1,'ERIS — trade intelligence','An IPO-bound trade platform needed its intelligence backbone.','Secure APIs, OCR pipelines, automation — owned end to end.','Jan ’24 → IPO-stage. Zero rewrites.','23 mo','one team, no rewrites','case2.html','Service: Web & Mobile →','product.html#webmobile','shot1',null),hw:2.60,film:true},
   {id:'scr2',draw:mkScreen(2,'Humanities, built to endure','Dense humanities curricula needed real depth, web + mobile.','Course architecture, learner journeys, faculty CMS.','A stable academic core that evolves without disruption.','Web·App','one academic core','case3.html','Service: Web & Mobile →','product.html#webmobile','shot2',null),hw:2.60,film:true},
   {id:'scr3',draw:mkScreen(3,'Voice audits, automated','Manual call audits: slow, fatiguing, inconsistent.','Speech-to-text + NLP map calls straight to questionnaires.','Auditors interpret insights instead of re-listening.','Hrs→min','per audit turnaround','case4.html','Service: Voice AI →','product.html#voice','shot3',null),hw:2.60,film:true},
   {id:'scr4',draw:mkScreen(4,'PeppolBridge — e-invoicing','Every Peppol mandate hits the same wall: client ERPs.','40+ connectors, one canonical model, country rule-packs.','UAE · MY · BE · OM · QA on one platform.','7 days','access → first live invoice','case5.html','Service: Web & Mobile →','product.html#webmobile','shot4','https://peppolbridge.jinacode.systems'),hw:2.60,film:true},
   {id:'scr5',draw:mkScreen(5,'JinaConnect — open CPaaS','Five channels, a dozen providers, zero unity.','One API: WhatsApp, Voice, Telegram, SMS, RCS — plus MCP.','Open-source, self-hosted, white-labeled by agencies.','13','MCP tools for AI agents','case6.html','Service: WhatsApp →','product.html#wa','shot5','https://jinaconnect.jinacode.systems'),hw:2.60,film:true},
   {id:'scr6',draw:mkScreen(6,'Claudally — Tally × Claude','Your books, locked inside Tally Prime.','An MCP server: reports, vouchers, GST — in plain language.','Local-first, deterministic, AGPL open source.','5 min','install → talking to books','case7.html','Service: Agentic →','product.html#agentic','shot6','https://claudally.jinacode.systems'),hw:2.60,film:true},
   {id:'scr7',draw:mkScreen(7,'GST365 — litigation intel','Every show-cause notice lands on the same senior desks.','Issues → grounds → precedent maps → a signable draft.','Two decades of doctrine, delivered as software.','Hours','to a signable first draft','work.html','Service: Chat & RAG →','product.html#rag','shot7','https://gst365.co.in'),hw:2.60,film:true},
   {id:'storyHero',draw:mkLog('OUR STORY · THE BELIEF','Reduce complexity.\nNever add to it.',true,'Jina Code Systems was founded on that one belief. Product engineering, systems thinking and applied AI — software that is thoughtful, resilient, and built to serve real needs for the long term.','FOUNDING PRINCIPLE — LOCKED'),hw:1.75},
   {id:'storyLesson',draw:mkLog('THE TURNING POINT','Finished is not\nthe same as endures.',true,'In our early months we optimized for delivery speed — and met the hidden cost of rushed decisions. It reshaped us: architecture, ownership, calm execution, systems that stay stable long after launch.','LESSON COMMITTED — BUILD TO ENDURE'),hw:1.75},
   {id:'storyFounders',draw:mkPeople([
    ['tapan','TJ','01 · CHIEF EVERYTHING OFFICER','Tapan Jain','IIT Roorkee · ISB Hyderabad. Strategy, product direction, long-term ownership — what Jina builds is thoughtful, scalable, built to last.'],
    ['amit','AJ','02 · CHIEF OPERATING OFFICER','Amit Joshi','IIT Roorkee. Quality and engineering culture — systems reviewed thoroughly, standards upheld, teams accountable.']],56),hw:1.50},
   {id:'storyAdvisors',draw:mkPeople([
    ['pawan','PJ','ADV 01 · GOVERNANCE','Pawan Kumar Jain','Former Directorate General, GST (IRS) · GST Council Law Committee. Compliance-by-design for large-scale digital systems.'],
    ['prasun','PM','ADV 02 · DATA & AI','Prasun Mishra','Chief Data & AI Officer, Tavant. Two decades taking enterprise AI from pilot to production at global scale.'],
    ['shivhari','SG','ADV 03 · FINANCE','Shivhari Garg','Chartered Accountant, 35+ years. Audit frameworks and regulation translated into system design.']],46),hw:1.50},
   {id:'storyCrew',draw:bStoryCrew,hw:1.60},
   {id:'storyCreed',draw:(function(){var f=mkLog('THE CREED','We take responsibility\nfor what we build.',true,'A small, focused crew that ships work we can stand behind — systems that quietly do their job well, day after day.','CREW STATUS: RELENTLESS');return function(LW){var h=f(LW);var b1=button(44,h-16,'Book a consultation','mailto:tapan@jinacode.systems?subject=Project%20enquiry%20-%20jinacode.systems&body=What%20I%27m%20trying%20to%20build:%0A%0A','p');button(44+b1+14,h-16,'Our principles →','about.html#principles','g');return h+56;};})(),hw:1.75},
   {id:'workCTA',draw:mkLog('NEXT SLOT','Want to be\nthe next one?',true,'One pod slot opens each quarter.','SLOT STATUS: OPEN'),hw:1.70},
   {id:'aboutHero',draw:mkBigLine('WHO WE ARE','The best software\nis built inside.',true,'Proximity beats process. Ownership beats advice.'),hw:1.85},
   {id:'aboutA',draw:mkCards([['Ship weekly','…or explain why.','01'],['Senior only','No bench. Ever.','02'],['Leave you stronger','The muscle memory stays.','03']]),hw:1.35},
   {id:'aboutB',draw:(function(){var f=mkCards([['Price the outcome','Not the hours.','04'],['Production is the point','Demos don’t count.','05'],['Say the true thing','Especially when it’s hard.','06']]);return function(LW){var h=f(LW);button(32,h-16,'Our story →','story.html','g');return h+56;};})(),hw:1.35},
   {id:'contactB',draw:bContact,hw:1.70},
   {id:'jHome',draw:mkJunction('work','product'),hw:1.35,lw:700,gate:true},
   {id:'jProduct',draw:mkJunction('work','contact'),hw:1.35,lw:700,gate:true},
   {id:'jWork',draw:mkJunction('about','product'),hw:1.35,lw:700,gate:true},
   {id:'jAbout',draw:mkJunction('work','contact'),hw:1.35,lw:700,gate:true},
   {id:'jContact',draw:mkJunction('home','product'),hw:1.35,lw:700,gate:true},
   {id:'jCase',draw:mkJunction('all cases','next reel'),hw:1.35,lw:700,gate:true},
   {id:'jStory',draw:mkJunction('about','contact'),hw:1.35,lw:700,gate:true},
   {id:'shop0',draw:mkShop('ANTHROPIC'),hw:0.55,lw:340,gate:true},
   {id:'shop1',draw:mkShop('NVIDIA'),hw:0.55,lw:340,gate:true},
   {id:'shop2',draw:mkShop('MICROSOFT'),hw:0.55,lw:340,gate:true},
   {id:'shop3',draw:mkShop('AWS'),hw:0.55,lw:340,gate:true},
   {id:'shop4',draw:mkShop('CLAUDE'),hw:0.55,lw:340,gate:true},
   {id:'g0',draw:mkGate('DAY 00'),hw:0.80,lw:300,gate:true},
   {id:'g1',draw:mkGate('DAY 03'),hw:0.80,lw:300,gate:true},
   {id:'g2',draw:mkGate('DAY 07'),hw:0.80,lw:300,gate:true},
   {id:'g3',draw:mkGate('DAY 14'),hw:0.80,lw:300,gate:true},
   {id:'g4',draw:mkGate('DAY 21'),hw:0.80,lw:300,gate:true},
   {id:'g5',draw:mkGate('DAY 28'),hw:0.80,lw:300,gate:true}
  ];
  /* measure pass */
  var scratch=[];
  atlas.width=16;atlas.height=16; /* reset ctx state */
  for(var i=0;i<defs.length;i++){
    curLinks=[];
    ctx.setTransform(1,0,0,1,-99999,-99999); /* draw offscreen to measure */
    var h=defs[i].draw(defs[i].lw||LW);
    scratch.push({h:h,links:curLinks});
  }
  /* pack: columns (grow column count until it fits the GPU's max texture) */
  var place,need;
  for(var tryC=3;tryC<=6;tryC++){
    COLS=tryC;cellW=Math.floor(AW/COLS);cs=cellW/(isMob?640:940);
    var colY=[];for(var ci=0;ci<COLS;ci++)colY.push(0);
    var pad=8;place=[];
    for(var p=0;p<defs.length;p++){
      var hpx=Math.ceil(scratch[p].h*cs)+pad;
      var c=0;for(var cc2=1;cc2<COLS;cc2++)if(colY[cc2]<colY[c])c=cc2;
      place.push({x:c*cellW,y:colY[c],h:hpx-pad});
      colY[c]+=hpx;
    }
    need=0;for(var m2=0;m2<COLS;m2++)need=Math.max(need,colY[m2]);
    if(need<=maxT)break;
  }
  AH=Math.min(maxT,need);
  atlas.width=AW;atlas.height=AH;
  ctx.clearRect(0,0,AW,AH);
  /* draw pass */
  panels=[];
  for(var d=0;d<defs.length;d++){
    curLinks=[];
    var pl=place[d];
    var LWd=defs[d].lw||LW;
    ctx.setTransform(cs,0,0,cs,pl.x,pl.y);
    ctx.save();
    ctx.beginPath();ctx.rect(-1,-1,LWd+2,scratch[d].h+2);ctx.clip();
    if(!defs[d].gate)cellBG(LWd,scratch[d].h);
    var hh2=defs[d].draw(LWd);
    ctx.restore();
    var cellH=Math.ceil(hh2*cs);
    var cellWd=Math.ceil(LWd*cs);
    var hw=defs[d].hw;
    /* cap world size so the panel fits the view at read distance */
    var rdD=defs[d].film?1.5:READ_D;
    var capW=0.86*asp*rdD/FOCAL;
    var capH=defs[d].film?1.24:1.46;       /* fill the frame at read distance */
    if(hw>capW)hw=capW;
    if(hw*(hh2/LWd)>capH)hw=capH*LWd/hh2;
    var whh=hw*(hh2/LWd);
    panels.push({
      id:defs[d].id, gate:!!defs[d].gate, film:!!defs[d].film,
      uv:[(pl.x+1)/AW,(pl.y+1)/AH,(pl.x+cellWd-1)/AW,(pl.y+cellH-1)/AH],
      lw:LWd, lh:hh2, hw:hw, hh:whh,
      links:curLinks,
      pos:[0,0,0],U:[1,0,0],V:[0,1,0],N:[0,0,-1],alpha:0,z:0
    });
  }
  curLinks=null;
  ctx.setTransform(1,0,0,1,0,0);
  placePanels();
  uploadAtlas();
  atlasReady=true;
  /* deep link: #/product or #/product/voice */
  var hm=location.hash.match(/^#\/(\w+)(?:\/([\w-]+))?/)||[];
  var h0=hm[1];
  if(h0&&ROUTES[h0]&&h0!==curRoute)swapRoute(h0,hm[2]?anchorBeat(h0,'#'+hm[2]):null);
}
function panelById(id){for(var i=0;i<panels.length;i++)if(panels[i].id===id)return panels[i];return null;}
function orientPanel(p,vpz,yawExtra){
  var vx=pathX(vpz),vy=pathY(vpz);
  var nx=vx-p.pos[0],ny=(vy+0.0)-p.pos[1],nz=vpz-p.pos[2];
  var nl=Math.sqrt(nx*nx+ny*ny+nz*nz);nx/=nl;ny/=nl;nz/=nl;
  if(yawExtra){
    var ca=Math.cos(yawExtra),sa=Math.sin(yawExtra);
    var nx2=nx*ca+nz*sa, nz2=nz*ca-nx*sa;nx=nx2;nz=nz2;
  }
  p.N=[nx,ny,nz];
  /* U = normalize(cross(N, up0)) = (-Nz, 0, Nx) → rightward on screen */
  var ux=-nz, uz=nx;
  var ul=Math.sqrt(ux*ux+uz*uz)||1;ux/=ul;uz/=ul;
  p.U=[ux,0,uz];
  /* V = U x N? want cross(U,N) giving up-ish */
  var vx2=0*nz-uz*ny, vy2=uz*nx-ux*nz, vz2=ux*ny-0*nx;
  p.V=[vx2,vy2,vz2];
}
function placePanels(){
  /* park every panel far away; the active route claims its own */
  for(var pa2=0;pa2<panels.length;pa2++){panels[pa2].pos=[0,-99,-999];panels[pa2].z=-999;}
  for(var i=0;i<BEATS.length;i++){
    var b=BEATS[i], vpz=b.z-(b.rd||READ_D);
    var ids = b.panel==='pods' ? (isMob?['pod1']:['pod0','pod1','pod2']) : [b.panel];
    if(b.panel==='pods'&&isMob){/* mobile: only the featured pod + others reachable via product page */}
    /* billboards alternate roadside; hero/cta/footer/trust/junctions stay center */
    var center=(b.panel==='hero'||b.panel==='cta'||b.panel==='footer'||b.panel==='trust'||ids.length===3);
    var side=center?0:(i%2?1:-1);
    for(var k=0;k<ids.length;k++){
      var p=panelById(ids[k]);if(!p)continue;
      var cen2=center||p.gate||p.film;
      var lat = ids.length===3 ? (k-1)*(p.hw*2+0.28) : (cen2?0:side*(RW+0.92+p.hw*0.22));
      var lookY=b.look[3]||0, lookX=b.look[4]||0;
      var by=cen2 ? Math.max(pathY(vpz)+lookY*0.85, p.hh+0.62)
                  : p.hh+0.88;                 /* raised on a pole */
      p.pos=[pathX(b.z)+lat+lookX*1.3, by, b.z];
      p.z=b.z;
      /* face oncoming traffic (a few units before the seat) so the approach is readable */
      orientPanel(p,vpz-3.2, ids.length===3?(1-k)*0.18:0);
      p.beat=i;
      if(ids.length===1||k===1)b.tgt=p.pos; /* seat look-at target */
    }
  }
  /* mobile: pods panel = pod1 only; also place pod0/pod2 far away hidden */
  if(isMob){
    var hid=['pod0','pod2'];
    for(var h2=0;h2<2;h2++){var pp=panelById(hid[h2]);if(pp){pp.pos=[999,999,999];pp.z=-99;}}
  }
  /* branded shops line every road */
  var SHOPS=[[57,-1,0],[93,1,1],[129,-1,2],[165,1,3],[201,-1,4]];
  for(var sh2=0;sh2<SHOPS.length;sh2++){
    var spn=panelById('shop'+SHOPS[sh2][2]);if(!spn)continue;
    var sz2=SHOPS[sh2][0];
    spn.pos=[pathX(sz2)+SHOPS[sh2][1]*(RW+1.7),spn.hh+0.10,sz2];
    spn.z=sz2;
    orientPanel(spn,sz2-3.0,0);
  }
  /* day gates: home route only */
  for(var g=0;g<GATES.length;g++){
    var gp=panelById('g'+g);if(!gp)continue;
    if(curRoute!=='home')continue;
    gp.pos=[pathX(GATES[g].z),2.14,GATES[g].z];
    gp.z=GATES[g].z;
    gp.N=[0,0,-1];gp.U=[1,0,0];gp.V=[0,1,0];
    gp.beat=-1;
  }
}

/* ================= GL ================= */
var tex=null,prog=null,uni={};
function uploadAtlas(){
  if(!gl)return;
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  try{
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
  }catch(e){
    /* tainted canvas (e.g. file:// images) — rebuild once with photos disabled */
    if(!imgBlocked){
      imgBlocked=true;
      atlas=document.createElement('canvas');ctx=atlas.getContext('2d');
      buildAtlas();
    }
  }
}
var VS='attribute vec2 aP;void main(){gl_Position=vec4(aP,0.,1.);}';
var FS=[
'precision highp float;',
'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;',
'uniform float uGlitch;uniform float uVel;uniform float uReduce;',
'uniform vec3 uPos;uniform vec3 uFwd;uniform vec3 uRight;uniform vec3 uUp;uniform float uFocal;',
'uniform float uFront;uniform float uDay;uniform float uSpeed;',
'uniform vec3 uBoxMin[22];uniform vec3 uBoxMax[22];uniform float uBoxGrow[22];uniform float uBoxLit[22];',
'uniform vec3 uPanPos[5];uniform vec3 uPanU[5];uniform vec3 uPanV[5];uniform vec3 uPanN[5];',
'uniform vec2 uPanHalf[5];uniform vec4 uPanUV[5];uniform float uPanA[5];uniform float uPanFx[5];uniform float uReel;',
'uniform vec4 uHov;uniform float uHovAmt;uniform float uHovIdx;',
'uniform vec3 uBeacon;uniform float uBeaconG;uniform vec2 uBikeA;',
'uniform float uGA;uniform float uGB;',
'uniform vec3 uTokP[4];uniform float uTokA[4];',
'uniform vec3 uLamp[4];uniform float uEnd;uniform vec3 uBush[6];uniform vec3 uTint;',
'uniform sampler2D uTex;uniform float uQual;',
'const float GZ0='+GATES[0].z.toFixed(1)+';const float GZ1='+GATES[1].z.toFixed(1)+';const float GZ2='+GATES[2].z.toFixed(1)+';const float GZ3='+GATES[3].z.toFixed(1)+';const float GZ4='+GATES[4].z.toFixed(1)+';const float GZ5='+GATES[5].z.toFixed(1)+';',
'const vec3 MOOND=vec3(0.4242,0.3434,0.5556);',
'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
'float sdSeg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h2=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return length(pa-ba*h2);}',
'float vnoise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);',
' return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
'float pathX(float z){return 1.10*sin(z*0.0166667);}',
'vec3 brandMix(float t){vec3 A=vec3(0.969,0.580,0.247);vec3 B=vec3(1.0,0.416,0.239);vec3 C=vec3(1.0,0.239,0.498);',
' return t<0.5?mix(A,B,t*2.0):mix(B,C,t*2.0-1.0);}',
'float beam(vec3 O,vec3 D,vec3 base,float h){',
' vec2 od=vec2(base.x-O.x,base.z-O.z);vec2 dd=vec2(D.x,D.z);',
' float dn=dot(dd,dd);if(dn<1e-6)return 0.0;',
' float t=dot(od,dd)/dn;if(t<0.0)return 0.0;',
' vec3 p=O+D*t;float y=clamp(p.y,base.y,base.y+h);',
' float d2=(p.x-base.x)*(p.x-base.x)+(p.z-base.z)*(p.z-base.z)+(p.y-y)*(p.y-y)*0.6;',
' return exp(-d2*160.0);}',
'float pglow(vec3 O,vec3 D,vec3 P,float k){',
' vec3 o=P-O;float t=max(dot(o,D),0.0);vec3 pp=O+D*t;',
' return exp(-dot(P-pp,P-pp)*k);}',
'/* ---------- light-cycle SDF ---------- */',
'vec2 bikeMap(vec3 p){',
' /* p in bike-local space: origin at ground contact, +z forward */',
' vec2 res=vec2(1e9,0.0);',
' /* wheels: emissive torus rings around x-axis */',
' vec3 pr=p-vec3(0.0,0.185,-0.30);',
' float dw=length(vec2(length(pr.yz)-0.155,pr.x))-0.035;',
' if(dw<res.x)res=vec2(dw,1.0);',
' vec3 pf=p-vec3(0.0,0.185,0.32);',
' float df=length(vec2(length(pf.yz)-0.155,pf.x))-0.035;',
' if(df<res.x)res=vec2(df,1.0);',
' /* hubs */',
' float dh1=max(length(pr.yz)-0.095,abs(pr.x)-0.016);',
' if(dh1<res.x)res=vec2(dh1,2.0);',
' float dh2=max(length(pf.yz)-0.095,abs(pf.x)-0.016);',
' if(dh2<res.x)res=vec2(dh2,2.0);',
' /* body: flattened capsule */',
' vec3 pb=p;pb.x*=1.8;',
' vec3 a=vec3(0.0,0.235,-0.30),b2=vec3(0.0,0.285,0.28);',
' vec3 pa=pb-a,ba=b2-a;',
' float hcl=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);',
' float db=length(pa-ba*hcl)-0.088;',
' if(db<res.x)res=vec2(db,3.0);',
' /* canopy */',
' vec3 pc=(p-vec3(0.0,0.365,-0.02))/vec3(0.06,0.085,0.17);',
' float dc=(length(pc)-1.0)*0.055;',
' if(dc<res.x)res=vec2(dc,4.0);',
' return res;',
'}',
'vec3 bikeNorm(vec3 p){',
' vec2 e=vec2(0.012,0.0);',
' return normalize(vec3(bikeMap(p+e.xyy).x-bikeMap(p-e.xyy).x,',
'                       bikeMap(p+e.yxy).x-bikeMap(p-e.yxy).x,',
'                       bikeMap(p+e.yyx).x-bikeMap(p-e.yyx).x));',
'}',
'void main(){',
' vec2 fc=gl_FragCoord.xy;',
' vec2 ndc=(fc/uRes)*2.0-1.0;',
' float asp=uRes.x/uRes.y;',
' if(uGlitch>0.15&&uReduce<0.5){',
'  float seg=floor((ndc.y*0.5+0.5)*28.0);',
'  float h1=hash(vec2(seg,floor(uTime*24.0)));',
'  ndc.x+=step(1.0-0.4*uGlitch,h1)*(h1-0.5)*0.35*uGlitch;',
' }',
' vec3 O=uPos;',
' vec3 D=normalize(uFwd*uFocal+uRight*(ndc.x*asp)+uUp*ndc.y);',
' /* ---- sky ---- */',
' float dawn=uDay;',
' vec3 hazeC=mix(vec3(0.058,0.057,0.085),vec3(0.12,0.078,0.078),dawn);',
' hazeC=mix(hazeC,hazeC*0.45+uTint*0.085,0.45);',
' vec3 skyLo=mix(vec3(0.020,0.024,0.048),vec3(0.055,0.040,0.055),dawn);',
' vec3 skyHi=vec3(0.004,0.005,0.013);',
' vec3 col=mix(skyLo,skyHi,clamp(D.y*1.7+0.28,0.0,1.0));',
' float hz=clamp(1.0-abs(D.y)*3.2,0.0,1.0);',
' col+=hazeC*hz*hz*(0.5+0.25*dawn);',
' /* moon */',
' float md=dot(D,MOOND);',
' float disc=smoothstep(0.99928,0.99946,md);',
' col+=vec3(0.82,0.86,1.0)*(disc*1.05+pow(max(md,0.0),900.0)*0.55+pow(max(md,0.0),70.0)*0.10);',
' /* clouds */',
' float c1=vnoise(vec2(D.x/(0.32+abs(D.z))*2.4+uTime*0.008,D.y*8.0+3.7));',
' float c2=vnoise(vec2(D.x/(0.32+abs(D.z))*5.6-uTime*0.005,D.y*16.0));',
' float cl=smoothstep(0.42,0.78,c1*0.65+c2*0.35)*hz;',
' col=mix(col,hazeC*1.25+vec3(0.06,0.06,0.10),cl*0.5);',
' /* ---- aurora borealis: three drifting curtains with ray shimmer ---- */',
' if(D.y>0.02){',
'  float au=0.0;',
'  for(int ai=0;ai<3;ai++){',
'   float fa=float(ai);',
'   float wob=vnoise(vec2(D.x*(1.6+fa*0.9)+uTime*(0.045+fa*0.02),fa*7.7))-0.5;',
'   float base=0.24+fa*0.15+wob*0.26;',
'   float band=exp(-pow((D.y-base)*(8.5-fa*1.8),2.0));',
'   float rays=0.60+0.40*vnoise(vec2(D.x*26.0-uTime*(0.12+fa*0.05),D.y*3.0+fa*11.0));',
'   au+=band*rays*(1.0-fa*0.22);',
'  }',
'  vec3 acol=mix(vec3(0.10,0.95,0.45),vec3(0.45,0.30,1.00),clamp(D.x*0.7+0.5+0.25*sin(uTime*0.05),0.0,1.0));',
'  col+=acol*au*0.20*(1.0-cl*0.6)*smoothstep(0.02,0.12,D.y);',
' }',
' /* stars */',
' vec2 sdir=D.xy/(0.35+abs(D.z));',
' float streakF=1.0-uSpeed*0.35;',
' vec2 sp=sdir*vec2(430.0*streakF,430.0)+vec2(uTime*1.0,0.0);',
' vec2 gid=floor(sp/44.0);vec2 gf=fract(sp/44.0)-0.5;',
' float hs=hash(gid);',
' if(hs>0.84&&D.y>0.04){vec2 so=vec2(hash(gid+1.3),hash(gid+2.7))-0.5;',
'  float st=exp(-dot(gf-so*0.8,gf-so*0.8)*240.0);',
'  col+=st*(0.22+0.2*sin(uTime*(1.0+hs*3.0)+hs*40.0))*mix(vec3(1.0,0.85,0.65),vec3(1.0,0.55,0.72),hs)*(1.0-cl)*smoothstep(0.04,0.14,D.y);}',
' /* shooting stars */',
' if(uReduce<0.5&&D.y>0.06){',
'  for(int ms2=0;ms2<2;ms2++){',
'   float per=ms2==0?7.0:11.0;',
'   float off=ms2==0?0.0:4.3;',
'   float ep=floor((uTime+off)/per);',
'   float eh=hash(vec2(ep,4.7+float(ms2)));',
'   if(eh>0.5){',
'    float lt=fract((uTime+off)/per);',
'    float life=smoothstep(0.02,0.06,lt)*smoothstep(0.30,0.14,lt);',
'    if(life>0.001){',
'     vec2 s0=vec2(hash(vec2(ep,1.1))*2.4-1.2,0.45+0.5*hash(vec2(ep,2.2)));',
'     vec2 sv=normalize(vec2(mix(0.7,1.2,hash(vec2(ep,3.3))),-0.5));',
'     vec2 hpt=s0+sv*lt*2.2;',
'     vec2 a2=hpt;vec2 ab=-sv*0.30;',
'     vec2 pd2=sdir-a2;',
'     float u2=clamp(dot(pd2,ab)/dot(ab,ab),0.0,1.0);',
'     float dseg=length(pd2-ab*u2);',
'     col+=vec3(0.85,0.92,1.0)*exp(-dseg*dseg*22000.0)*life*(1.0-u2*0.75)*1.4;',
'    }',
'   }',
'  }',
' }',
' /* fireworks finale over the lit city */',
' if(uEnd>0.01&&D.y>0.02){',
'  for(int fw=0;fw<3;fw++){',
'   float per=fw==0?2.3:(fw==1?3.1:2.7);',
'   float off=float(fw)*1.13;',
'   float ep=floor((uTime+off)/per);',
'   float lt=fract((uTime+off)/per);',
'   float eh=hash(vec2(ep,7.7+float(fw)));',
'   if(eh<0.25)continue;',
'   vec2 c0=vec2((hash(vec2(ep,1.3+float(fw)))*2.0-1.0)*1.1,0.28+0.5*hash(vec2(ep,2.4)));',
'   c0.y-=lt*lt*0.22;                       /* gravity droop */',
'   float r=0.02+lt*0.24;',
'   float fade=smoothstep(0.02,0.10,lt)*smoothstep(1.0,0.45,lt);',
'   float d=length(sdir-c0);',
'   float ring=exp(-(d-r)*(d-r)*900.0);',
'   float spark=step(0.70,hash(floor((sdir-c0)*105.0)+ep))*ring;',
'   vec3 fcol=brandMix(hash(vec2(ep,9.1)));',
'   col+=fcol*(ring*0.35+spark*1.6)*fade*uEnd;',
'   col+=fcol*exp(-d*d*40.0)*0.12*fade*uEnd;  /* afterglow */',
'  }',
' }',
' /* ---- solid world ---- */',
' float bestT=1e9;int what=-1;vec3 bestN=vec3(0.0);int bestI=0;',
' if(D.y<-0.015){float tg=(0.0-O.y)/D.y;if(tg>0.0&&tg<bestT){bestT=tg;what=0;}}',
' for(int i=0;i<18;i++){',
'  vec3 bmin=uBoxMin[i];vec3 bmax=uBoxMax[i];',
'  vec3 inv=1.0/D;',
'  vec3 t0=(bmin-O)*inv;vec3 t1=(bmax-O)*inv;',
'  vec3 tn=min(t0,t1);vec3 tf=max(t0,t1);',
'  float tN=max(max(tn.x,tn.y),tn.z);',
'  float tF=min(min(tf.x,tf.y),tf.z);',
'  if(tF>=tN&&tN>0.02&&tN<bestT){bestT=tN;what=1;bestI=i;',
'   if(tn.x==tN)bestN=vec3(-sign(D.x),0.,0.);else if(tn.y==tN)bestN=vec3(0.,-sign(D.y),0.);else bestN=vec3(0.,0.,-sign(D.z));',
'  }',
' }',
' /* roadside bushes (dark moonlit blobs) */',
' vec3 bushN=vec3(0.0);',
' for(int bu=0;bu<6;bu++){',
'  vec3 B2=uBush[bu];',
'  if(B2.z<-90.0)continue;',
'  float br=fract(B2.x*7.13)*0.22+0.20;',
'  vec3 bc2=vec3(B2.x,br*0.62,B2.y);',
'  vec3 oc2=O-bc2;',
'  float qb2=dot(oc2,D);',
'  float qc2=dot(oc2,oc2)-br*br;',
'  float di2=qb2*qb2-qc2;',
'  if(di2>0.0){',
'   float tB=-qb2-sqrt(di2);',
'   if(tB>0.05&&tB<bestT){bestT=tB;what=3;bushN=normalize(O+D*tB-bc2);}',
'  }',
' }',
' /* ---- mountains on the horizon (parallax ridges) ---- */',
' if(what==-1){',
'  float dxz=max(0.10,length(D.xz));',
'  /* distant city skyline band */',
'  bool hitSky=false;',
'  {',
'   float dh0=26.0/dxz;',
'   vec3 p0=O+D*dh0;',
'   float xq=floor(p0.x*0.30);',
'   float on2=step(0.28,hash(vec2(xq,5.5)));',
'   float hB=(0.45+1.25*hash(vec2(xq,8.8)))*on2;',
'   if(p0.y<hB){',
'    vec3 sc2=vec3(0.012,0.011,0.020)*(0.8+0.3*hash(vec2(xq,3.3)));',
'    float wn=hash(vec2(floor(p0.x*2.6),floor(p0.y*3.2))+xq*7.0);',
'    sc2+=vec3(1.0,0.72,0.42)*step(0.90,wn)*0.30*(0.25+0.75*uDay);',
'    sc2+=hazeC*smoothstep(hB-0.20,hB,p0.y)*0.45;',
'    col=sc2;',
'    hitSky=true;',
'   }',
'  }',
'  if(!hitSky)for(int mi=0;mi<3;mi++){',
'   float L=mi==0?40.0:(mi==1?75.0:125.0);',
'   float amp=mi==0?2.4:(mi==1?4.0:6.2);',
'   float fr=mi==0?0.050:(mi==1?0.028:0.016);',
'   float sd2=float(mi)*17.3;',
'   float dh=L/dxz;',
'   vec3 p=O+D*dh;',
'   float n=vnoise(vec2((p.x+sd2)*fr,sd2))*0.55+vnoise(vec2(p.x*fr*2.6+sd2,sd2*1.7))*0.30+vnoise(vec2(p.x*fr*7.0,sd2*2.3))*0.15;',
'   float hM=0.3+float(mi)*0.55+amp*n;',
'   float volc=0.0;',
'   if(mi==0){',
'    volc=max(0.0,1.0-abs(p.x+19.0)/6.0);',
'    hM=max(hM,0.35+4.6*pow(volc,1.25)+0.5*volc*vnoise(vec2(p.x*1.7,3.3)));',
'   }',
'   if(p.y<hM){',
'    float far=float(mi)/2.0;',
'    vec3 ridge=mix(vec3(0.026,0.032,0.048),hazeC*1.05,far*0.80);',
'    /* moonlit slopes + crest rim */',
'    float slope=vnoise(vec2(p.x*fr*14.0,sd2));',
'    ridge+=vec3(0.10,0.11,0.16)*slope*0.25*(1.0-far*0.6);',
'    float crest=smoothstep(hM-0.35,hM,p.y);',
'    ridge+=hazeC*crest*0.8+vec3(0.24,0.27,0.36)*crest*0.30;',
'    /* volcanic rock + lava veins + crater rim fire */',
'    if(volc>0.03){',
'     float brs=0.72+0.28*sin(uTime*0.83)+0.4*smoothstep(0.72,1.0,sin(uTime*0.29+1.7));',
'     ridge=mix(ridge,vec3(0.018,0.012,0.014),volc*0.85);',
'     float vy2=max(hM-p.y,0.0);',
'     float vein=smoothstep(0.60,0.92,vnoise(vec2(p.x*4.0,p.y*2.0+uTime*0.5)));',
'     float crm=exp(-vy2*1.9)*volc;',
'     ridge+=vec3(1.0,0.34,0.09)*(crm*0.95+vein*crm*1.1)*brs;',
'     ridge+=vec3(1.0,0.50,0.15)*exp(-vy2*6.0)*volc*0.9*brs;',
'    }',
'    col=ridge;',
'    break;',
'   }',
'  }',
'  /* erupting volcano: smoke plume, embers, crater fountain (behind the city band) */',
'  if(!hitSky){',
'   float dh=40.0/dxz;',
'   vec3 p=O+D*dh;',
'   float vx=p.x+19.0;',
'   if(abs(vx)<10.0&&p.y>2.0){',
'    float brs=0.72+0.28*sin(uTime*0.83)+0.4*smoothstep(0.72,1.0,sin(uTime*0.29+1.7));',
'    float hA=p.y-4.95;',
'    if(hA>-0.6){',
'     float wq=0.5+max(hA,0.0)*0.9;',
'     float smn=vnoise(vec2(vx*0.9,p.y*0.8-uTime*0.5))*0.62+vnoise(vec2(vx*2.3+7.0,p.y*1.7-uTime*0.85))*0.38;',
'     float colm=exp(-vx*vx/(wq*wq))*smoothstep(-0.5,0.3,hA)*smoothstep(8.5,1.2,hA);',
'     float plume=colm*smoothstep(0.32,0.72,smn);',
'     vec3 smoke=mix(vec3(0.055,0.038,0.052),vec3(0.55,0.14,0.06),exp(-max(hA,0.0)*0.85)*brs);',
'     col=mix(col,smoke,clamp(plume*1.05,0.0,0.95));',
'     vec2 eg=vec2(vx*2.6,(p.y-uTime*(1.3+0.6*brs))*2.6);',
'     vec2 ef=fract(eg)-0.5;',
'     float em=step(0.972,hash(floor(eg)))*exp(-dot(ef,ef)*26.0)*colm;',
'     col+=vec3(1.0,0.45,0.14)*em*3.0*brs;',
'    }',
'    float fnt=exp(-(vx*vx*2.6+max(p.y-4.95,0.0)*max(p.y-4.95,0.0)*1.6))*brs;',
'    col+=vec3(1.0,0.42,0.12)*fnt*1.5;',
'    col+=vec3(1.0,0.30,0.08)*exp(-(vx*vx*0.18+pow(abs(p.y-4.95),2.0)*0.22))*0.18*brs;',
'   }',
'  }',
' }',
' if(what==0){',
'  vec3 g=O+D*bestT;',
'  float fog=exp(-bestT*0.042);',
'  vec3 gcol=vec3(0.0);',
'  /* natural ground: dark scrub with patchy noise */',
'  float gn=vnoise(g.xz*2.3)*0.6+vnoise(g.xz*7.1)*0.4;',
'  gcol=vec3(0.022,0.026,0.032)*(0.6+0.75*gn);',
'  gcol+=vec3(0.010,0.012,0.018)*(0.4+0.6*vnoise(g.xz*0.35));',
'  /* city pads (distant lit lots) */',
'  vec2 cell=floor(g.xz/1.4);',
'  float ch=hash(cell);',
'  if(ch>0.55&&abs(cell.x*1.4-pathX(cell.y*1.4))>1.2){',
'   vec2 cuv=fract(g.xz/1.4)-0.5;',
'   float pad=smoothstep(0.42,0.30,max(abs(cuv.x),abs(cuv.y)));',
'   float czw=cell.y*1.4;',
'   float on=smoothstep(czw,czw+4.0,uFront)*(0.25+0.75*uDay);',
'   gcol+=mix(mix(vec3(1.0,0.75,0.45),vec3(1.0,0.55,0.55),fract(ch*7.13)),uTint,0.55)*pad*on*(0.03+0.05*hash(cell+2.2)*(0.5+0.5*sin(uTime*1.5+ch*30.0)));',
'  }',
'  /* ---- the road ---- */',
'  float rd=abs(g.x-pathX(g.z));',
'  float powered=smoothstep(g.z-1.5,g.z+0.5,uFront);',
'  float road=1.0-smoothstep(0.79,0.87,rd);',
'  float streakN=vnoise(vec2(g.x*24.0,g.z*1.3));',
'  vec3 asphalt=vec3(0.021,0.022,0.027)*(0.78+0.30*vnoise(g.xz*9.0))*(0.90+0.18*streakN);',
'  asphalt*=1.0-0.14*exp(-(rd-0.42)*(rd-0.42)*60.0);',
'  asphalt*=1.0-0.10*smoothstep(0.5,0.85,rd);',
'  gcol=mix(gcol,asphalt,road*0.95);',
'  /* gravel shoulder */',
'  float shl=smoothstep(0.87,0.92,rd)*(1.0-smoothstep(1.02,1.14,rd));',
'  gcol=mix(gcol,vec3(0.030,0.026,0.038)*(0.8+0.5*vnoise(g.xz*13.0)),shl*0.85);',
'  /* contact shadows: billboards occlude the moonlight (desktop tier) */',
'  if(uQual>0.5){',
'   float sh=1.0;',
'   for(int si=0;si<5;si++){',
'    if(uPanA[si]<0.05)continue;',
'    vec3 N3=uPanN[si];',
'    float dn3=dot(MOOND,N3);',
'    if(abs(dn3)<1e-3)continue;',
'    float t3=dot(uPanPos[si]-g,N3)/dn3;',
'    if(t3<0.0||t3>14.0)continue;',
'    vec3 q3=g+MOOND*t3-uPanPos[si];',
'    vec2 pl3=vec2(dot(q3,uPanU[si]),dot(q3,uPanV[si]));',
'    float outs=max(abs(pl3.x)-uPanHalf[si].x,abs(pl3.y)-uPanHalf[si].y);',
'    float pen=0.12+t3*0.10;',
'    sh*=1.0-(1.0-smoothstep(-pen,pen,outs))*0.42*uPanA[si]*exp(-t3*0.10);',
'   }',
'   gcol*=sh;',
'  }',
'  /* painted edge lines (white) */',
'  float eL=smoothstep(0.028,0.012,abs(rd-0.80));',
'  gcol+=vec3(0.85,0.85,0.80)*eL*(0.16+0.38*powered);',
'  /* cat-eye reflectors */',
'  float rf=exp(-pow(fract(g.z*0.5)-0.5,2.0)*420.0)*exp(-(rd-0.78)*(rd-0.78)*2600.0);',
'  gcol+=vec3(1.0,0.95,0.85)*rf*(0.18+0.45*powered);',
'  /* yellow center dashes */',
'  float dash=step(fract(g.z*0.55),0.5)*smoothstep(0.020,0.008,rd);',
'  gcol+=vec3(0.90,0.68,0.22)*dash*(0.14+0.30*powered);',
'  /* street lamp pools */',
'  float lcell=floor(g.z/6.0)+0.5;',
'  float lzz=lcell*6.0;',
'  float lside=mod(lcell,2.0)<1.0?1.0:-1.0;',
'  vec2 lpg=vec2(pathX(lzz)+lside*(0.85+0.42),lzz);',
'  float lampOn=smoothstep(lzz-2.0,lzz+2.0,uFront+2.0);',
'  float pool=exp(-((g.x-lpg.x)*(g.x-lpg.x)*0.8+(g.z-lpg.y)*(g.z-lpg.y)*0.5)*1.4);',
'  gcol+=mix(vec3(1.0,0.72,0.42),uTint,0.60)*pool*0.20*lampOn;',
'  /* billboard light spill */',
'  for(int sp2=0;sp2<5;sp2++){',
'   if(uPanA[sp2]<0.05)continue;',
'   float spl=exp(-((g.x-uPanPos[sp2].x)*(g.x-uPanPos[sp2].x)*5.0+(g.z-uPanPos[sp2].z)*(g.z-uPanPos[sp2].z)*0.22)*0.9);',
'   gcol+=brandMix(0.45)*spl*0.14*uPanA[sp2]*(0.5+0.5*road);',
'  }',
'  /* bike ground effects */',
'  vec3 bikeC=vec3(1.0,0.26,0.52);',
'  float hd=exp(-((g.x-uBeacon.x)*(g.x-uBeacon.x)+(g.z-uBeacon.z-1.5)*(g.z-uBeacon.z-1.5)*0.5)*1.2)*uBeaconG;',
'  gcol+=vec3(1.0,0.9,0.75)*hd*0.24;',
'  float bsh=exp(-((g.x-uBeacon.x)*(g.x-uBeacon.x)+(g.z-uBeacon.z)*(g.z-uBeacon.z))*9.0);',
'  gcol*=1.0-bsh*0.55*uBeaconG;',
'  float inTr=step(uBeacon.z-7.5,g.z)*step(g.z,uBeacon.z-0.15);',
'  float trFade=clamp(1.0-(uBeacon.z-g.z)/7.5,0.0,1.0);',
'  gcol+=bikeC*exp(-rd*rd*900.0)*inTr*trFade*uBeaconG*0.85;',
'  /* gate ticks */',
'  float gt=0.0;',
'  gt+=exp(-(g.z-GZ0)*(g.z-GZ0)*8.0);gt+=exp(-(g.z-GZ1)*(g.z-GZ1)*8.0);',
'  gt+=exp(-(g.z-GZ2)*(g.z-GZ2)*8.0);gt+=exp(-(g.z-GZ3)*(g.z-GZ3)*8.0);',
'  gt+=exp(-(g.z-GZ4)*(g.z-GZ4)*8.0);gt+=exp(-(g.z-GZ5)*(g.z-GZ5)*8.0);',
'  gcol+=mix(vec3(1.0,0.85,0.60),uTint,0.6)*gt*exp(-rd*rd*6.0)*powered*0.22;',
'  /* wet asphalt: mirrored neon (desktop tier) */',
'  if(uQual>0.5){',
'   float fresR=pow(1.0-clamp(-D.y,0.0,1.0),3.0);',
'   float rAmt=(road*0.80+0.08)*(0.22+0.62*fresR);',
'   vec3 Dr=normalize(vec3(D.x+(vnoise(g.xz*34.0)-0.5)*0.10,-D.y,D.z+(vnoise(g.xz*27.0+9.0)-0.5)*0.05));',
'   vec3 Ro=vec3(g.x,0.001,g.z);',
'   vec3 rc=vec3(0.0);',
'   for(int ri=0;ri<5;ri++){',
'    if(uPanA[ri]<0.05)continue;',
'    vec3 N4=uPanN[ri];',
'    float dn4=dot(Dr,N4);',
'    if(abs(dn4)<1e-4)continue;',
'    float t4=dot(uPanPos[ri]-Ro,N4)/dn4;',
'    if(t4<0.05||t4>40.0)continue;',
'    vec3 hp4=Ro+Dr*t4;vec3 q4=hp4-uPanPos[ri];',
'    vec2 pl4=vec2(dot(q4,uPanU[ri]),dot(q4,uPanV[ri]));',
'    vec2 hf4=uPanHalf[ri];',
'    if(abs(pl4.x)>hf4.x||abs(pl4.y)>hf4.y)continue;',
'    vec2 l4=vec2(pl4.x/hf4.x*0.5+0.5,1.0-(pl4.y/hf4.y*0.5+0.5));',
'    vec4 uv4=uPanUV[ri];',
'    vec3 s4=texture2D(uTex,vec2(uv4.x+l4.x*(uv4.z-uv4.x),uv4.y+l4.y*(uv4.w-uv4.y))).rgb;',
'    rc+=s4*1.2*uPanA[ri]*exp(-t4*0.09);',
'   }',
'   for(int rl3=0;rl3<4;rl3++){',
'    vec3 LP3=uLamp[rl3];',
'    if(LP3.y<0.0)continue;',
'    rc+=mix(vec3(1.0,0.82,0.55),uTint,0.55)*pglow(Ro,Dr,vec3(LP3.x,1.58,LP3.z),700.0)*1.1;',
'   }',
'   rc+=vec3(1.0,0.9,0.8)*pglow(Ro,Dr,uBeacon+vec3(0.0,0.22,0.0),1800.0)*1.3*uBeaconG;',
'   gcol+=rc*rAmt;',
'  }',
'  col=mix(hazeC*0.5,gcol,fog);',
' } else if(what==3){',
'  float fog=exp(-bestT*0.05);',
'  float bn2=vnoise((O+D*bestT).xz*14.0);',
'  vec3 bcol3=vec3(0.013,0.017,0.012)*(0.65+0.5*bn2)*(0.6+0.4*bushN.y);',
'  bcol3+=vec3(0.05,0.06,0.09)*pow(1.0-abs(dot(bushN,D)),2.5)*0.7;',
'  bcol3+=vec3(0.30,0.24,0.18)*max(dot(bushN,MOOND),0.0)*0.10;',
'  col=mix(hazeC*0.5,bcol3,fog);',
' } else if(what==1){',
'  vec3 hp=O+D*bestT;',
'  float fog=exp(-bestT*0.040);',
'  vec3 bmin=vec3(0.0),bmax=vec3(0.0);float grow=0.0,lit=0.0;',
'  for(int i=0;i<18;i++){if(i==bestI){bmin=uBoxMin[i];bmax=uBoxMax[i];grow=uBoxGrow[i];lit=uBoxLit[i];}}',
'  vec3 sz=bmax-bmin;',
'  vec2 fuv;vec2 fscale;',
'  if(abs(bestN.x)>0.5){fuv=vec2((hp.z-bmin.z)/sz.z,(hp.y-bmin.y)/sz.y);fscale=vec2(sz.z,sz.y);}',
'  else if(abs(bestN.y)>0.5){fuv=vec2((hp.x-bmin.x)/sz.x,(hp.z-bmin.z)/sz.z);fscale=vec2(sz.x,sz.z);}',
'  else{fuv=vec2((hp.x-bmin.x)/sz.x,(hp.y-bmin.y)/sz.y);fscale=vec2(sz.x,sz.y);}',
'  vec2 e=min(fuv,1.0-fuv)*fscale;',
'  float edge=exp(-min(e.x,e.y)*30.0);',
'  vec3 bb=brandMix(clamp(0.5+hp.x*0.08,0.0,1.0));',
'  float faceL=abs(bestN.z)>0.5?0.85:(abs(bestN.x)>0.5?0.65:1.1);',
'  faceL*=1.0+0.35*max(dot(bestN,MOOND),0.0);',
'  vec3 bcol=vec3(0.030,0.024,0.045)*faceL*mix(0.55,1.15,fuv.y)*(0.55+0.45*grow);',
'  bcol*=0.9+0.2*vnoise(fuv*vec2(fscale.x*6.0,fscale.y*8.0));',
'  bcol+=bb*edge*(0.08+0.14*grow);',
'  if(grow<0.999){',
'   vec2 sc=fract(fuv*vec2(3.0,5.0));',
'   float scl=max(smoothstep(0.46,0.5,abs(sc.x-0.5)),smoothstep(0.46,0.5,abs(sc.y-0.5)));',
'   bcol+=bb*scl*(1.0-grow)*0.20;',
'  }',
'  if(abs(bestN.y)<0.5&&grow>0.35){',
'   vec2 wgrid=vec2(max(2.0,fscale.x*4.0),max(3.0,fscale.y*5.0));',
'   vec2 wc=floor(fuv*wgrid);',
'   float wh=hash(wc+float(bestI)*3.7);',
'   float on=step(1.0-lit,wh);',
'   vec2 wf=fract(fuv*wgrid);',
'   float win=smoothstep(0.40,0.30,max(abs(wf.x-0.5),abs(wf.y-0.52)));',
'   vec3 winC=wh>0.6?vec3(1.0,0.72,0.40):vec3(0.95,0.55,0.62);',
'   bcol+=winC*win*on*grow*(0.5+0.22*sin(uTime*1.6+wh*40.0));',
'   bcol=mix(bcol,vec3(0.012,0.010,0.022)*faceL,win*(1.0-on)*0.5*grow);',
'   if(fuv.y<0.10){bcol+=bb*(0.10-fuv.y)*4.0*lit*0.5;}',
'   if(fuv.y>0.985){bcol+=vec3(0.9,0.35,0.30)*0.35*grow;}',
'  }',
'  col=mix(hazeC*0.5,bcol,fog);',
' }',
' /* ---- pedestrians: articulated silhouettes on the sidewalks ---- */',
' for(int pw=18;pw<22;pw++){',
'  vec3 pmn=uBoxMin[pw],pmx=uBoxMax[pw];',
'  float h=pmx.y-pmn.y;',
'  if(h<0.05)continue;',
'  vec2 c=vec2((pmn.x+pmx.x)*0.5,(pmn.z+pmx.z)*0.5);',
'  vec2 nv=vec2(O.x-c.x,O.z-c.y);',
'  float nl2=length(nv);if(nl2<0.3)continue;',
'  nv/=nl2;',
'  float dn=D.x*nv.x+D.z*nv.y;',
'  if(abs(dn)<1e-4)continue;',
'  float t=((c.x-O.x)*nv.x+(c.y-O.z)*nv.y)/dn;',
'  if(t<0.4||t>bestT)continue;',
'  vec3 hp=O+D*t;',
'  float hw2=h*0.36;',
'  vec2 rt=vec2(-nv.y,nv.x);',
'  float u=((hp.x-c.x)*rt.x+(hp.z-c.y)*rt.y)/hw2;',
'  float v=(hp.y-pmn.y)/h;',
'  if(abs(u)>1.0||v<-0.02||v>1.08)continue;',
'  float cyc=c.y*17.0+float(pw)*2.1;',
'  float sw=sin(cyc);',
'  v/=(0.985+0.015*abs(cos(cyc)));',
'  float m=0.0;',
'  m=max(m,smoothstep(0.105,0.085,length(vec2((u-0.015*sw)*1.05,(v-0.90)*1.45))));',
'  float ts=sdSeg(vec2(u,v),vec2(0.0,0.78),vec2(0.0,0.44));',
'  float w1=mix(0.105,0.170,clamp((v-0.44)*2.9,0.0,1.0));',
'  m=max(m,smoothstep(w1+0.03,w1-0.02,ts));',
'  float la=sdSeg(vec2(u,v),vec2(-0.16,0.73),vec2(-0.16-0.17*sin(cyc+3.14159),0.45));',
'  float ra=sdSeg(vec2(u,v),vec2(0.16,0.73),vec2(0.16+0.15*sw,0.45));',
'  m=max(m,smoothstep(0.064,0.042,min(la,ra)));',
'  vec2 ftL=vec2(-0.07+0.22*sw,0.02+max(0.0,sw)*0.14);',
'  vec2 ftR=vec2(0.07-0.22*sw,0.02+max(0.0,-sw)*0.14);',
'  float ll=sdSeg(vec2(u,v),vec2(-0.065,0.46),ftL);',
'  float rl=sdSeg(vec2(u,v),vec2(0.065,0.46),ftR);',
'  m=max(m,smoothstep(0.075,0.050,min(ll,rl)));',
'  if(m>0.02){',
'   float fogp=exp(-t*0.05);',
'   vec3 pc=vec3(0.012,0.010,0.020);',
'   pc+=vec3(0.30,0.34,0.48)*max(dot(vec3(nv.x,0.4,nv.y),MOOND),0.0)*0.26;',
'   float rim=smoothstep(0.45,0.95,abs(u))*0.45+smoothstep(0.78,1.0,v)*0.30;',
'   pc+=mix(vec3(1.0,0.78,0.52),uTint,0.5)*rim*0.42;',
'   float ph=hash(vec2(float(pw),3.3));',
'   if(ph>0.55){float pg=exp(-length(vec2(u-0.24,v-0.50)*vec2(1.0,1.6))*7.0);pc+=vec3(0.45,0.60,1.0)*pg*0.55;}',
'   col=mix(col,mix(hazeC*0.5,pc,fogp),clamp(m,0.0,1.0)*0.96);',
'  }',
' }',
' /* ---- the light-cycle (raymarched SDF) ---- */',
' if(uBeaconG>0.01){',
'  vec3 bkC=vec3(1.0,0.26,0.52);',
'  float cy=cos(uBikeA.x),sy=sin(uBikeA.x);',
'  float cl2=cos(uBikeA.y),sl2=sin(uBikeA.y);',
'  vec3 bc=uBeacon+vec3(0.0,0.02,0.0);',
'  /* bounding sphere */',
'  vec3 bs=bc+vec3(0.0,0.24,0.0);',
'  vec3 oc=O-bs;',
'  float qb=dot(oc,D);',
'  float qc=dot(oc,oc)-0.42;',
'  float disc2=qb*qb-qc;',
'  if(disc2>0.0){',
'   float t0=-qb-sqrt(disc2);',
'   if(t0<bestT&&t0>0.02){',
'    float t=max(t0,0.02);',
'    float tEnd=min(-qb+sqrt(disc2),bestT);',
'    float mat=0.0;bool hit=false;',
'    for(int st2=0;st2<30;st2++){',
'     vec3 wp=O+D*t;',
'     vec3 lp2=wp-bc;',
'     /* world→local: un-yaw then un-lean */',
'     lp2=vec3(lp2.x*cy-lp2.z*sy,lp2.y,lp2.x*sy+lp2.z*cy);',
'     lp2=vec3(lp2.x*cl2+lp2.y*sl2,lp2.y*cl2-lp2.x*sl2,lp2.z);',
'     vec2 dm=bikeMap(lp2);',
'     if(dm.x<0.004){mat=dm.y;hit=true;break;}',
'     t+=dm.x*0.85;',
'     if(t>tEnd)break;',
'    }',
'    if(hit){',
'     vec3 wp=O+D*t;',
'     vec3 lp2=wp-bc;',
'     lp2=vec3(lp2.x*cy-lp2.z*sy,lp2.y,lp2.x*sy+lp2.z*cy);',
'     lp2=vec3(lp2.x*cl2+lp2.y*sl2,lp2.y*cl2-lp2.x*sl2,lp2.z);',
'     vec3 n=bikeNorm(lp2);',
'     float fres=pow(1.0-abs(dot(n,normalize(vec3(lp2.x,lp2.y-0.3,lp2.z-2.0)))),2.2);',
'     float fogB=exp(-t*0.04);',
'     vec3 bcol2;',
'     if(mat<1.5){bcol2=bkC*(2.3+0.5*sin(uTime*6.0));}                    /* wheel rings */',
'     else if(mat<2.5){bcol2=vec3(0.02,0.016,0.028)+bkC*0.20*fres;}      /* hubs */',
'     else if(mat<3.5){bcol2=vec3(0.016,0.013,0.024)+bkC*fres*0.9+vec3(0.05)*max(dot(n,MOOND),0.0);} /* body */',
'     else{bcol2=vec3(0.010,0.010,0.020)+bkC*fres*0.5+vec3(0.30,0.32,0.40)*pow(max(dot(reflect(D,n),MOOND),0.0),12.0);} /* canopy */',
'     col=mix(hazeC*0.5,bcol2,fogB);',
'    }',
'   }',
'  }',
'  /* headlight + trail wall */',
'  col+=vec3(1.0,0.95,0.85)*pglow(O,D,bc+vec3(sy*0.44,0.20,cy*0.44),2400.0)*2.0*uBeaconG;',
'  for(int tw=0;tw<4;tw++){',
'   float tz=uBeacon.z-0.65-float(tw)*1.5;',
'   float tf=1.0-float(tw)*0.22;',
'   col+=bkC*beam(O,D,vec3(pathX(tz),0.0,tz),0.30)*0.6*tf*uBeaconG;',
'  }',
' }',
' /* halo toward far city */',
' float al=max(dot(D,normalize(vec3(pathX(uFront+22.0),0.8,uFront+22.0)-O)),0.0);',
' col+=uTint*0.11*pow(al,18.0)*0.9;',
' /* gate beams */',
' float bm=0.0;',
' bm+=beam(O,D,vec3(pathX(uGA)-0.9,0.0,uGA),1.9)+beam(O,D,vec3(pathX(uGA)+0.9,0.0,uGA),1.9);',
' bm+=beam(O,D,vec3(pathX(uGB)-0.9,0.0,uGB),1.9)+beam(O,D,vec3(pathX(uGB)+0.9,0.0,uGB),1.9);',
' col+=mix(vec3(1.0,0.85,0.62),uTint,0.65)*bm*0.34;',
' /* street lamps */',
' for(int lm=0;lm<4;lm++){',
'  vec3 LP=uLamp[lm];',
'  if(LP.y<0.0)continue;',
'  col+=vec3(0.5,0.42,0.35)*beam(O,D,vec3(LP.x,0.0,LP.z),1.55)*0.30;',
'  col+=mix(vec3(1.0,0.82,0.55),uTint,0.55)*pglow(O,D,vec3(LP.x,1.58,LP.z),900.0)*1.5;',
'  col+=mix(vec3(1.0,0.75,0.45),uTint,0.55)*pglow(O,D,vec3(LP.x,1.58,LP.z),90.0)*0.18;',
' }',
' /* FP tokens */',
' for(int ti=0;ti<4;ti++){',
'  float an=uTokA[ti];',
'  if(an<-0.5)continue;',
'  vec3 tp=uTokP[ti];',
'  float pul=0.8+0.35*sin(uTime*4.0+tp.z*3.0);',
'  float sc=1.0+an*8.0;',
'  vec3 tc=mix(vec3(1.0,0.80,0.38),vec3(1.0,0.45,0.58),fract(tp.z*0.37));',
'  col+=tc*pglow(O,D,tp,430.0/sc)*1.7*pul*(1.0-an);',
'  col+=tc*pglow(O,D,tp,70.0/sc)*0.28*(1.0-an);',
' }',
' /* ---- holo billboards ---- */',
' for(int i=0;i<5;i++){',
'  if(uPanA[i]<0.01)continue;',
'  vec3 N=uPanN[i];',
'  float dn=dot(D,N);',
'  if(dn>-1e-4)continue;',
'  float t=dot(uPanPos[i]-O,N)/dn;',
'  if(t<0.05||t>bestT+2.5)continue;',
'  vec3 hp=O+D*t;vec3 q=hp-uPanPos[i];',
'  vec2 pl=vec2(dot(q,uPanU[i]),dot(q,uPanV[i]));',
'  vec2 hf=uPanHalf[i];',
'  if(abs(pl.x)>hf.x||abs(pl.y)>hf.y)continue;',
'  vec2 l01=vec2(pl.x/hf.x*0.5+0.5,1.0-(pl.y/hf.y*0.5+0.5));',
'  vec4 uvr=uPanUV[i];',
'  vec2 tuv=vec2(uvr.x+l01.x*(uvr.z-uvr.x),uvr.y+l01.y*(uvr.w-uvr.y));',
'  vec2 ca=vec2(uGlitch*0.0030,0.0);',
'  vec4 s;',
'  s.r=texture2D(uTex,tuv+ca).r;',
'  s.g=texture2D(uTex,tuv).g;',
'  s.b=texture2D(uTex,tuv-ca).b;',
'  s.a=texture2D(uTex,tuv).a;',
'  float aP=uPanA[i]*s.a;',
'  if(uHovAmt>0.01&&abs(uHovIdx-float(i))<0.5){',
'   vec2 hc=clamp(l01,uHov.xy,uHov.zw);',
'   float hdv=length((l01-hc)*vec2(hf.x/hf.y,1.0));',
'   float inR=(l01.x>=uHov.x&&l01.x<=uHov.z&&l01.y>=uHov.y&&l01.y<=uHov.w)?1.0:0.0;',
'   s.rgb+=brandMix(0.4)*(inR*0.28+exp(-hdv*26.0)*0.30)*uHovAmt*s.a;',
'  }',
'  float scan=0.975+0.025*sin(l01.y*uRes.y*0.7+uTime*3.0);',
'  /* screening-room projection: scroll scrubs the reel */',
'  if(uPanFx[i]>0.5){',
'   vec2 kc=(uvr.xy+uvr.zw)*0.5;',
'   float ks=1.0+0.035*sin(uTime*0.14+float(i));',
'   tuv=(tuv-kc)/ks+kc+vec2(0.004*sin(uTime*0.09),0.0);',
'   tuv.y+=step(0.985,hash(vec2(floor(uTime*1.4),2.2)))*0.006;',
'   float vis=step(l01.y,uReel);',
'   float pedge=exp(-abs(l01.y-uReel)*70.0)*step(uReel,0.998);',
'   s.rgb*=mix(0.04,1.0,vis);',
'   s.rgb+=vec3(1.0,0.95,0.85)*pedge*0.9;',
'   s.rgb*=0.93+0.07*sin(uTime*26.0+l01.y*7.0);',
'  }',
'  /* downlight wash from the top-edge fixtures */',
'  float wash=1.0+0.42*exp(-l01.y*3.2);',
'  s.rgb*=wash;',
'  float pfog=exp(-t*0.028);',
'  col=col*(1.0-aP)+s.rgb*1.45*scan*uPanA[i]*mix(0.78,1.0,pfog);',
'  vec2 rimd=hf-abs(pl);',
'  float rim=exp(-min(rimd.x,rimd.y)*90.0);',
'  col+=brandMix(clamp(l01.x,0.0,1.0))*rim*uPanA[i]*0.5;',
' }',
' /* billboard fixtures: lamps on the top edge */',
' for(int fx2=0;fx2<5;fx2++){',
'  if(uPanA[fx2]<0.08)continue;',
'  vec3 topC=uPanPos[fx2]+uPanV[fx2]*(uPanHalf[fx2].y+0.05);',
'  vec3 f1p=topC-uPanU[fx2]*uPanHalf[fx2].x*0.55;',
'  vec3 f2p=topC+uPanU[fx2]*uPanHalf[fx2].x*0.55;',
'  col+=vec3(1.0,0.85,0.6)*(pglow(O,D,f1p,1600.0)+pglow(O,D,f2p,1600.0))*1.2*uPanA[fx2];',
'  col+=vec3(1.0,0.8,0.55)*(pglow(O,D,f1p,120.0)+pglow(O,D,f2p,120.0))*0.12*uPanA[fx2];',
' }',
' /* billboard poles */',
' for(int pp2=0;pp2<5;pp2++){',
'  if(uPanA[pp2]<0.05)continue;',
'  float pb=uPanPos[pp2].y-uPanHalf[pp2].y;',
'  if(pb>1.9||pb<0.25)continue;',
'  col+=brandMix(0.5)*beam(O,D,vec3(uPanPos[pp2].x,0.0,uPanPos[pp2].z),pb)*0.45*uPanA[pp2];',
' }',
' /* ---- hyperspace: radial warp streaks at travel speed ---- */',
' float wsp=smoothstep(0.34,0.90,uSpeed)*(1.0-uReduce);',
' if(wsp>0.004){',
'  vec2 wd=ndc*vec2(asp,1.0);',
'  float wr=length(wd)+0.001;',
'  float wa=atan(wd.y,wd.x);',
'  float ws=wa*22.0;',
'  float wid=floor(ws);',
'  float wf=fract(ws)-0.5;',
'  float wh=hash(vec2(wid,5.3));',
'  float wph=fract(wr*(0.45+wh*0.7)-uTime*(2.6+wh*3.2));',
'  float dash=pow(wph,12.0)*smoothstep(0.26,0.05,abs(wf))*step(0.55,wh);',
'  float wh2=hash(vec2(wid,9.1));',
'  float wph2=fract(wr*(0.6+wh2*0.5)-uTime*(3.4+wh2*2.4)+0.5);',
'  dash+=pow(wph2,16.0)*smoothstep(0.20,0.03,abs(wf+0.21))*step(0.72,wh2)*0.6;',
'  vec3 wcol=mix(vec3(0.75,0.85,1.0),uTint,0.35);',
'  col+=wcol*dash*wsp*smoothstep(0.18,0.55,wr)*0.34;',
'  col=mix(col,col*vec3(0.93,0.97,1.10),wsp*0.14);',
' }',
' /* ---- post ---- */',
' float sl=0.955+0.045*sin(fc.y*1.256);',
' col*=sl;',
' float n=hash(fc*0.7+vec2(uTime*61.0,uTime*83.0));',
' col+=(n-0.5)*(0.028+uGlitch*0.22);',
' vec2 vuv=fc/uRes-0.5;',
' col*=1.0-0.30*dot(vuv,vuv)*1.6;',
' col*=1.07;',
' vec3 tmc=(col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);',
' col=mix(col,clamp(tmc,vec3(0.0),vec3(1.0)),0.80);',
' float lum=dot(col,vec3(0.299,0.587,0.114));',
' col=mix(vec3(lum),col,1.10);',
' gl_FragColor=vec4(col,1.0);',
'}'
].join('\n');

function mkShader(t,src){
  var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(s));return null;}
  return s;
}
function initGL(){
  var vs=mkShader(gl.VERTEX_SHADER,VS),fs=mkShader(gl.FRAGMENT_SHADER,FS);
  if(!vs||!fs){var fb=document.getElementById('fallback');if(fb)fb.style.display='block';return false;}
  prog=gl.createProgram();
  gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(prog));return false;}
  gl.useProgram(prog);
  var buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var aP=gl.getAttribLocation(prog,'aP');
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP,2,gl.FLOAT,false,0,0);
  ['uRes','uTime','uMouse','uGlitch','uVel','uReduce','uPos','uFwd','uRight','uUp','uFocal',
   'uFront','uDay','uSpeed','uBoxMin','uBoxMax','uBoxGrow','uBoxLit',
   'uPanPos','uPanU','uPanV','uPanN','uPanHalf','uPanUV','uPanA',
   'uHov','uHovAmt','uHovIdx','uBeacon','uBeaconG','uBikeA','uGA','uGB','uTokP','uTokA','uLamp','uEnd','uBush','uPanFx','uReel','uTint','uTex','uQual']
   .forEach(function(n){uni[n]=gl.getUniformLocation(prog,n);});
  tex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.uniform1i(uni.uTex,0);
  return true;
}

/* ================= SCROLL / CAMERA ================= */
var spacerScroll=1;
function resize(){
  W=window.innerWidth;H=window.innerHeight;
  dpr=clamp(window.devicePixelRatio||1,1,isMob?1.75:2);
  var wasMob=isMob;
  isMob=W<720;
  asp=W/H;
  glc.width=Math.round(W*dpr);glc.height=Math.round(H*dpr);
  spacerScroll=Math.round(NB*H*2.45);
  document.getElementById('spacer').style.height=(H+spacerScroll)+'px';
  if(hint)hint.innerHTML=isMob?'Scroll to ride · tap a board to read <span class="arr">▼</span>'
    :'Scroll or ↑ ↓ arrows to ride · hover a board to read · collect FP <span class="arr">▼</span>';
  if(gl)gl.viewport(0,0,glc.width,glc.height);
  if(T3)T3.resize();
  if(fontsReady&&imgsSettled&&(!atlasReady||wasMob!==isMob))buildAtlas();
  else if(atlasReady)placePanels();
}
function camAt(J){
  var f=clamp(J,0,1)*NB, k=Math.min(NB-1,Math.floor(f)), u=f-k;
  var rdK=BEATS[k].rd||READ_D;
  var zPrev=k===0?BEATS[0].z-rdK:BEATS[k-1].z-(BEATS[k-1].rd||READ_D);
  var zCur=BEATS[k].z-rdK;
  var tu,z;
  if(k===0){tu=1;z=zCur;}                     /* seated at the brief from load */
  else{
    /* continuous motion: smootherstep slows near panels but never stops —
       no scroll dead-zones, no lurch */
    tu=u;
    var smz=smoother(u);
    z=zPrev+(zCur-zPrev)*(u*0.38+smz*0.62);
  }
  /* look offsets interpolate prev→cur with tu */
  var lp=k===0?BEATS[0].look:BEATS[k-1].look, lc=BEATS[k].look;
  var lo=[];
  for(var i=0;i<5;i++)lo.push(lerp(lp[i],lc[i],tu));
  return {k:k,u:u,tu:tu,z:z,lo:lo};
}
function dayAt(st){
  var dc=BEATS[st.k].day;if(dc===undefined)dc=null;
  var dp=null;
  for(var i=st.k-1;i>=0;i--){if(BEATS[i].day!==null){dp=BEATS[i].day;break;}}
  if(dc===null){
    if(st.k>=11)return 29; /* past handoff → ongoing */
    if(dp===null)return -1; /* brief */
    return dp;
  }
  if(dp===null)dp=0;
  return Math.round(lerp(dp,dc,st.tu));
}

/* ================= INPUT / HIT ================= */
function rayFromScreen(cssX,cssY){
  var nx=(cssX/W)*2-1, ny=1-(cssY/H)*2;
  var dx=cam.fwd[0]*focalCur+cam.right[0]*nx*asp+cam.up[0]*ny;
  var dy=cam.fwd[1]*focalCur+cam.right[1]*nx*asp+cam.up[1]*ny;
  var dz=cam.fwd[2]*focalCur+cam.right[2]*nx*asp+cam.up[2]*ny;
  var l=Math.sqrt(dx*dx+dy*dy+dz*dz);
  return [dx/l,dy/l,dz/l];
}
/* fat-finger slop: generous on touch screens, tight with a mouse */
var HIT_SLOP=(window.matchMedia&&matchMedia('(pointer: coarse)').matches)?22:6;
/* graphics tier: reflections + contact shadows on fine-pointer (desktop) only */
var GFXQ=(window.matchMedia&&matchMedia('(pointer: coarse)').matches)?0.0:1.0;
function hitTest(cssX,cssY){
  if(!atlasReady)return null;
  var D=rayFromScreen(cssX,cssY);
  var best=null,bt=1e9,bd=1e9;
  for(var a=0;a<activeIdx.length;a++){
    var p=panels[activeIdx[a]];
    if(p.alpha<0.35||p.gate||!p.links.length)continue;
    var dn=D[0]*p.N[0]+D[1]*p.N[1]+D[2]*p.N[2];
    if(dn>-1e-5)continue;
    var t=((p.pos[0]-cam.pos[0])*p.N[0]+(p.pos[1]-cam.pos[1])*p.N[1]+(p.pos[2]-cam.pos[2])*p.N[2])/dn;
    if(t<0.05||t>bt)continue;
    var hx=cam.pos[0]+D[0]*t-p.pos[0],hy=cam.pos[1]+D[1]*t-p.pos[1],hz=cam.pos[2]+D[2]*t-p.pos[2];
    var plx=hx*p.U[0]+hy*p.U[1]+hz*p.U[2];
    var ply=hx*p.V[0]+hy*p.V[1]+hz*p.V[2];
    if(Math.abs(plx)>p.hw||Math.abs(ply)>p.hh)continue;
    var lx=(plx/p.hw*0.5+0.5)*p.lw;
    var ly=(1-(ply/p.hh*0.5+0.5))*p.lh;
    for(var li=0;li<p.links.length;li++){
      var L=p.links[li];
      if(lx>=L.x-HIT_SLOP&&lx<=L.x+L.w+HIT_SLOP&&ly>=L.y-HIT_SLOP&&ly<=L.y+L.h+HIT_SLOP){
        /* overlapping slopped rects: prefer the link whose center is closest */
        var d9=Math.abs(lx-(L.x+L.w/2))/Math.max(1,L.w)+Math.abs(ly-(L.y+L.h/2))/Math.max(1,L.h);
        if(t<bt-1e-4||(Math.abs(t-bt)<=1e-4&&d9<bd)){
          best={p:activeIdx[a],l:li,t:t};bt=t;bd=d9;
        }
      }
    }
  }
  return best;
}
/* which content board (not gate/shop) is under the cursor — for the read-zoom */
var hovBoard=-1,zoomA=0,zoomP=null,tapZoomIdx=-1,lastUserScroll=-9999;
window.addEventListener('wheel',function(){lastUserScroll=performance.now();},{passive:true});
window.addEventListener('touchmove',function(){lastUserScroll=performance.now();},{passive:true});
window.addEventListener('scroll',function(){lastUserScroll=performance.now();tapZoomIdx=-1;},{passive:true});
function boardAt(cssX,cssY){
  if(!atlasReady)return -1;
  var D=rayFromScreen(cssX,cssY);
  var best=-1,bt=1e9;
  for(var a=0;a<activeIdx.length;a++){
    var p=panels[activeIdx[a]];
    if(p.gate||p.alpha<0.5)continue;
    var dn=D[0]*p.N[0]+D[1]*p.N[1]+D[2]*p.N[2];
    if(dn>-1e-5)continue;
    var t=((p.pos[0]-cam.pos[0])*p.N[0]+(p.pos[1]-cam.pos[1])*p.N[1]+(p.pos[2]-cam.pos[2])*p.N[2])/dn;
    if(t<0.05||t>bt)continue;
    var hx=cam.pos[0]+D[0]*t-p.pos[0],hy=cam.pos[1]+D[1]*t-p.pos[1],hz=cam.pos[2]+D[2]*t-p.pos[2];
    var plx=hx*p.U[0]+hy*p.U[1]+hz*p.U[2];
    var ply=hx*p.V[0]+hy*p.V[1]+hz*p.V[2];
    if(Math.abs(plx)>p.hw||Math.abs(ply)>p.hh)continue;
    best=activeIdx[a];bt=t;
  }
  return best;
}
var hitlink=document.getElementById('hitlink');
var lastCX=-1,lastCY=-1;
function updateHover(){
  if(navLock||lastCX<0)return;
  hovBoard=boardAt(lastCX,lastCY);
  var h=hitTest(lastCX,lastCY);
  if(h){
    hovP=h.p;hovL=h.l;
    var L=panels[h.p].links[h.l];
    hitlink.href=L.href;hitlink.title=L.label;
    if(/^https?:/i.test(L.href)){hitlink.target='_blank';hitlink.rel='noopener';}
    else{hitlink.target='';hitlink.rel='';}
    hitlink.style.left=(lastCX-30)+'px';
    hitlink.style.top=(lastCY-30)+'px';
    hitlink.style.width='60px';hitlink.style.height='60px';
    hitlink.style.display='block';
    glc.style.cursor='pointer';
  }else{
    hovP=-1;hovL=-1;
    hitlink.style.display='none';
    glc.style.cursor='default';
  }
}
window.addEventListener('mousemove',function(e){
  mouseX=e.clientX/Math.max(1,W);mouseY=e.clientY/Math.max(1,H);
  lastCX=e.clientX;lastCY=e.clientY;
  updateHover();
});
var VIRTUAL={case1:1,case2:1,case3:1,case4:1,case5:1,case6:1,case7:1,story:1};
hitlink.addEventListener('click',function(e){
  var href=this.getAttribute('href');
  var r=routeOf(href);
  if(r){var ab=anchorBeat(r,href);
    if(r!==curRoute||ab!=null){e.preventDefault();routeTo(r,1,undefined,ab);return;}
  }
  if(r&&VIRTUAL[r]){e.preventDefault();return;}
  navLock=true;glitch=1.0;setTimeout(function(){navLock=false;},600);
});
(function(){
  var as=document.querySelectorAll('#hud-tr a');
  for(var i=0;i<as.length;i++){
    as[i].addEventListener('click',function(e){
      var href=this.getAttribute('href');
      var r=routeOf(href);
      if(r&&r!==curRoute){e.preventDefault();routeTo(r,1,undefined,anchorBeat(r,href));}
    });
  }
})();
/* screen-space aim assist: fat fingers get a probe pattern, mice stay precise */
function tapHit(cx,cy,fromTouch){
  var h=hitTest(cx,cy);
  if(h||!fromTouch)return h;
  var pr=[[0,-10],[0,10],[-10,0],[10,0],[0,-20],[0,20],[-18,0],[18,0],[0,-28]];
  for(var i=0;i<pr.length&&!h;i++)h=hitTest(cx+pr[i][0],cy+pr[i][1]);
  return h;
}
function handleTap(cx,cy,fromTouch){
  if(navLock)return;
  var h=tapHit(cx,cy,fromTouch);
  var e={clientX:cx,clientY:cy};
  if(!h){
    var isTap=fromTouch||Date.now()-lastTouch<700;
    if(isTap){
      var nx3=e.clientX/W;
      /* edge taps always steer/advance — even over a board */
      if(nx3>0.82||nx3<0.18){
        tapZoomIdx=-1;
        if(curBeat===NB-1){
          if(nx3>0.82)routeTo(ROUTES[curRoute].R,1);
          else routeTo(ROUTES[curRoute].L,-1);
        }
        else if(nx3>0.82)goBeat(1);
        else goBeat(-1);
        return;
      }
      /* center tap on a board → read-zoom toggle */
      var hb2=boardAt(e.clientX,e.clientY);
      if(hb2>=0){
        if(tapZoomIdx===hb2&&zoomA>0.4)tapZoomIdx=-1;
        else tapZoomIdx=hb2;
        return;
      }
      /* zoomed? tap out first */
      if(zoomA>0.25&&tapZoomIdx>=0){tapZoomIdx=-1;return;}
      /* empty center tap rides forward; at the junction it steers by half */
      if(curBeat===NB-1){
        if(e.clientX>W*0.5)routeTo(ROUTES[curRoute].R,1);
        else routeTo(ROUTES[curRoute].L,-1);
      }
      else goBeat(1);
    }
    return;
  }
  tapZoomIdx=-1;
  var href2=panels[h.p].links[h.l].href;
  var r2=routeOf(href2);
  if(r2){var ab2=anchorBeat(r2,href2);
    if(r2!==curRoute||ab2!=null){routeTo(r2,1,undefined,ab2);return;}
  }
  if(r2&&VIRTUAL[r2])return;
  var a=document.createElement('a');
  a.href=href2;a.style.display='none';
  if(/^https?:/i.test(href2)){a.target='_blank';a.rel='noopener';}
  document.body.appendChild(a);a.click();a.remove();
  navLock=true;glitch=1.0;setTimeout(function(){navLock=false;},600);
}
var tapHandled=false;
glc.addEventListener('click',function(e){
  if(tapHandled){tapHandled=false;return;}
  handleTap(e.clientX,e.clientY,false);
});
/* touch taps fire from touchend directly — momentum scroll swallows click events */
var tSX=0,tSY=0,tST=0;
glc.addEventListener('touchstart',function(e){
  var t=e.changedTouches[0];tSX=t.clientX;tSY=t.clientY;tST=Date.now();
},{passive:true});
glc.addEventListener('touchend',function(e){
  lastTouch=Date.now();initGyro();
  var t=e.changedTouches[0];
  if(Math.abs(t.clientX-tSX)<12&&Math.abs(t.clientY-tSY)<12&&Date.now()-tST<600){
    tapHandled=true;
    if(e.cancelable)e.preventDefault();
    handleTap(t.clientX,t.clientY,true);
  }
},{passive:false});

/* ================= FP TOKENS (gamified journey) ================= */
var TOKENS=[],FP=0,FPmax=0;
var FACTS=[
 'Pods ship inside your repo — never from a deck.',
 'Median time to first production deploy: 14 days.',
 'Every pod is 100% senior. Zero juniors, ever.',
 '92% of clients extend or re-engage.',
 'Fixed scope, fixed price — no open-ended retainers.',
 'Weekly demos. You see velocity, not status reports.',
 'Evals baked in from the first prototype.',
 'We run the last mile: latency, cost, guardrails.',
 'Docs + pairing from day one — the knowledge stays.',
 'Your standup, your Slack, our keyboards.',
 'Average velocity lift after embed: +40%.',
 'Strike, Pod, or Platform — three shapes, one senior bar.',
 'When the pod leaves, the muscle memory stays.'
];
var GATEFACTS={0:'DAY 0 — one question: what’s stuck?',
 3:'DAY 3 — first commits land inside the first week.',
 7:'DAY 7 — evals armed, pipelines humming.',
 14:'DAY 14 — median first production deploy. Watch the tower.',
 21:'DAY 21 — weekly release cadence, locked.',
 28:'DAY 28 — handoff. It runs without us.'};
function buildTokens(){
  if(TOKENS.length)return;
  var HB=ROUTES.home.beats, HNB=HB.length; /* tokens live on the home road only */
  var fi=0;
  for(var i=0;i<HNB-1;i++){
    for(var q=0;q<2;q++){
      var z=HB[i].z+(HB[i+1].z-HB[i].z)*(q?0.68:0.34);
      TOKENS.push({z:z,x:pathX(z)+Math.sin(z*3.1)*0.30,y:0.52,
                   val:10,fact:FACTS[fi++%FACTS.length],st:0,an:0});
    }
  }
  for(var g=0;g<GATES.length;g++){
    TOKENS.push({z:GATES[g].z-0.02,x:pathX(GATES[g].z),y:1.42,
                 val:25,fact:GATEFACTS[GATES[g].d]||'',st:0,an:0});
  }
  TOKENS.sort(function(a,b){return a.z-b.z;});
  FPmax=0;for(var t=0;t<TOKENS.length;t++)FPmax+=TOKENS[t].val;
  updFP(false);
}
var fpEl=document.getElementById('fp'),toastEl=document.getElementById('toast'),toastT=null;
function updFP(pop){
  if(!fpEl)return;
  var s=String(FP);while(s.length<3)s='0'+s;
  fpEl.textContent='FP '+s;
  if(pop){fpEl.classList.remove('fp-pop');void fpEl.offsetWidth;fpEl.classList.add('fp-pop');}
}
function showToast(msg){
  if(!toastEl)return;
  toastEl.textContent=msg;
  toastEl.classList.add('show');
  if(toastT)clearTimeout(toastT);
  toastT=setTimeout(function(){toastEl.classList.remove('show');},2600);
}
function collectPass(dt){
  for(var i=0;i<TOKENS.length;i++){
    var t=TOKENS[i];
    if(!t.st&&camZ>t.z-0.30&&camZ<t.z+6.5){
      t.st=1;FP+=t.val;updFP(true);
      showToast('+'+t.val+' FP — '+t.fact);
      glitch=Math.max(glitch,0.10);
      if(FP>=FPmax)setTimeout(function(){showToast('ALL '+FPmax+' FP COLLECTED — YOU KNOW US NOW. BOOK THE CALL.');},2800);
    }
    if(t.st&&t.an<1)t.an=Math.min(1,t.an+dt/380);
  }
}

/* ================= BEAT NAV: keys / taps ================= */
function swapRoute(name,beat){
  curRoute=name;
  BEATS=ROUTES[name].beats;
  NB=BEATS.length;
  spacerScroll=Math.round(NB*H*2.45);
  document.getElementById('spacer').style.height=(H+spacerScroll)+'px';
  placePanels();
  window.scrollTo(0,0);
  swapLock=420;                 /* pin the road start while the browser settles */
  Jt=0;Js=0;var c0=camAt(0);camZ=prevZ=c0.z;
  curBeat=-1;curDay=-999;
  hovBoard=-1;tapZoomIdx=-1;zoomA=0;zoomP=null;
  pendingBeat=(beat!=null&&beat>0)?beat:null;
  var bid=pendingBeat!=null?BEATS[pendingBeat]:null;
  if(name!=='home')showToast(pendingBeat!=null?('RIDING TO: '+bid.phase+' — '+ROUTES[name].label+' ROAD'):('NOW RIDING: '+ROUTES[name].label+' ROAD'));
  if(T3)T3.route(name);
  var css=ROUTES[name].css;
  if(css){
    var rt=document.documentElement.style;
    rt.setProperty('--a',css[0]);rt.setProperty('--b',css[1]);rt.setProperty('--c',css[2]);
    /* re-tint the whole HUD to the road's palette */
    var pr=[parseInt(css[0].slice(1,3),16),parseInt(css[0].slice(3,5),16),parseInt(css[0].slice(5,7),16)];
    var mix=function(k){return Math.round(pr[0]+(255-pr[0])*k)+','+Math.round(pr[1]+(255-pr[1])*k)+','+Math.round(pr[2]+(255-pr[2])*k);};
    rt.setProperty('--hud','rgba('+mix(0.42)+',.85)');
    rt.setProperty('--hud-dim','rgba('+mix(0.42)+',.42)');
    rt.setProperty('--hud-ink','rgb('+mix(0.62)+')');
  }
  /* color flash: unmistakable 'new road' feedback */
  if(booted){
    var fl=document.getElementById('rflash');
    if(fl){fl.classList.remove('on');void fl.offsetWidth;fl.classList.add('on');}
  }
}
function routeTo(name,dir,push,beat){
  if(!ROUTES[name]||trans)return;
  if(name===curRoute){
    /* same road: just ride to the anchored beat */
    if(beat!=null){var tb0=clamp(beat,0,NB-1);window.scrollTo(0,Math.round(spacerScroll*((tb0+0.985)/NB)));}
    return;
  }
  trans={t0:performance.now(),dir:dir||1,to:name,toBeat:beat,swapped:false};
  if(push!==false){try{
    var bid2=(beat!=null&&ROUTES[name].beats[beat]&&ROUTES[name].beats[beat].id)?'/'+ROUTES[name].beats[beat].id:'';
    history.pushState({r:name},'','#/'+name+bid2);
  }catch(e){}}
}
window.addEventListener('popstate',function(){
  var m=location.hash.match(/^#\/(\w+)(?:\/([\w-]+))?/)||[];
  var r=m[1]||'home';
  if(ROUTES[r]&&r!==curRoute){
    trans=null;
    swapRoute(r,m[2]?anchorBeat(r,'#'+m[2]):null);
    glitch=Math.max(glitch,0.6);
  }
});
function goBeat(dir){
  var f=clamp(Jt,0,1)*NB, k=Math.floor(f), u=f-k;
  var t;
  if(dir>0){
    /* mid-travel → finish arriving at this beat; seated → next beat */
    t=(k===0||u>=0.90)?k+1:k;
  }else{
    t=k-1;
  }
  t=clamp(t,0,NB-1);
  window.scrollTo(0,Math.round(spacerScroll*((t+0.985)/NB)));
}
window.addEventListener('keydown',function(e){
  /* at a junction, ←/→ steer onto the branch roads */
  var atJ=(curBeat===NB-1);
  if(atJ&&e.key==='ArrowLeft'){e.preventDefault();routeTo(ROUTES[curRoute].L,-1);return;}
  if(atJ&&e.key==='ArrowRight'){e.preventDefault();routeTo(ROUTES[curRoute].R,1);return;}
  /* driving controls: ↑/→ ride forward, ↓/← back */
  if(e.key==='ArrowUp'||e.key==='ArrowRight'||e.key==='PageUp'){e.preventDefault();goBeat(1);}
  else if(e.key==='ArrowDown'||e.key==='ArrowLeft'||e.key==='PageDown'){e.preventDefault();goBeat(-1);}
});

/* ================= GYRO (mobile look) ================= */
var gyroInit=false,lastTouch=0;
function initGyro(){
  if(gyroInit)return;gyroInit=true;
  function attach(){
    window.addEventListener('deviceorientation',function(ev){
      if(ev.gamma==null)return;
      mouseX=clamp(0.5+ev.gamma/60,0,1);
      mouseY=clamp(0.5+(ev.beta-45)/70,0,1);
    });
  }
  try{
    if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){
      DeviceOrientationEvent.requestPermission().then(function(r){if(r==='granted')attach();}).catch(function(){});
    }else attach();
  }catch(err){}
}

/* ================= BOOT (DOM) ================= */
var bootEl=document.getElementById('boot');
var BOOTLINES=[
 'JINACODE MISSION CONTROL v5.2',
 'PARSING BRIEF ............... OK',
 'HARD PART LOCATED ........... OK',
 'POD ASSIGNED: SENIOR ×2 ..... OK',
 'REPO KEYS / EVALS ARMED ..... OK',
 'SCHEDULE: 28 DAYS ........... LOCKED',
 'LIGHT-CYCLE IGNITION ........ ON',
 'T-MINUS — SCROLL TO RIDE'
];
var bootT0=performance.now(),BOOT=2300;
function bootTick(t){
  if(booted)return;
  var el=t-bootT0;
  if(el>=BOOT||window.scrollY>10){
    booted=true;
    if(bootEl){bootEl.style.opacity='0';setTimeout(function(){bootEl.style.display='none';},600);}
    glitch=Math.max(glitch,0.8);
    return;
  }
  if(bootEl){
    var chars=Math.floor(el/8),out='';
    for(var i=0;i<BOOTLINES.length&&chars>0;i++){
      var ln=BOOTLINES[i];
      out+=ln.substr(0,Math.min(ln.length,chars))+'\n';
      chars-=ln.length+12;
    }
    var pre=bootEl.querySelector('pre');
    if(pre)pre.textContent=out+(Math.floor(t/240)%2===0?'▮':' ');
    var bar=bootEl.querySelector('.bbar i');
    if(bar)bar.style.width=(clamp(el/(BOOT-250),0,1)*100)+'%';
  }
}

/* ================= HUD ================= */
var osdCh=document.getElementById('osd-ch'),osdName=document.getElementById('osd-name');
var progFill=document.getElementById('prog-fill'),hint=document.getElementById('hint');
function updHUD(st){
  if(curRoute!=='home'){
    var lb=ROUTES[curRoute].label;
    if(osdCh.textContent!==lb){osdCh.textContent=lb;curDay=-999;}
  }else{
  var d=dayAt(st);
  var txt = d<0?'T–0' : d>28?'ONGOING' : 'DAY '+(d<10?'0':'')+d+' / 28';
  if(osdCh.textContent!==txt){
    var big=(d!==curDay&&(d===0||d===3||d===7||d===14||d===21||d===28));
    curDay=d;
    osdCh.textContent=txt;
    if(big&&booted&&!reduce){
      glitch=Math.max(glitch,0.30);
      osdCh.classList.remove('osd-flash');void osdCh.offsetWidth;osdCh.classList.add('osd-flash');
    }
  }
  }
  var effK=Math.min(NB-1,st.tu>0.5?st.k:Math.max(0,st.k-1)); /* clamped: routes can shrink mid-swap */
  if(effK!==curBeat){
    curBeat=effK;
    osdName.textContent=BEATS[effK].phase;
    osdName.classList.remove('osd-flash');void osdName.offsetWidth;osdName.classList.add('osd-flash');
    var fp5=panelById(BEATS[effK].panel);
    if(fp5&&fp5.film){reelT0=performance.now();showToast('▶ NOW PLAYING — SCROLL TO SCRUB');}
    if(effK===NB-1)showToast('STEER:  ← '+ROUTES[curRoute].L.toUpperCase()+'   ·   '+ROUTES[curRoute].R.toUpperCase()+' →');
  }
  progFill.style.transform='scaleX('+clamp(Js,0,1)+')';
  hint.style.opacity=(window.scrollY||0)>60?0:1;
}

/* ================= FRAME ================= */
var lastT=performance.now();
var f3=new Float32Array(3*NBOX),f3b=new Float32Array(3*NBOX),f1=new Float32Array(NBOX),f1b=new Float32Array(NBOX);
var pPos=new Float32Array(15),pU=new Float32Array(15),pV=new Float32Array(15),pN=new Float32Array(15),
    pHalf=new Float32Array(10),pUV=new Float32Array(20),pA=new Float32Array(5);
var tokP=new Float32Array(12),tokA=new Float32Array(4),lampP=new Float32Array(12),bushP=new Float32Array(18),pFx=new Float32Array(5);
function frame(tms){
  requestAnimationFrame(frame);
  if(!gl||!prog)return;
  var dt=Math.min(50,tms-lastT);lastT=tms;
  bootTick(tms);
  /* scroll → journey */
  if(swapLock>0){window.scrollTo(0,0);swapLock-=dt;Jt=0;}
  else{
    if(pendingBeat!=null){
      /* anchored arrival: drop in half a beat short, glide onto the board */
      var tb=clamp(pendingBeat,0,NB-1);
      window.scrollTo(0,Math.round(spacerScroll*((tb+0.985)/NB)));
      Js=Math.max(0,(tb+0.42)/NB);
      pendingBeat=null;
    }
    Jt=clamp((window.scrollY||0)/Math.max(1,spacerScroll),0,1);
  }
  var k=reduce?1:clamp(dt*0.0046,0,1);
  Js+=(Jt-Js)*k;
  if(Math.abs(Jt-Js)<0.00004)Js=Jt;
  var st=camAt(Js);
  camZ=st.z;
  var dz=camZ-prevZ;prevZ=camZ;
  speed+=(clamp(Math.abs(dz)*18,0,1)-speed)*0.10;
  svz+=(dz-svz)*0.07;
  vel+=(clamp(Math.abs(dz)*10,0,1)-vel)*0.12;
  glitch*=Math.pow(0.88,dt/16.6);
  if(!reduce&&booted&&tms-lastAmb>10000){lastAmb=tms;glitch=Math.max(glitch,0.09);}
  msX+=(mouseX-msX)*0.07;msY+=(mouseY-msY)*0.07;
  /* camera */
  var e2=0.6;
  var dx=(pathX(camZ+e2)-pathX(camZ-e2))/(2*e2);
  var dy=(pathY(camZ+e2)-pathY(camZ-e2))/(2*e2);
  var yaw=Math.atan2(dx,1)+st.lo[0]+(msX-0.5)*0.10;
  var pitch=Math.atan2(dy,1)*0.5+st.lo[1]+(0.5-msY)*0.06+clamp(-svz*0.8,-0.035,0.035)*(reduce?0:1);
  var roll=(reduce?0:-dx*1.15)+st.lo[2]+(msX-0.5)*0.02;
  var bob=reduce?0:Math.sin(tms*0.0009)*0.006;
  cam.pos=[pathX(camZ)+st.lo[4],pathY(camZ)+st.lo[3]+bob,camZ];
  /* ease into a level look-at on arrival, ease off it on departure */
  var wArr=st.k===0?1:sstep(0.68,0.94,st.tu);
  var wDep=st.k>0?sstep(0.30,0.06,st.tu):0;
  var tgt=wArr>0?BEATS[st.k].tgt:(wDep>0?BEATS[st.k-1].tgt:null);
  var seatW=Math.max(wArr,wDep);
  if(seatW>0&&tgt){
    var tdx=tgt[0]-cam.pos[0],tdy=tgt[1]-cam.pos[1],tdz=tgt[2]-cam.pos[2];
    var hz=Math.sqrt(tdx*tdx+tdz*tdz)||1;
    var yawT=Math.atan2(tdx,tdz)+(msX-0.5)*0.10;
    var pitchT=Math.atan2(tdy,hz)+(0.5-msY)*0.06;
    yaw=lerp(yaw,yawT,seatW);
    pitch=lerp(pitch,pitchT,seatW);
    roll*=(1-seatW*0.92);
  }
  /* junction turn: bank onto the new road, swap mid-glitch */
  if(trans){
    var tp2=(tms-trans.t0)/1100;
    if(tp2>=1){trans=null;}
    else{
      var bell=Math.sin(Math.PI*clamp(tp2,0,1));
      yaw+=trans.dir*0.55*bell;
      roll-=trans.dir*0.30*bell;
      glitch=Math.max(glitch,bell*0.75);
      if(tp2>=0.5&&!trans.swapped){trans.swapped=true;swapRoute(trans.to,trans.toBeat);}
    }
  }
  /* ---- read-zoom: hover (desktop) or tap (touch) dollies the camera in;
          any user scroll releases it immediately so the ride never fights the wheel ---- */
  if(tapZoomIdx>=0&&(!panels[tapZoomIdx]||panels[tapZoomIdx].alpha<=0.3))tapZoomIdx=-1;
  var scrolledNow=(tms-lastUserScroll)<650;
  var zTapOK=(tapZoomIdx>=0&&panels[tapZoomIdx].alpha>0.45);
  var zHovOK=(hovBoard>=0&&!scrolledNow&&panels[hovBoard]&&panels[hovBoard].alpha>0.45);
  var zWant=(!trans&&booted&&swapLock<=0)&&(zTapOK||zHovOK);
  if(zWant)zoomP=panels[zTapOK?tapZoomIdx:hovBoard];
  else if(zoomP&&zoomP.alpha<=0.3)zWant=false;
  zoomA+=((zWant?1:0)-zoomA)*clamp(dt*(zWant?0.005:0.0038),0,1);
  if(zoomA<0.004){zoomA=0;if(!zWant)zoomP=null;}
  if(zoomA>0&&zoomP){
    var zp=zoomP;
    /* distance where the board fills the view, with a little margin */
    var zd=clamp(Math.max(zp.hh*1.18,zp.hw*1.24/asp)*FOCAL,0.85,3.4);
    if(zp.film)zd=Math.min(zd,1.35); /* reels: nudge in, they already fill the frame */
    var zw=smoother(zoomA)*0.9;
    cam.pos=[lerp(cam.pos[0],zp.pos[0]+zp.N[0]*zd,zw),
             lerp(cam.pos[1],zp.pos[1]+zp.N[1]*zd,zw),
             lerp(cam.pos[2],zp.pos[2]+zp.N[2]*zd,zw)];
    var ztx=zp.pos[0]-cam.pos[0],zty=zp.pos[1]-cam.pos[1],ztz=zp.pos[2]-cam.pos[2];
    var zhz=Math.sqrt(ztx*ztx+ztz*ztz)||1;
    yaw=lerp(yaw,Math.atan2(ztx,ztz)+(msX-0.5)*0.028,zw);
    pitch=lerp(pitch,Math.atan2(zty,zhz)+(0.5-msY)*0.02,zw);
    roll*=(1-zw);
  }
  var cp=Math.cos(pitch),sp2=Math.sin(pitch),cyw=Math.cos(yaw),syw=Math.sin(yaw);
  var fwd=[syw*cp,sp2,cyw*cp];
  /* right = normalize(cross(up0,fwd)) */
  var rx=fwd[2],ry=0,rz=-fwd[0];
  var rl=Math.sqrt(rx*rx+rz*rz)||1;rx/=rl;rz/=rl;
  /* up = cross(fwd,right) */
  var ux=fwd[1]*rz-fwd[2]*ry, uy=fwd[2]*rx-fwd[0]*rz, uz=fwd[0]*ry-fwd[1]*rx;
  var cr=Math.cos(roll),sr=Math.sin(roll);
  cam.right=[rx*cr+ux*sr, ry*cr+uy*sr, rz*cr+uz*sr];
  cam.up=[ux*cr-rx*sr, uy*cr-ry*sr, uz*cr-rz*sr];
  cam.fwd=fwd;
  /* build front & day (home tells the 28-day story; side roads are already alive) */
  var isHome=curRoute==='home';
  var front=isHome?camZ+3.5:camZ+30;
  var d=isHome?dayAt(st):29;
  var dayN=isHome?clamp((d<0?0:d)/28,0,1):1;
  /* boxes */
  for(var b=0;b<NBOX;b++){
    var B=BOXES[b];
    var bx=pathX(B[0])+B[1]*B[2];
    var grow=sstep(0.0,1.0,(front-(B[0]-10.0))/13.0);
    /* silhouette floor: the skyline is visible from the start, wakes up as you ride */
    var hgt=Math.max(0.04,B[4]*Math.max(0.24,smoother(grow)));
    f3[b*3]=bx-B[3];f3[b*3+1]=0;f3[b*3+2]=B[0]-B[5];
    f3b[b*3]=bx+B[3];f3b[b*3+1]=hgt;f3b[b*3+2]=B[0]+B[5];
    f1[b]=smoother(grow);
    f1b[b]=clamp(clamp((front-B[0])/8,0,1)*0.35+dayN*0.55,0,1);
  }
  /* pedestrians: last 4 box slots carry walker pos+height for the silhouette pass */
  for(var w4=0;w4<4;w4++){
    var wc=Math.floor((camZ+2)/9)+w4;
    var wp=(tms*0.000045*(1+(w4%2)*0.4)+w4*0.37)%1;
    var dirw=(w4%2)?-1:1;                      /* stroll both ways */
    var wz=wc*9+(dirw>0?wp*7:7-wp*7);
    var ws=((wc%2)+2)%2===0?1:-1;
    var wx=pathX(wz)+ws*(RW+1.32);
    var wi=18+w4;
    var wh2=0.50+w4*0.028;
    f3[wi*3]=wx-0.18;f3[wi*3+1]=0;f3[wi*3+2]=wz;
    f3b[wi*3]=wx+0.18;f3b[wi*3+1]=wh2;f3b[wi*3+2]=wz;
    f1[wi]=1;f1b[wi]=0;
  }
  /* panels: fade by distance, pick 5 nearest ahead */
  var cand=[];
  for(var pi=0;pi<panels.length;pi++){
    var P=panels[pi];
    var rel=P.z-camZ;
    var a=0;
    if(P.gate){a=sstep(24,8,rel)*sstep(-1.2,0.5,rel);}
    else{a=sstep(19,4.5,rel)*sstep(-0.8,0.6,rel);}  /* full brightness lands with the close-up */
    P.alpha=a;
    if(a>0.01)cand.push(pi);
  }
  cand.sort(function(x,y){return Math.abs(panels[y].z-camZ)-Math.abs(panels[x].z-camZ);}); /* far first */
  activeIdx=cand.slice(-5);  /* nearest 5, still far→near order for blending */
  var hovShaderIdx=-1,hovRect=[0,0,0,0];
  for(var s5=0;s5<5;s5++){
    var idx=s5<activeIdx.length?activeIdx[s5]:-1;
    if(idx<0){pA[s5]=0;continue;}
    var PP=panels[idx];
    pA[s5]=PP.alpha;
    pPos[s5*3]=PP.pos[0];pPos[s5*3+1]=PP.pos[1];pPos[s5*3+2]=PP.pos[2];
    pU[s5*3]=PP.U[0];pU[s5*3+1]=PP.U[1];pU[s5*3+2]=PP.U[2];
    pV[s5*3]=PP.V[0];pV[s5*3+1]=PP.V[1];pV[s5*3+2]=PP.V[2];
    pN[s5*3]=PP.N[0];pN[s5*3+1]=PP.N[1];pN[s5*3+2]=PP.N[2];
    pHalf[s5*2]=PP.hw;pHalf[s5*2+1]=PP.hh;
    pUV[s5*4]=PP.uv[0];pUV[s5*4+1]=PP.uv[1];pUV[s5*4+2]=PP.uv[2];pUV[s5*4+3]=PP.uv[3];
    pFx[s5]=PP.film?1:0;
    if(idx===hovP){
      hovShaderIdx=s5;
      var L=panels[idx].links[hovL];
      if(L)hovRect=[L.x/PP.lw,L.y/PP.lh,(L.x+L.w)/PP.lw,(L.y+L.h)/PP.lh];
    }
  }
  /* the light-cycle: rides ahead; pulls away to the horizon after handoff */
  var handStart=10/NB;
  var riseP=isHome?sstep(handStart+0.015,handStart+0.10,Js):0;
  /* parked close at the landing, opens gap while riding, gone after handoff */
  var ahead=lerp(1.7,4.4,sstep(0.015,0.10,Js))+riseP*110.0;
  var bz=camZ+ahead;
  var beacon=[pathX(bz)+(reduce?0:Math.sin(tms*0.0011)*0.10),0.16,bz];
  var beaconG=(booted?1:0)*(1.0-riseP*0.45);
  if(fontsReady)updHUD(st);
  /* hover tracks the live camera every frame — no stale hit zones */
  if(atlasReady)updateHover();
  /* uniforms */
  gl.uniform2f(uni.uRes,glc.width,glc.height);
  gl.uniform1f(uni.uTime,tms/1000);
  gl.uniform2f(uni.uMouse,msX,msY);
  gl.uniform1f(uni.uGlitch,clamp(glitch,0,1));
  gl.uniform1f(uni.uVel,vel);
  gl.uniform1f(uni.uReduce,reduce?1:0);
  gl.uniform3f(uni.uPos,cam.pos[0],cam.pos[1],cam.pos[2]);
  gl.uniform3f(uni.uFwd,cam.fwd[0],cam.fwd[1],cam.fwd[2]);
  gl.uniform3f(uni.uRight,cam.right[0],cam.right[1],cam.right[2]);
  gl.uniform3f(uni.uUp,cam.up[0],cam.up[1],cam.up[2]);
  focalCur+=((FOCAL-0.13*speed*(reduce?0.3:1))-focalCur)*clamp(dt*0.004,0,1);
  gl.uniform1f(uni.uFocal,focalCur);
  gl.uniform1f(uni.uFront,booted?front:camZ-2);
  gl.uniform1f(uni.uDay,dayN);
  gl.uniform1f(uni.uSpeed,speed);
  gl.uniform3fv(uni.uBoxMin,f3);
  gl.uniform3fv(uni.uBoxMax,f3b);
  gl.uniform1fv(uni.uBoxGrow,f1);
  gl.uniform1fv(uni.uBoxLit,f1b);
  gl.uniform3fv(uni.uPanPos,pPos);
  gl.uniform3fv(uni.uPanU,pU);
  gl.uniform3fv(uni.uPanV,pV);
  gl.uniform3fv(uni.uPanN,pN);
  gl.uniform2fv(uni.uPanHalf,pHalf);
  gl.uniform4fv(uni.uPanUV,pUV);
  gl.uniform1fv(uni.uPanA,pA);
  gl.uniform1fv(uni.uPanFx,pFx);
  gl.uniform1f(uni.uReel,Math.max(smoother(clamp(st.u*1.18,0,1)),smoother(clamp((tms-reelT0)/6500,0,1))));
  var tgtT=ROUTES[curRoute].tint||[1.0,0.58,0.30];
  for(var tc2=0;tc2<3;tc2++)curTint[tc2]+=(tgtT[tc2]-curTint[tc2])*clamp(dt*0.0065,0,1);
  gl.uniform3f(uni.uTint,curTint[0],curTint[1],curTint[2]);
  gl.uniform1f(uni.uQual,GFXQ);
  gl.uniform4f(uni.uHov,hovRect[0],hovRect[1],hovRect[2],hovRect[3]);
  gl.uniform1f(uni.uHovAmt,hovShaderIdx>=0?1:0);
  gl.uniform1f(uni.uHovIdx,hovShaderIdx);
  gl.uniform3f(uni.uBeacon,beacon[0],beacon[1],beacon[2]);
  gl.uniform1f(uni.uBeaconG,beaconG);
  /* bike heading + banking into curves */
  var dxb=(pathX(bz+0.6)-pathX(bz-0.6))/1.2;
  gl.uniform2f(uni.uBikeA,Math.atan2(dxb,1),clamp(-dxb*0.9,-0.45,0.45)*(reduce?0:1));
  /* two nearest gates for the beam pass */
  var g1=GATES[0].z,g2=GATES[1].z,bd1=1e9,bd2=1e9;
  for(var gg=0;gg<GATES.length;gg++){
    var gd=Math.abs(GATES[gg].z-camZ);
    if(gd<bd1){bd2=bd1;g2=g1;bd1=gd;g1=GATES[gg].z;}
    else if(gd<bd2){bd2=gd;g2=GATES[gg].z;}
  }
  gl.uniform1f(uni.uGA,isHome?g1:-999);
  gl.uniform1f(uni.uGB,isHome?g2:-999);
  /* FP: collect + pass 4 nearest visible tokens */
  buildTokens();
  if(booted&&isHome)collectPass(dt);
  var tp4=[],tSel=[];
  for(var tk=0;tk<TOKENS.length;tk++){
    var T=TOKENS[tk];
    if(T.an>=1)continue;
    var rel2=T.z-camZ;
    if(rel2>-2&&rel2<15)tSel.push(tk);
  }
  tSel.sort(function(a,b){return Math.abs(TOKENS[a].z-camZ)-Math.abs(TOKENS[b].z-camZ);});
  if(!isHome)tSel=[];
  for(var s4=0;s4<4;s4++){
    if(s4<tSel.length){
      var TT=TOKENS[tSel[s4]];
      tokP[s4*3]=TT.x;tokP[s4*3+1]=TT.y;tokP[s4*3+2]=TT.z;
      tokA[s4]=TT.an;
    }else tokA[s4]=-1;
  }
  gl.uniform3fv(uni.uTokP,tokP);
  gl.uniform1fv(uni.uTokA,tokA);
  /* 4 street lamps ahead (cells of 6 units, alternating sides) */
  var lc0=Math.floor(camZ/6);
  for(var lm=0;lm<4;lm++){
    var lcell=lc0+lm+0.5, lzz=lcell*6;
    var lside=(Math.floor(lc0+lm)%2===0)?1:-1;
    var active=(lzz<front+2)&&booted?1:-1;
    lampP[lm*3]=pathX(lzz)+lside*(RW+0.42);
    lampP[lm*3+1]=active;
    lampP[lm*3+2]=lzz;
  }
  gl.uniform3fv(uni.uLamp,lampP);
  /* 6 roadside bushes from a repeating jittered pattern (packed x,z,active) */
  for(var bu2=0;bu2<6;bu2++){
    var bcell=Math.floor((camZ-3)/5)+bu2;
    var bh1=Math.abs(Math.sin(bcell*127.1))%1, bh2=Math.abs(Math.sin(bcell*311.7))%1;
    var bz3=bcell*5+2.5+(bh1-0.5)*2.2;
    var bside=(((bcell%2)+2)%2===0)?1:-1;
    bushP[bu2*3]=pathX(bz3)+bside*(1.9+2.3*bh2);
    bushP[bu2*3+1]=bz3;
    bushP[bu2*3+2]=(bh1>0.28&&bz3>2)?1:-99;
  }
  gl.uniform3fv(uni.uBush,bushP);
  /* finale intensity: ramps in across the last three beats */
  gl.uniform1f(uni.uEnd,(curRoute==='contact'?1:(isHome?sstep(11.2/NB,12.2/NB,Js):0))*(reduce?0.5:1));
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  if(T3)T3.frame(tms,dt);
}

/* ================= THREE.JS OBJECT LAYER =================
   Bespoke 3D "totems" beside the boards — service sculptures on the
   product road, story monuments, film reels, junction portals.
   Camera is slaved 1:1 to the shader ray march (fovY = 2·atan(1/FOCAL)). */
var T3=(function(){
  if(!gl)return null;
  var ready=false,dead=false,t0=performance.now();
  var renderer,scene,camera,mtx,routeName='home';
  var built={},totems=[];
  var FOVY=2*Math.atan(1/FOCAL)*180/Math.PI;

  function mat(color,op,wire){
    var m=new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:op,
      wireframe:!!wire,blending:THREE.AdditiveBlending,depthWrite:false});
    m.userData.o=op;
    return m;
  }
  function lineMat(color,op){
    var m=new THREE.LineBasicMaterial({color:color,transparent:true,opacity:op,
      blending:THREE.AdditiveBlending,depthWrite:false});
    m.userData.o=op;
    return m;
  }
  /* totem shell: group + collected materials + z + update(t,a) */
  function totem(route,z,x,y,update){
    var g=new THREE.Group();
    g.position.set(x,y,z);
    var T={g:g,z:z,y0:y,mats:[],route:route,update:update,pop:0,scale:1};
    g.userData.T=T;
    return T;
  }
  function reg(T,mesh){
    T.mats.push(mesh.material);
    return mesh;
  }
  function fin(T){
    T.g.traverse(function(o){if(o.material&&T.mats.indexOf(o.material)<0)T.mats.push(o.material);});
    scene.add(T.g);totems.push(T);
    return T;
  }
  function sideOf(route,i){ /* same side as the billboard (billboards sit on i%2? 1:-1) */
    return (i%2?1:-1);
  }
  /* crown placement: the sculpture hovers just above its billboard, never over the text */
  function beatXYZ(route,i,latPad,y,dz){
    var b=ROUTES[route].beats[i];
    var z=b.z+(dz==null?0:dz);
    var centered=(b.panel==='cta'||b.panel==='hero'||b.panel==='footer'||b.panel==='trust');
    var lat=centered?0:sideOf(route,i)*(latPad==null?2.05:latPad);
    return [pathX(b.z)+lat,y==null?4.12:y,z];
  }

  /* ---------- sculpture builders ---------- */
  function tVoice(route,i,cA,cB){ /* pulsing sound-rings around a core */
    var p=beatXYZ(route,i);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.g.rotation.y=t*0.35;
      for(var r=0;r<3;r++){var ring=T.rings[r];
        var s=1+0.16*Math.sin(t*2.4-r*1.15);
        ring.scale.set(s,s,s);
        ring.material.opacity=ring.material.userData.o*a*(0.55+0.45*Math.sin(t*2.4-r*1.15));
      }
      T.core.rotation.x=t*0.9;T.core.rotation.z=t*0.55;
      for(var b3=0;b3<T.bars.length;b3++){var bar=T.bars[b3];
        bar.scale.y=0.35+0.65*Math.abs(Math.sin(t*3.1+b3*0.9));
      }
    });
    T.scale=1.28;
    T.rings=[];
    for(var r=0;r<3;r++){
      var ring=new THREE.Mesh(new THREE.TorusGeometry(0.26+r*0.17,0.014,8,48),mat(cA,0.75-r*0.18));
      T.rings.push(reg(T,ring));T.g.add(ring);
    }
    T.core=reg(T,new THREE.Mesh(new THREE.IcosahedronGeometry(0.13,0),mat(cB,0.9,true)));
    T.g.add(T.core);
    T.bars=[];
    for(var b3=0;b3<5;b3++){
      var bar=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.5,0.05),mat(cA,0.5));
      bar.position.set((b3-2)*0.16,-0.72,0);
      T.bars.push(reg(T,bar));T.g.add(bar);
    }
    return fin(T);
  }
  function tWA(route,i,cA,cB){ /* chat bubble + orbiting message packets */
    var p=beatXYZ(route,i);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.g.rotation.y=Math.sin(t*0.45)*0.5;
      for(var k=0;k<T.orbs.length;k++){var o=T.orbs[k];
        var an=t*(0.8+k*0.13)+k*2.1;
        o.position.set(Math.cos(an)*0.62,0.12*Math.sin(t*1.3+k*2.0),Math.sin(an)*0.62);
        o.rotation.x=t*1.2+k;o.rotation.y=t*0.9;
      }
      for(var d3=0;d3<3;d3++){var dot=T.dots[d3];
        dot.material.opacity=dot.material.userData.o*a*(0.25+0.75*Math.pow(Math.max(0,Math.sin(t*2.6-d3*0.75)),2));
      }
    });
    T.scale=1.28;
    var bub=reg(T,new THREE.Mesh(new THREE.SphereGeometry(0.34,18,12),mat(cA,0.55,true)));
    bub.scale.set(1.1,0.78,0.62);T.g.add(bub);
    var tail=reg(T,new THREE.Mesh(new THREE.ConeGeometry(0.09,0.2,4),mat(cA,0.55,true)));
    tail.position.set(-0.26,-0.3,0);tail.rotation.z=0.9;T.g.add(tail);
    T.dots=[];
    for(var d3=0;d3<3;d3++){
      var dot=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),mat('#ffffff',0.9));
      dot.position.set((d3-1)*0.12,0,0.36);
      T.dots.push(reg(T,dot));T.g.add(dot);
    }
    T.orbs=[];
    for(var k=0;k<4;k++){
      var o=new THREE.Mesh(new THREE.BoxGeometry(0.085,0.06,0.02),mat(cB,0.8));
      T.orbs.push(reg(T,o));T.g.add(o);
    }
    return fin(T);
  }
  function tRAG(route,i,cA,cB){ /* documents rising into a knowledge crystal */
    var p=beatXYZ(route,i);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.crys.rotation.y=t*0.7;T.crys.rotation.x=Math.sin(t*0.5)*0.25;
      for(var k=0;k<T.docs.length;k++){var d=T.docs[k];
        var ph=(t*0.22+k/T.docs.length)%1;
        d.position.y=-0.75+ph*1.05;
        d.material.opacity=d.material.userData.o*a*Math.sin(Math.PI*ph);
        d.rotation.y=Math.PI*0.5*ph;
      }
      T.ring.rotation.z=t*0.5;
    });
    T.scale=1.28;
    T.crys=reg(T,new THREE.Mesh(new THREE.OctahedronGeometry(0.3,0),mat(cA,0.85,true)));
    T.crys.position.y=0.42;T.g.add(T.crys);
    var inner=reg(T,new THREE.Mesh(new THREE.OctahedronGeometry(0.15,0),mat(cB,0.5)));
    inner.position.y=0.42;T.g.add(inner);
    T.docs=[];
    for(var k=0;k<4;k++){
      var d=new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.4),
        new THREE.MeshBasicMaterial({color:cB,transparent:true,opacity:0.5,side:THREE.DoubleSide,
          blending:THREE.AdditiveBlending,depthWrite:false}));
      d.material.userData.o=0.5;
      T.docs.push(reg(T,d));T.g.add(d);
    }
    T.ring=reg(T,new THREE.Mesh(new THREE.TorusGeometry(0.5,0.008,6,40),mat(cA,0.4)));
    T.ring.rotation.x=Math.PI/2;T.ring.position.y=0.42;T.g.add(T.ring);
    return fin(T);
  }
  function tAgent(route,i,cA,cB){ /* node graph with a live pulse */
    var p=beatXYZ(route,i);
    var NODES=[[0,0.45,0],[-0.42,0.12,0.1],[0.42,0.14,-0.08],[-0.24,-0.32,-0.12],[0.26,-0.3,0.12],[0,-0.05,0.3],[0,0.02,-0.32]];
    var EDGES=[[0,1],[0,2],[0,5],[0,6],[1,3],[2,4],[5,3],[5,4],[6,1],[6,2],[3,4]];
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.g.rotation.y=t*0.3;
      var seg=Math.floor(t/0.9)%EDGES.length, u=(t%0.9)/0.9;
      var e=EDGES[seg],A=NODES[e[0]],B=NODES[e[1]];
      T.pulse.position.set(lerp(A[0],B[0],u),lerp(A[1],B[1],u),lerp(A[2],B[2],u));
      T.pulse.material.opacity=T.pulse.material.userData.o*a*Math.sin(Math.PI*u);
      for(var n=0;n<T.nodes.length;n++)T.nodes[n].scale.setScalar(1+0.18*Math.sin(t*2.2+n*1.7));
    });
    T.scale=1.28;
    T.nodes=[];
    for(var n=0;n<NODES.length;n++){
      var s=new THREE.Mesh(new THREE.SphereGeometry(n===0?0.075:0.05,10,8),mat(n===0?cB:cA,0.9));
      s.position.set(NODES[n][0],NODES[n][1],NODES[n][2]);
      T.nodes.push(reg(T,s));T.g.add(s);
    }
    var pos=[];
    for(var e2=0;e2<EDGES.length;e2++){
      var a2=NODES[EDGES[e2][0]],b2=NODES[EDGES[e2][1]];
      pos.push(a2[0],a2[1],a2[2],b2[0],b2[1],b2[2]);
    }
    var geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    var lines=new THREE.LineSegments(geo,lineMat(cA,0.35));
    T.g.add(reg(T,lines));
    T.pulse=reg(T,new THREE.Mesh(new THREE.SphereGeometry(0.045,8,6),mat('#ffffff',1)));
    T.g.add(T.pulse);
    return fin(T);
  }
  function tWeb(route,i,cA,cB){ /* browser frame + phone in orbit */
    var p=beatXYZ(route,i);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.g.rotation.y=t*0.4;
      T.ph.rotation.y=-t*0.4+0.6;
      T.ph.position.y=0.06*Math.sin(t*1.4);
      T.cur.material.opacity=T.cur.material.userData.o*a*(0.3+0.7*(Math.sin(t*5)>0?1:0));
    });
    T.scale=1.28;
    var brw=new THREE.Group();
    var frame=reg(T,new THREE.Mesh(new THREE.PlaneGeometry(0.72,0.5),
      new THREE.MeshBasicMaterial({color:cA,transparent:true,opacity:0.55,wireframe:true,
        blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})));
    frame.material.userData.o=0.55;
    brw.add(frame);
    for(var l2=0;l2<3;l2++){
      var ln=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.5-l2*0.1,0.018,0.004),mat(cB,0.7)));
      ln.position.set(-0.05-l2*0.05,0.1-l2*0.11,0.01);brw.add(ln);
    }
    var bar=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.72,0.05,0.004),mat(cB,0.5)));
    bar.position.y=0.275;brw.add(bar);
    brw.position.x=-0.14;
    T.g.add(brw);
    T.ph=new THREE.Group();
    var pb=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.2,0.38,0.02),mat(cB,0.7,true)));
    T.ph.add(pb);
    var ps=reg(T,new THREE.Mesh(new THREE.PlaneGeometry(0.16,0.3),mat(cA,0.25)));
    ps.position.z=0.012;T.ph.add(ps);
    T.ph.position.set(0.46,0,0.1);
    T.g.add(T.ph);
    T.cur=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.02,0.06,0.004),mat('#ffffff',0.9)));
    T.cur.position.set(0.12,-0.12,0.012);
    T.g.add(T.cur);
    return fin(T);
  }
  function tGlobe(route,i,cA,cB){ /* offshore: wire globe + traffic arcs */
    var p=beatXYZ(route,i);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.gl.rotation.y=t*0.3;
      for(var s2=0;s2<T.sats.length;s2++){var st5=T.sats[s2];
        var an=t*(0.7+s2*0.2)+s2*3;
        st5.position.set(Math.cos(an)*0.56,0.18*Math.sin(an*1.3),Math.sin(an)*0.56);
      }
      for(var q2=0;q2<T.pk.length;q2++){var pk=T.pk[q2];
        var ph=(t*0.5+q2*0.33)%1;
        pk.position.copy(T.arcs[q2].getPointAt(ph));
        pk.material.opacity=pk.material.userData.o*a*Math.sin(Math.PI*ph);
      }
    });
    T.scale=1.28;
    T.gl=new THREE.Group();
    var sph=reg(T,new THREE.Mesh(new THREE.SphereGeometry(0.4,14,10),mat(cA,0.4,true)));
    T.gl.add(sph);
    T.arcs=[];T.pk=[];
    var PTS=[[[-0.28,0.2,0.2],[0.3,0.16,-0.18]],[[0.05,-0.34,0.2],[-0.3,0.22,-0.14]],[[0.34,-0.1,0.18],[-0.12,0.36,0.1]]];
    for(var q2=0;q2<3;q2++){
      var A=new THREE.Vector3().fromArray(PTS[q2][0]),B=new THREE.Vector3().fromArray(PTS[q2][1]);
      var M=A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(0.72);
      var curve=new THREE.QuadraticBezierCurve3(A,M,B);
      T.arcs.push(curve);
      var tube=reg(T,new THREE.Mesh(new THREE.TubeGeometry(curve,16,0.008,5,false),mat(cB,0.5)));
      T.gl.add(tube);
      var pk=reg(T,new THREE.Mesh(new THREE.SphereGeometry(0.028,6,5),mat('#ffffff',1)));
      T.gl.add(pk);T.pk.push(pk);
    }
    T.g.add(T.gl);
    T.sats=[];
    for(var s2=0;s2<2;s2++){
      var st5=reg(T,new THREE.Mesh(new THREE.OctahedronGeometry(0.04,0),mat(cB,0.9)));
      T.g.add(st5);T.sats.push(st5);
    }
    return fin(T);
  }
  function tOrrery(route,i,cA,cB){ /* product hero: six services orbiting one core — floats over the road */
    var b0=ROUTES[route].beats[i];var p=[pathX(b0.z+2.6),2.95,b0.z+2.6];
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.g.rotation.y=t*0.5;
      for(var k=0;k<6;k++){var o=T.sv[k];
        var an=t*0.5+k*Math.PI/3;
        o.position.set(Math.cos(an)*0.58,0.1*Math.sin(t*1.1+k),Math.sin(an)*0.58);
        o.rotation.y=t*1.4+k;
      }
      T.core.rotation.x=t*0.8;T.core.rotation.y=-t*0.6;
    });
    T.scale=1.6;
    T.core=reg(T,new THREE.Mesh(new THREE.IcosahedronGeometry(0.2,0),mat(cA,0.9,true)));
    T.g.add(T.core);
    var ring=reg(T,new THREE.Mesh(new THREE.TorusGeometry(0.58,0.008,6,48),mat(cA,0.3)));
    ring.rotation.x=Math.PI/2;T.g.add(ring);
    T.sv=[];
    for(var k=0;k<6;k++){
      var o=reg(T,new THREE.Mesh(new THREE.OctahedronGeometry(0.07,0),mat(cB,0.95)));
      T.g.add(o);T.sv.push(o);
    }
    return fin(T);
  }
  function tCrystal(route,i,cA,cB){ /* story: the founding belief */
    var p=beatXYZ(route,i);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.outer.rotation.y=t*0.4;T.outer.rotation.x=Math.sin(t*0.3)*0.2;
      T.inner.rotation.y=-t*0.7;
      T.inner.scale.setScalar(1+0.1*Math.sin(t*1.8));
      T.halo.rotation.z=t*0.25;
    });
    T.scale=1.26;
    T.outer=reg(T,new THREE.Mesh(new THREE.IcosahedronGeometry(0.42,0),mat(cA,0.6,true)));
    T.g.add(T.outer);
    T.inner=reg(T,new THREE.Mesh(new THREE.IcosahedronGeometry(0.2,0),mat(cB,0.7)));
    T.g.add(T.inner);
    T.halo=reg(T,new THREE.Mesh(new THREE.TorusGeometry(0.62,0.01,6,48),mat(cB,0.35)));
    T.g.add(T.halo);
    return fin(T);
  }
  function tSplit(route,i,cA,cB){ /* story: finished ≠ endures — a cube that re-forms */
    var p=beatXYZ(route,i);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      var w=0.5+0.5*Math.sin(t*0.9);   /* 0 = welded, 1 = split */
      var off=0.045+w*0.22;
      T.h1.position.x=-off;T.h2.position.x=off;
      T.h1.rotation.x=w*0.4;T.h2.rotation.x=-w*0.4;
      T.g.rotation.y=t*0.35;
      T.seam.material.opacity=T.seam.material.userData.o*a*(1-w);
      T.seam.scale.setScalar(1+(1-w)*0.15);
    });
    T.scale=1.26;
    T.h1=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.26,0.52,0.52),mat(cA,0.55,true)));
    T.g.add(T.h1);
    T.h2=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.26,0.52,0.52),mat(cA,0.55,true)));
    T.g.add(T.h2);
    T.seam=reg(T,new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.5),
      new THREE.MeshBasicMaterial({color:cB,transparent:true,opacity:0.5,side:THREE.DoubleSide,
        blending:THREE.AdditiveBlending,depthWrite:false})));
    T.seam.material.userData.o=0.5;
    T.seam.rotation.y=Math.PI/2;
    T.g.add(T.seam);
    return fin(T);
  }
  function tTwin(route,i,cA,cB){ /* story: two founders, one beam */
    var p=beatXYZ(route,i);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.s1.position.y=0.62+0.05*Math.sin(t*1.2);
      T.s2.position.y=0.62+0.05*Math.sin(t*1.2+Math.PI);
      T.beam.material.opacity=T.beam.material.userData.o*a*(0.5+0.5*Math.sin(t*2.2));
      T.g.rotation.y=Math.sin(t*0.3)*0.3;
    });
    T.scale=1.26;
    var o1=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.14,0.95,0.14),mat(cA,0.5,true)));
    o1.position.set(-0.3,0,0);T.g.add(o1);
    var o2=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.14,0.95,0.14),mat(cA,0.5,true)));
    o2.position.set(0.3,0,0);T.g.add(o2);
    T.s1=reg(T,new THREE.Mesh(new THREE.SphereGeometry(0.055,8,6),mat(cB,1)));
    T.s1.position.set(-0.3,0.62,0);T.g.add(T.s1);
    T.s2=reg(T,new THREE.Mesh(new THREE.SphereGeometry(0.055,8,6),mat(cB,1)));
    T.s2.position.set(0.3,0.62,0);T.g.add(T.s2);
    T.beam=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.6,0.014,0.014),mat('#ffffff',0.8)));
    T.beam.position.y=0.62;T.g.add(T.beam);
    return fin(T);
  }
  function tGyro(route,i,cA,cB){ /* story: advisors — governance gyroscope */
    var p=beatXYZ(route,i);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.r1.rotation.x=t*0.7;T.r2.rotation.y=t*0.55;T.r3.rotation.z=t*0.85;
      T.core.scale.setScalar(1+0.12*Math.sin(t*2.4));
    });
    T.scale=1.26;
    T.r1=reg(T,new THREE.Mesh(new THREE.TorusGeometry(0.42,0.012,6,48),mat(cA,0.7)));
    T.g.add(T.r1);
    T.r2=reg(T,new THREE.Mesh(new THREE.TorusGeometry(0.33,0.012,6,44),mat(cB,0.7)));
    T.r2.rotation.x=Math.PI/2;T.g.add(T.r2);
    T.r3=reg(T,new THREE.Mesh(new THREE.TorusGeometry(0.24,0.012,6,40),mat('#ffffff',0.55)));
    T.r3.rotation.y=Math.PI/2;T.g.add(T.r3);
    T.core=reg(T,new THREE.Mesh(new THREE.SphereGeometry(0.09,10,8),mat(cB,0.95)));
    T.g.add(T.core);
    return fin(T);
  }
  function tBeacon(route,i,cA,cB,y0){ /* creed / contact: uplink antenna on the board's roof */
    var p=beatXYZ(route,i,null,y0==null?3.45:y0);
    var T=totem(route,p[2],p[0],p[1],function(t,a){
      T.orb.position.y=1.06+0.06*Math.sin(t*1.6);
      T.orb.scale.setScalar(1+0.15*Math.sin(t*3.2));
      for(var r=0;r<3;r++){var ring=T.rg[r];
        var ph=(t*0.5+r/3)%1;
        ring.position.y=0.2+ph*1.1;
        var s=0.25+ph*0.6;
        ring.scale.set(s,s,s);
        ring.material.opacity=ring.material.userData.o*a*(1-ph);
      }
    });
    T.scale=1.4;
    var mast=reg(T,new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.03,1.0,6),mat(cA,0.6)));
    mast.position.y=0.5;T.g.add(mast);
    T.orb=reg(T,new THREE.Mesh(new THREE.SphereGeometry(0.07,10,8),mat('#ffffff',1)));
    T.orb.position.y=1.06;T.g.add(T.orb);
    T.rg=[];
    for(var r=0;r<3;r++){
      var ring=reg(T,new THREE.Mesh(new THREE.TorusGeometry(1,0.02,6,40),mat(cB,0.6)));
      ring.rotation.x=Math.PI/2;
      T.g.add(ring);T.rg.push(ring);
    }
    return fin(T);
  }
  function tReel(route,i,cA,cB,dz,side,latP,yy){ /* film reel, spinning */
    var b=ROUTES[route].beats[i];
    var z=b.z+(dz||0);
    var x=(side===null||side===undefined)?pathX(b.z)+sideOf(route,i)*2.05:pathX(z)+side*(RW+(latP==null?0.55:latP));
    var T=totem(route,z,x,yy==null?1.15:yy,function(t,a){
      T.wheel.rotation.z=-t*1.6;
      T.tick.material.opacity=T.tick.material.userData.o*a*(0.4+0.6*(Math.sin(t*9)>0.4?1:0.2));
    });
    T.scale=1.3;
    T.wheel=new THREE.Group();
    var rim=reg(T,new THREE.Mesh(new THREE.TorusGeometry(0.4,0.022,8,44),mat(cA,0.8)));
    T.wheel.add(rim);
    var hub=reg(T,new THREE.Mesh(new THREE.TorusGeometry(0.08,0.018,6,20),mat(cB,0.9)));
    T.wheel.add(hub);
    for(var s3=0;s3<6;s3++){
      var sp=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.02,0.3,0.02),mat(cA,0.6)));
      var an=s3*Math.PI/3;
      sp.position.set(Math.cos(an)*0.24,Math.sin(an)*0.24,0);
      sp.rotation.z=an+Math.PI/2;
      T.wheel.add(sp);
      var hole=reg(T,new THREE.Mesh(new THREE.TorusGeometry(0.045,0.01,6,14),mat(cB,0.7)));
      hole.position.set(Math.cos(an)*0.24,Math.sin(an)*0.24,0);
      T.wheel.add(hole);
    }
    T.g.add(T.wheel);
    T.tick=reg(T,new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.05),mat('#ffffff',0.9)));
    T.tick.position.set(0,0.58,0);
    T.g.add(T.tick);
    return fin(T);
  }
  function tPortal(route,cA,cB){ /* junction gate: ring you steer through */
    var bs=ROUTES[route].beats;
    var i=bs.length-1, z=bs[i].z+0.55;
    var T=totem(route,z,pathX(z),1.12,function(t,a){
      T.ring.rotation.z=t*0.4;
      T.ring2.rotation.z=-t*0.6;
      for(var k=0;k<8;k++){var o=T.gems[k];
        var an=t*0.4+k*Math.PI/4;
        o.position.set(Math.cos(an)*1.5,Math.sin(an)*1.5,0);
      }
    });
    T.win=[30,9,-2.0,-0.4]; /* wider fade window — the portal is the destination */
    T.ring=reg(T,new THREE.Mesh(new THREE.TorusGeometry(1.5,0.035,8,64),mat(cA,0.55)));
    T.g.add(T.ring);
    T.ring2=reg(T,new THREE.Mesh(new THREE.TorusGeometry(1.62,0.012,6,64),mat(cB,0.35)));
    T.g.add(T.ring2);
    T.gems=[];
    for(var k=0;k<8;k++){
      var o=reg(T,new THREE.Mesh(new THREE.OctahedronGeometry(0.05,0),mat('#ffffff',0.8)));
      T.g.add(o);T.gems.push(o);
    }
    return fin(T);
  }

  /* ---------- per-route population ---------- */
  function buildRoute(name){
    if(built[name])return;built[name]=true;
    var css=ROUTES[name].css,cA=css[0],cB=css[2];
    if(name==='product'){
      tOrrery('product',0,cA,cB);
      tVoice('product',1,cA,cB);
      tWA('product',2,cA,cB);
      tRAG('product',3,cA,cB);
      tAgent('product',4,cA,cB);
      tWeb('product',5,cA,cB);
      tGlobe('product',6,cA,cB);
    }else if(name==='story'){
      tCrystal('story',0,cA,cB);
      tSplit('story',1,cA,cB);
      tTwin('story',2,cA,cB);
      tGyro('story',3,cA,cB);
      tBeacon('story',4,cA,cB);
    }else if(name==='work'){
      tReel('work',0,cA,cB,0,null,null,4.0);
    }else if(name==='contact'){
      tBeacon('contact',0,cA,cB);
    }else if(name.indexOf('case')===0){
      tReel(name,0,cA,cB,-0.9,-1,1.45);
      tReel(name,0,cA,cB,-0.9,1,1.45);
    }
    /* the cinema screen is translucent — a portal behind it reads as noise */
    if(name.indexOf('case')!==0)tPortal(name,cA,cB);
  }
  function init(){
    var cnv=document.createElement('canvas');
    cnv.id='three';
    cnv.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;display:block;pointer-events:none;z-index:2';
    glc.parentNode.insertBefore(cnv,glc.nextSibling);
    renderer=new THREE.WebGLRenderer({canvas:cnv,alpha:true,antialias:true});
    renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(FOVY,asp,0.05,80);
    camera.matrixAutoUpdate=false;
    mtx=new THREE.Matrix4();
    ready=true;
    api.resize();
    buildRoute(routeName);
  }
  var api={
    route:function(name){
      routeName=name;
      if(!ready)return;
      buildRoute(name);
      for(var i=0;i<totems.length;i++)totems[i].g.visible=false;
    },
    resize:function(){
      if(!ready)return;
      renderer.setPixelRatio(dpr);
      renderer.setSize(W,H,false);
      camera.aspect=asp;camera.fov=FOVY;
      camera.updateProjectionMatrix();
    },
    frame:function(tms,dt){
      if(dead)return;
      if(!ready){
        if(window.THREE)init();
        else{if(tms-t0>15000)dead=true;return;}
      }
      var t=tms/1000, spin=reduce?0.12:1;
      /* FOV follows the warp focal */
      var fv=2*Math.atan(1/focalCur)*180/Math.PI;
      if(Math.abs(camera.fov-fv)>0.05){camera.fov=fv;camera.updateProjectionMatrix();}
      /* camera slaved to the ray march */
      var R=cam.right,U=cam.up,F=cam.fwd,P=cam.pos;
      mtx.set(R[0],U[0],-F[0],P[0],
              R[1],U[1],-F[1],P[1],
              R[2],U[2],-F[2],P[2],
              0,0,0,1);
      camera.matrix.copy(mtx);
      camera.matrixWorldNeedsUpdate=true;
      for(var i=0;i<totems.length;i++){
        var T=totems[i];
        if(T.route!==routeName){T.g.visible=false;continue;}
        var rel=T.z-camZ;
        var w=T.win||[19,4.5,-0.8,0.6];
        var a=sstep(w[0],w[1],rel)*sstep(w[2],w[3],rel);
        if(a<=0.012){T.g.visible=false;continue;}
        T.g.visible=true;
        T.pop+=(1-T.pop)*clamp(dt*0.004,0,1);
        var sc=(0.62+0.38*smoother(a))*(0.85+0.15*T.pop)*T.scale;
        T.g.scale.set(sc,sc,sc);
        T.g.position.y=T.y0+0.05*Math.sin(t*1.2+T.z*1.7);
        /* base fade first, then update() may re-shape individual opacities */
        for(var m2=0;m2<T.mats.length;m2++){
          var M=T.mats[m2];
          M.opacity=Math.min(1,(M.userData.o!=null?M.userData.o:1)*1.25*a);
        }
        if(T.update)T.update(t*spin,a);
      }
      renderer.render(scene,camera);
    }
  };
  return api;
})();

/* ================= INIT ================= */
window.addEventListener('resize',resize);
/* auto-hide mouse cursor during keyboard/scroll interaction */
(function(){
  var hideT;
  function hide(){document.body.classList.add('nocursor');clearTimeout(hideT);}
  function show(){document.body.classList.remove('nocursor');clearTimeout(hideT);hideT=setTimeout(hide,2500);}
  window.addEventListener('keydown',function(e){
    var k=e.key;
    if(k==='ArrowUp'||k==='ArrowDown'||k==='ArrowLeft'||k==='ArrowRight'||k==='PageUp'||k==='PageDown'||k===' ')hide();
  },true);
  window.addEventListener('wheel',hide,{passive:true});
  window.addEventListener('touchstart',hide,{passive:true});
  window.addEventListener('mousemove',show,{passive:true});
  window.addEventListener('mousedown',show,{passive:true});
  hideT=setTimeout(hide,2500);
})();
if(gl&&initGL()){
  resize();
  requestAnimationFrame(frame);
}else{
  console.error('WebGL unavailable — showing fallback');
  var fbEl=document.getElementById('fallback');if(fbEl)fbEl.style.display='block';
  var btEl=document.getElementById('boot');if(btEl)btEl.style.display='none';
}
var fl=['700 64px "Space Grotesk"','700 38px "Space Grotesk"','600 22px "Space Grotesk"',
        '400 16.5px Inter','500 15.5px Inter','400 12px "Space Mono"','700 12px "Space Mono"','700 34px "Space Mono"'];
Promise.all(fl.map(function(f){return document.fonts.load(f);})).then(function(){
  fontsReady=true;resize();
}).catch(function(){fontsReady=true;resize();});

/* ================= MOBILE JOYSTICK ================= */
/* thumbstick for touch devices: push up/down to ride, flick left/right
   to jump beats — and to steer at a junction */
(function(){
  if(!(window.matchMedia&&matchMedia('(pointer: coarse)').matches))return;
  var st=document.createElement('style');
  st.textContent=
    '#joy{position:fixed;right:14px;bottom:calc(64px + env(safe-area-inset-bottom,0px));width:112px;height:112px;z-index:8;touch-action:none;user-select:none;-webkit-user-select:none}'+
    '#joy .base{position:absolute;inset:0;border-radius:50%;border:1.5px solid var(--hud-dim);background:rgba(10,5,16,.38)}'+
    '#joy .base::after{content:"";position:absolute;inset:14px;border-radius:50%;border:1px dashed var(--hud-dim)}'+
    '#joy .a{position:absolute;font:700 11px "Space Mono",monospace;color:var(--hud);pointer-events:none}'+
    '#joy .ah{opacity:.28;transition:opacity .3s,color .3s}'+
    '#joy.steer .ah{opacity:1;color:#5bff9e;text-shadow:0 0 10px rgba(91,255,158,.8);animation:joy-pulse 1.4s infinite}'+
    '@keyframes joy-pulse{0%,100%{opacity:1}50%{opacity:.45}}'+
    '#joy .knob{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:radial-gradient(circle at 35% 30%,var(--hud-ink),var(--b));box-shadow:0 0 16px var(--b);transition:transform .14s;pointer-events:none}'+
    '#joy.live .knob{transition:none}'+
    '#joy .tag{position:absolute;left:50%;transform:translateX(-50%);bottom:-17px;font:700 9px "Space Mono",monospace;letter-spacing:.2em;color:var(--hud-dim);white-space:nowrap;pointer-events:none}';
  document.head.appendChild(st);
  var joy=document.createElement('div');joy.id='joy';
  joy.innerHTML='<div class="base"></div>'+
    '<span class="a" style="left:50%;top:5px;transform:translateX(-50%)">&#9650;</span>'+
    '<span class="a" style="left:50%;bottom:5px;transform:translateX(-50%)">&#9660;</span>'+
    '<span class="a ah" style="left:7px;top:50%;transform:translateY(-50%)">&#9664;</span>'+
    '<span class="a ah" style="right:7px;top:50%;transform:translateY(-50%)">&#9654;</span>'+
    '<div class="knob"></div><div class="tag">RIDE</div>';
  document.body.appendChild(joy);
  var knob=joy.querySelector('.knob');
  var R=38,nx=0,ny=0,active=false,armH=true,rafId=0;
  function setKnob(dx,dy){knob.style.transform='translate('+dx+'px,'+dy+'px)';}
  function loop(){
    if(active){
      if(Math.abs(ny)>0.14)window.scrollBy(0,-ny*26);
      rafId=requestAnimationFrame(loop);
    }
  }
  function upd(e){
    var r=joy.getBoundingClientRect();
    var dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
    var m=Math.sqrt(dx*dx+dy*dy);if(m>R){dx*=R/m;dy*=R/m;}
    setKnob(dx,dy);nx=dx/R;ny=dy/R;
    if(armH&&Math.abs(nx)>0.8&&Math.abs(ny)<0.6&&!navLock&&!trans){
      armH=false;
      if(curBeat===NB-1)routeTo(nx>0?ROUTES[curRoute].R:ROUTES[curRoute].L,nx>0?1:-1);
      else showToast('◀ ▶ STEER — UNLOCKS AT THE JUNCTION · RIDE WITH ▲ ▼');
    }
    if(Math.abs(nx)<0.4)armH=true;
  }
  joy.addEventListener('pointerdown',function(e){
    e.preventDefault();
    try{joy.setPointerCapture(e.pointerId);}catch(x){}
    active=true;joy.classList.add('live');upd(e);
    cancelAnimationFrame(rafId);rafId=requestAnimationFrame(loop);
  });
  joy.addEventListener('pointermove',function(e){if(active)upd(e);});
  function jend(){active=false;joy.classList.remove('live');setKnob(0,0);nx=ny=0;armH=true;}
  joy.addEventListener('pointerup',jend);
  joy.addEventListener('pointercancel',jend);
  /* light the steer arrows only when steering is possible (at a junction) */
  setInterval(function(){joy.classList.toggle('steer',curBeat===NB-1&&!trans);},300);
})();

})();
