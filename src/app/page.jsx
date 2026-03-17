"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const B = "#00d4ff";
const B2 = "#0088cc";
const BG = "linear-gradient(135deg,#00d4ff,#0088cc)";
const DEMO_MODE = false;

const BEATS = [
  {id:1,t:"Midnight Grind",p:"ShadowFreq",bpm:92,k:"Dm",cy:34,d:"3:24",m:"Dark",lk:false},
  {id:2,t:"Concrete Dreams",p:"BassArchitect",bpm:88,k:"Am",cy:67,d:"2:58",m:"Chill",lk:true},
  {id:3,t:"Trap Cathedral",p:"808Deity",bpm:140,k:"Fm",cy:112,d:"3:45",m:"Hard",lk:false},
  {id:4,t:"Velvet Smoke",p:"LoopAlchemist",bpm:78,k:"Eb",cy:18,d:"4:02",m:"Smooth",lk:false},
  {id:5,t:"Neon Bodega",p:"CrateDigga",bpm:96,k:"Gm",cy:45,d:"3:12",m:"Boom Bap",lk:true},
  {id:6,t:"Ghost Protocol",p:"PhantomProd",bpm:130,k:"Cm",cy:89,d:"3:33",m:"Aggressive",lk:false},
];

const FEED = [
  {id:1,a:"@VoxRebelz",c:"went off on this #cypher",bt:"Trap Cathedral",p:"808Deity",bpm:140,li:2341,co:89,sh:45,lk:false,tp:"cypher",bg:"#1a0a2e"},
  {id:2,a:"@BassArchitect",c:"new heat who wants to spit",bt:"Concrete Dreams",p:"BassArchitect",bpm:88,li:5102,co:234,sh:112,lk:true,tp:"beat",bg:"#0a1628"},
  {id:3,a:"@MicGhost",c:"3am freestyle no cap",bt:"Concrete Dreams",p:"BassArchitect",bpm:88,li:4120,co:156,sh:78,lk:false,tp:"cypher",bg:"#2a1a0a"},
  {id:4,a:"@808Deity",c:"140bpm trap vibes tag a rapper",bt:"Trap Cathedral",p:"808Deity",bpm:140,li:9213,co:445,sh:267,lk:false,tp:"beat",bg:"#1a0000"},
  {id:5,a:"@BarSmith",c:"bodega bars pt 3 #boombap",bt:"Neon Bodega",p:"CrateDigga",bpm:96,li:1560,co:67,sh:23,lk:false,tp:"cypher",bg:"#0a0a1e"},
];

const MS = ["All","Dark","Chill","Hard","Smooth","Boom Bap","Aggressive"];
const fc = n => n>=1e3?(n/1e3).toFixed(1)+"K":String(n);
const ft = s => Math.floor(s/60)+":"+String(s%60).padStart(2,"0");

const engine = {
  ctx:null, playing:false, id:null, timer:null,
  patterns:{
    Dark:{k:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1],s:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],h:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]},
    Chill:{k:[1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],s:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],h:[1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1]},
    Hard:{k:[1,0,0,1,0,0,1,0,0,0,1,1,0,0,1,0],s:[0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],h:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
    Smooth:{k:[1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],s:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],h:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]},
    "Boom Bap":{k:[1,0,0,1,0,0,0,0,1,0,1,0,0,0,0,0],s:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],h:[1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1]},
    Aggressive:{k:[1,0,1,0,0,1,1,0,1,0,0,1,0,1,1,0],s:[0,0,0,0,1,0,0,1,0,0,0,1,1,0,0,1],h:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  },
  playKick(t) {
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.ctx.destination);
if (this.mixDest) g.connect(this.mixDest);
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.12);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.start(t);
    o.stop(t + 0.3);
  },
  playSnare(t) {
    var c = this.ctx;
    var buf = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    var s = c.createBufferSource();
    var g = c.createGain();
    s.buffer = buf;
    s.connect(g);
    g.connect(c.destination);
if (this.mixDest) g.connect(this.mixDest);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    s.start(t);
  },
  playHat(t) {
    var c = this.ctx;
    var buf = c.createBuffer(1, c.sampleRate * 0.03, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    var s = c.createBufferSource();
    var g = c.createGain();
    var f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    s.buffer = buf;
    s.connect(f);
    f.connect(g);
    g.connect(c.destination);
if (this.mixDest) g.connect(this.mixDest);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    s.start(t);
  },
  start(beat) {
    this.stop();
this.mixDest = null;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    var pat = this.patterns[beat.m] || this.patterns.Hard;
    var ms = (60 / beat.bpm / 4) * 1000;
    var step = 0;
    var self = this;
    var tick = function() {
      if (!self.ctx) return;
      var t = self.ctx.currentTime + 0.05;
      var i = step % 16;
      if (pat.k[i]) self.playKick(t);
      if (pat.s[i]) self.playSnare(t);
      if (pat.h[i]) self.playHat(t);
      step++;
    };
    tick();
    this.timer = setInterval(tick, ms);
    this.playing = true;
    this.id = beat.id;
  },
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.ctx) { try { this.ctx.close(); } catch(e) {} this.ctx = null; }
    this.playing = false;
    this.id = null;
  }
};

function MW({s=0}) {
  var b = Array.from({length:32}, function(_, i) { return Math.sin(i*0.4+s)*0.3+Math.random()*0.4+0.15; });
  return (
    <div style={{display:"flex",alignItems:"center",gap:1,height:24}}>
      {b.map(function(v, i) {
        return <div key={i} style={{width:2,height:v*100+"%",borderRadius:1,background:"rgba(0,212,255,"+(0.3+v*0.5)+")"}} />;
      })}
    </div>
  );
}

function MockCamera({rc}) {
  return (
    <div style={{position:"absolute",inset:0,background:"linear-gradient(145deg,#0a0a1a,#0d1520,#0a0a0a)"}}>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{width:80,height:80,borderRadius:"50%",border:"2px solid "+(rc?"rgba(255,59,48,0.4)":"rgba(0,212,255,0.2)"),display:"flex",alignItems:"center",justifyContent:"center",background:rc?"rgba(255,59,48,0.05)":"rgba(0,212,255,0.05)"}}>
          <span style={{fontSize:24}}>{rc ? "\uD83D\uDD34" : "\uD83C\uDFA5"}</span>
        </div>
        <p style={{margin:0,fontSize:12,color:rc?"#ff6b5a":B,fontWeight:700,fontFamily:"monospace"}}>{rc?"Recording...":"Camera Preview"}</p>
        <p style={{margin:0,fontSize:10,color:"#555",fontFamily:"monospace"}}>Demo Mode</p>
      </div>
    </div>
  );
}

function WatchTab({feed, setFeed}) {
  var _useState1 = useState(feed), items = _useState1[0], sI = _useState1[1];
  var _useState2 = useState(0), idx = _useState2[0], sIdx = _useState2[1];
  var _useState3 = useState(null), pan = _useState3[0], sPan = _useState3[1];
  var _useState4 = useState("fy"), ftab = _useState4[0], sFt = _useState4[1];
  var _useState5 = useState(false), ld = _useState5[0], sLd = _useState5[1];
  var _useState6 = useState(false), copied = _useState6[0], sCopied = _useState6[1];
  var _useState7 = useState(false), muted = _useState7[0], sMuted = _useState7[1];
  var lw = useRef(0);
  var ty = useRef(0);
  var started = useRef(false);

  useEffect(function() { sI(feed); sIdx(0); }, [feed]);

  useEffect(function() {
    (async function() {
      try {
        var r = await window.storage.get("cf");
        if (r && r.value) {
          var s = JSON.parse(r.value);
          sI(function(p) { return p.map(function(i) { var f = s.find(function(x) { return x.id === i.id; }); return f ? Object.assign({}, i, {lk: f.lk, li: f.li}) : i; }); });
        }
      } catch(e) {}
      sLd(true);
    })();
  }, []);

  useEffect(function() {
    if (!ld) return;
    (async function() {
      try { await window.storage.set("cf", JSON.stringify(items.map(function(i) { return {id: i.id, lk: i.lk, li: i.li}; }))); } catch(e) {}
    })();
  }, [items, ld]);

  var vis = ftab === "fy" ? items : items.filter(function(i) { return i.lk; });
  var cur = vis[idx] || vis[0];

  useEffect(function() {
    if (!cur || muted || !started.current || cur.vid) return;
    var b = BEATS.find(function(x) { return x.t === cur.bt; });
    if (b) engine.start(b); else engine.start({bpm: cur.bpm || 100, m: "Hard"});
    return function() { engine.stop(); };
  }, [idx, ftab, muted]);

  var go = useCallback(function(d) {
    sPan(null);
    if (d === "u" && idx < vis.length - 1) sIdx(function(i) { return i + 1; });
    if (d === "d" && idx > 0) sIdx(function(i) { return i - 1; });
  }, [idx, vis.length]);

  var st = cur ? cur.a + " on CYPHER: " + cur.c + " | Beat: " + cur.bt + " by " + cur.p : "";

  var handleTap = function() {
    if (!started.current) {
      started.current = true;
      if (!muted && cur && !cur.vid) {
        var b = BEATS.find(function(x) { return x.t === cur.bt; });
        if (b) engine.start(b); else engine.start({bpm: cur.bpm || 100, m: "Hard"});
      }
    } else {
      if (cur && cur.vid) return;
      sMuted(function(m) {
        if (!m) { engine.stop(); }
        else if (cur) { var b = BEATS.find(function(x) { return x.t === cur.bt; }); if (b) engine.start(b); else engine.start({bpm: cur.bpm || 100, m: "Hard"}); }
        return !m;
      });
    }
  };

  return (
    <div
      onWheel={function(e) { if (pan) return; var n = Date.now(); if (n - lw.current < 600) return; if (e.deltaY > 20) { go("u"); lw.current = n; } else if (e.deltaY < -20) { go("d"); lw.current = n; } }}
      onTouchStart={function(e) { ty.current = e.touches[0].clientY; }}
      onTouchEnd={function(e) { var d = ty.current - e.changedTouches[0].clientY; if (Math.abs(d) > 60) go(d > 0 ? "u" : "d"); }}
      onClick={handleTap}
      style={{position:"absolute",inset:0,overflow:"hidden",fontFamily:"monospace"}}
    >
      <div style={{position:"absolute",inset:0,background:cur?cur.bg:"#000",transition:"background 0.5s"}} />
      {cur && cur.vid ? <video src={cur.vid} autoPlay loop playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:2}} /> : null}

      {muted && started.current && (
        <div style={{position:"absolute",top:50,right:14,zIndex:20,background:"rgba(0,0,0,0.5)",borderRadius:20,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:14}}>{"\uD83D\uDD07"}</span>
          <span style={{fontSize:10,color:"#999"}}>Muted</span>
        </div>
      )}

      {vis.length === 0 && (
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#666",zIndex:5}}>
          <p style={{fontSize:48,margin:"0 0 10px"}}>{"\u2606"}</p>
          <p style={{fontSize:14,fontWeight:700}}>No starred posts yet</p>
          <p style={{fontSize:12,color:"#444",margin:"4px 0 0"}}>Star some videos and they will show up here</p>
        </div>
      )}

      <div style={{position:"absolute",top:14,left:0,right:0,zIndex:15,display:"flex",justifyContent:"center",gap:20}} onClick={function(e) { e.stopPropagation(); }}>
        {[["fy","For You"],["fw","Following"]].map(function(arr) {
          var k = arr[0], l = arr[1];
          return <button key={k} onClick={function() { sFt(k); sIdx(0); }} style={{background:"none",border:"none",color:ftab===k?"#fff":"#666",fontSize:14,fontWeight:ftab===k?800:600,fontFamily:"monospace",borderBottom:ftab===k?"2px solid "+B:"2px solid transparent",paddingBottom:4,cursor:"pointer"}}>{l}</button>;
        })}
      </div>

      {cur && (
        <div style={{position:"absolute",right:12,bottom:20,zIndex:15,display:"flex",flexDirection:"column",alignItems:"center",gap:12}} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{width:44,height:44,borderRadius:"50%",background:BG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#000"}}>{(cur.a[1]||"?").toUpperCase()}</div>

          <button onClick={function() { var up = function(p) { return p.map(function(i) { return i.id===cur.id ? Object.assign({}, i, {lk:!i.lk, li:i.lk?i.li-1:i.li+1}) : i; }); }; sI(up); setFeed(up); }} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <span style={{fontSize:38,color:cur.lk?B:"#666"}}>{cur.lk?"\u2605":"\u2606"}</span>
            <span style={{fontSize:11,color:"#fff",fontWeight:700}}>{fc(cur.li)}</span>
          </button>

          <button onClick={function() { sPan("c"); }} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <span style={{fontSize:28}}>{"\uD83D\uDCAC"}</span>
            <span style={{fontSize:11,color:"#fff",fontWeight:700}}>{fc(cur.co)}</span>
          </button>

          <button onClick={function() { sPan("s"); }} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span style={{fontSize:11,color:"#fff",fontWeight:700}}>{fc(cur.sh)}</span>
          </button>
        </div>
      )}

      {cur && (
        <div style={{position:"absolute",bottom:16,left:14,right:70,zIndex:15}} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:16,fontWeight:900,color:"#fff"}}>{cur.a}</span>
            <span style={{fontSize:9,padding:"3px 8px",borderRadius:4,fontWeight:700,textTransform:"uppercase",background:cur.tp==="cypher"?"rgba(255,59,48,0.2)":"rgba(0,212,255,0.15)",color:cur.tp==="cypher"?"#ff6b5a":B}}>{cur.tp}</span>
            {cur.isNew && <span style={{fontSize:9,padding:"3px 8px",borderRadius:4,fontWeight:700,textTransform:"uppercase",background:"rgba(52,199,89,0.2)",color:"#34C759",border:"1px solid rgba(52,199,89,0.3)"}}>Your Cypher</span>}
          </div>
          <p style={{margin:"0 0 8px",fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.4}}>{cur.c}</p>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(0,0,0,0.4)",borderRadius:8,padding:"6px 10px"}}>
            <span style={{fontSize:12,color:B,fontWeight:600}}>{"\uD83C\uDFB5"} {cur.bt} - {cur.p}</span>
          </div>
        </div>
      )}

      {vis.length > 1 && (
        <div style={{position:"absolute",right:6,top:"42%",display:"flex",flexDirection:"column",gap:4,zIndex:10}}>
          {vis.map(function(_, i) {
            return <div key={i} style={{width:3,height:i===idx?16:8,borderRadius:2,background:i===idx?B:"rgba(255,255,255,0.2)",transition:"all 0.3s"}} />;
          })}
        </div>
      )}

      {pan === "c" && cur && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:30,background:"rgba(10,10,10,0.97)",borderRadius:"20px 20px 0 0",padding:16}} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontSize:14,fontWeight:800,color:"#fff"}}>{cur.co} Comments</span>
            <button onClick={function() { sPan(null); }} style={{background:"none",border:"none",color:"#666",fontSize:18,cursor:"pointer"}}>X</button>
          </div>
          {["@FireSpitter: this flow is insane","@BeatHead: producer and MC went crazy","@RhymeScholar: that third bar tho..."].map(function(c, i) {
            return <p key={i} style={{margin:"0 0 10px",fontSize:12,color:"#aaa"}}>{c}</p>;
          })}
        </div>
      )}

      {pan === "s" && cur && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:30,background:"rgba(12,12,12,0.98)",backdropFilter:"blur(20px)",borderRadius:"20px 20px 0 0",padding:"12px 20px 20px"}} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{width:40,height:4,borderRadius:2,background:"#333",margin:"0 auto 16px"}} />
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
            <span style={{fontSize:15,fontWeight:800,color:"#fff",letterSpacing:1}}>Share</span>
            <button onClick={function() { sPan(null); }} style={{background:"#1a1a1a",border:"none",color:"#888",fontSize:13,cursor:"pointer",width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>X</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
            {[
              ["\u2709\uFE0F","Email","rgba(74,144,217,0.12)",function() { window.open("mailto:?subject="+encodeURIComponent(cur.bt+" on CYPHER")+"&body="+encodeURIComponent(st)); },true],
              ["\uD83D\uDCAC","Messages","rgba(52,199,89,0.12)",function() { window.open("sms:?body="+encodeURIComponent(st)); },true],
              ["\uD83D\uDFE2","WhatsApp","rgba(37,211,102,0.12)",function() { window.open("https://wa.me/?text="+encodeURIComponent(st)); },true],
              ["X","X/Twitter","rgba(0,212,255,0.12)",function() { window.open("https://x.com/intent/tweet?text="+encodeURIComponent(st)); },true],
              ["\uD83D\uDCCB","Copy Link","rgba(167,139,250,0.12)",function() { try { navigator.clipboard.writeText(st); sCopied(true); setTimeout(function() { sCopied(false); },2000); } catch(e) {} },false],
              ["\uD83D\uDCE4","More","rgba(249,115,22,0.12)",function() { if (navigator.share) { navigator.share({title:cur.bt+" on CYPHER",text:st}).catch(function(){}); } else { try { navigator.clipboard.writeText(st); sCopied(true); setTimeout(function() { sCopied(false); },2000); } catch(e) {} } },false]
            ].map(function(arr, i) {
              var ic = arr[0], lb = arr[1], bg2 = arr[2], fn = arr[3], close = arr[4];
              return (
                <button key={i} onClick={function() { fn(); if (close) sPan(null); }} style={{background:"#141414",border:"1px solid #222",borderRadius:14,cursor:"pointer",padding:"14px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                  <div style={{width:46,height:46,borderRadius:14,background:bg2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:ic==="X"?18:22,fontWeight:ic==="X"?900:400,color:ic==="X"?B:"inherit",fontFamily:ic==="X"?"monospace":"inherit"}}>{ic}</div>
                  <span style={{fontSize:10,color:"#999",fontWeight:600,letterSpacing:0.5}}>{lb}</span>
                </button>
              );
            })}
          </div>
          {copied && (
            <div style={{background:"rgba(0,212,255,0.15)",border:"1px solid rgba(0,212,255,0.3)",borderRadius:10,padding:"10px 16px",marginBottom:12,textAlign:"center"}}>
              <span style={{fontSize:12,fontWeight:700,color:B}}>Copied to clipboard!</span>
            </div>
          )}
          <div style={{background:"#141414",borderRadius:12,padding:"12px 14px",border:"1px solid #1a1a1a"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:36,height:36,borderRadius:10,background:BG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#000",flexShrink:0}}>{(cur.a[1]||"?").toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:12,fontWeight:700,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cur.a} - {cur.c}</p>
                <p style={{margin:"2px 0 0",fontSize:10,color:B}}>{"\uD83C\uDFB5"} {cur.bt} by {cur.p}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function RecScreen({onClose, onPost}) {
  var _s1 = useState(false), rc = _s1[0], sRc = _s1[1];
  var _s2 = useState(0), tm = _s2[0], sTm = _s2[1];
  var _s3 = useState(null), bt = _s3[0], sBt = _s3[1];
  var _s4 = useState(false), bp = _s4[0], sBp = _s4[1];
  var _s5 = useState(false), dn = _s5[0], sDn = _s5[1];
  var _s6 = useState(false), posted = _s6[0], sPosted = _s6[1];
  var vr = useRef(null);
  var sr = useRef(null);
  var tr = useRef(null);
  var mr = useRef(null);
  var chunks = useRef([]);
  var videoBlob = useRef(null);

  useEffect(function() {
    if (DEMO_MODE) return;
    (async function() {
      try {
        var s = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        sr.current = s;
        if (vr.current) { vr.current.srcObject = s; vr.current.play(); }
      } catch(e) {}
    })();
    return function() {
      try { if (sr.current) { sr.current.getTracks().forEach(function(t) { t.stop(); }); sr.current = null; } } catch(e) {}
    };
  }, []);

  var stopCamera = function() {
    try { if (mr.current && mr.current.state === "recording") mr.current.stop(); } catch(e) {}
    try { if (sr.current) { sr.current.getTracks().forEach(function(t) { t.stop(); }); sr.current = null; } } catch(e) {}
  };

  var cls = function() {
    stopCamera();
    clearInterval(tr.current);
    onClose();
  };

  var doPost = function() {
    sPosted(true);
    setTimeout(function() {
      stopCamera();
      sPosted(false);
      if (bt) {
        var url = videoBlob.current ? URL.createObjectURL(videoBlob.current) : null;
        onPost(bt, tm, url);
      } else {
        onClose();
      }
    }, 1500);
  };

  var toggleRec = function() {
    if (rc) {
      sRc(false);
      clearInterval(tr.current);
      if (engine.timer) { clearInterval(engine.timer); engine.timer = null; }
      if (engine.ctx) { try { engine.ctx.close(); } catch(e) {} engine.ctx = null; }
      engine.playing = false;
      engine.id = null;
      engine.mixDest = null;
      if (mr.current && mr.current.state === "recording") {
        mr.current.onstop = function() {
          var blobType = MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4";
          videoBlob.current = new Blob(chunks.current, {type: blobType});
          sDn(true);
        };
        mr.current.stop();
      } else {
        sDn(true);
      }
 } else {
      sRc(true);
      sTm(0);
      sDn(false);
      chunks.current = [];
      videoBlob.current = null;

      var mixCtx = new (window.AudioContext || window.webkitAudioContext)();
      var mixDest = mixCtx.createMediaStreamDestination();

      if (sr.current) {
        var micSource = mixCtx.createMediaStreamSource(sr.current);
        var micGain = mixCtx.createGain();
        micGain.gain.value = 1.0;
        micSource.connect(micGain);
        micGain.connect(mixDest);
      }

      if (bt) {
        engine.stop();
        engine.ctx = mixCtx;
        engine.mixDest = mixDest;
        var pat = engine.patterns[bt.m] || engine.patterns.Hard;
        var ms = (60 / bt.bpm / 4) * 1000;
        var step = 0;
        engine.timer = setInterval(function() {
          if (!engine.ctx) return;
          var t = engine.ctx.currentTime + 0.05;
          var i = step % 16;
          if (pat.k[i]) engine.playKick(t);
          if (pat.s[i]) engine.playSnare(t);
          if (pat.h[i]) engine.playHat(t);
          step++;
        }, ms);
        engine.playing = true;
        engine.id = bt.id;
      }

      var combinedStream = new MediaStream();
      if (sr.current) {
        sr.current.getVideoTracks().forEach(function(t) { combinedStream.addTrack(t); });
      }
      mixDest.stream.getAudioTracks().forEach(function(t) { combinedStream.addTrack(t); });

      try {
        var mimeType = MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4";
        mr.current = new MediaRecorder(combinedStream, {mimeType: mimeType});
        mr.current.ondataavailable = function(e) { if (e.data.size > 0) chunks.current.push(e.data); };
        mr.current.start(100);
      } catch(e) {}

      tr.current = setInterval(function() { sTm(function(t) { return t + 1; }); }, 1000);
    }
  };
  return (
    <div style={{position:"absolute",inset:0,background:"#000",zIndex:80,fontFamily:"monospace"}}>
      {DEMO_MODE ? <MockCamera rc={rc} /> : <video ref={vr} autoPlay playsInline muted style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}} />}

      <div style={{position:"absolute",top:0,left:0,right:0,height:100,background:"linear-gradient(to bottom,rgba(0,0,0,0.7),transparent)",zIndex:2}} />
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:200,background:"linear-gradient(to top,rgba(0,0,0,0.8),transparent)",zIndex:2}} />

      <div style={{position:"absolute",top:16,left:16,right:16,zIndex:10,display:"flex",justifyContent:"space-between"}}>
        <button onClick={cls} style={{background:"rgba(0,0,0,0.5)",border:"none",color:"#fff",fontSize:20,width:44,height:44,borderRadius:"50%",cursor:"pointer"}}>X</button>
        {rc && (
          <div style={{background:"rgba(255,59,48,0.3)",border:"1px solid #ff3b30",borderRadius:20,padding:"6px 16px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#ff3b30",animation:"pu 1s infinite"}} />
            <span style={{color:"#ff3b30",fontWeight:800,fontSize:14}}>{ft(tm)}</span>
          </div>
        )}
        <div style={{width:44}} />
      </div>

      {bt && (
        <div style={{position:"absolute",bottom:180,left:16,right:80,zIndex:10,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(10px)",borderRadius:12,padding:"10px 14px",border:"1px solid rgba(0,212,255,0.2)"}}>
          <p style={{margin:0,fontSize:13,fontWeight:800,color:B}}>{bt.t}</p>
          <p style={{margin:"2px 0 0",fontSize:10,color:"#999"}}>{bt.p} - {bt.bpm} BPM</p>
        </div>
      )}

      {posted && (
        <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",zIndex:30,background:"rgba(0,212,255,0.15)",border:"1px solid rgba(0,212,255,0.3)",borderRadius:16,padding:"20px 32px",textAlign:"center"}}>
          <p style={{margin:0,fontSize:24}}>{"✅"}</p>
          <p style={{margin:"8px 0 0",fontSize:14,fontWeight:800,color:B}}>Cypher Posted!</p>
        </div>
      )}

      <div style={{position:"absolute",bottom:50,left:0,right:0,zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        {!bp && !dn && !posted && (
          <button onClick={function() { sBp(true); }} style={{background:"rgba(0,212,255,0.15)",border:"1px solid rgba(0,212,255,0.4)",borderRadius:20,padding:"8px 20px",color:B,fontSize:12,fontWeight:700,cursor:"pointer"}}>
            {bt ? "Change Beat" : "Choose a Beat"}
          </button>
        )}

        {dn && !posted ? (
          <div style={{display:"flex",gap:16}}>
            <button onClick={function() { sDn(false); sTm(0); videoBlob.current = null; }} style={{background:"rgba(255,255,255,0.1)",border:"1px solid #555",borderRadius:12,padding:"12px 24px",color:"#ccc",fontSize:14,cursor:"pointer"}}>Retake</button>
            <button onClick={doPost} style={{background:B,border:"none",borderRadius:12,padding:"12px 32px",color:"#000",fontSize:14,fontWeight:800,cursor:"pointer"}}>Post Cypher</button>
          </div>
        ) : !dn && !posted ? (
          <button onClick={toggleRec} style={{width:76,height:76,borderRadius:"50%",background:rc?"transparent":"#ff3b30",border:rc?"4px solid #ff3b30":"4px solid rgba(255,255,255,0.3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {rc ? <div style={{width:26,height:26,borderRadius:6,background:"#ff3b30"}} /> : <div style={{width:60,height:60,borderRadius:"50%",background:"#ff3b30"}} />}
          </button>
        ) : null}
      </div>

      {bp && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:20,background:"rgba(10,10,10,0.95)",borderRadius:"20px 20px 0 0",maxHeight:"50%",overflowY:"auto",padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontSize:15,fontWeight:800,color:"#fff"}}>Choose a Beat</span>
            <button onClick={function() { sBp(false); }} style={{background:"none",border:"none",color:"#666",fontSize:18,cursor:"pointer"}}>X</button>
          </div>
          {BEATS.map(function(b) {
            return (
              <button key={b.id} onClick={function() { sBt(b); sBp(false); }} style={{width:"100%",background:bt && bt.id===b.id?"rgba(0,212,255,0.1)":"#141414",border:"1px solid "+(bt && bt.id===b.id?"rgba(0,212,255,0.3)":"#1a1a1a"),borderRadius:10,padding:12,marginBottom:8,cursor:"pointer",display:"flex",justifyContent:"space-between",textAlign:"left"}}>
                <div>
                  <p style={{margin:0,fontSize:13,fontWeight:700,color:"#eee"}}>{b.t}</p>
                  <p style={{margin:"2px 0 0",fontSize:10,color:"#666"}}>{b.p}</p>
                </div>
                <span style={{fontSize:10,color:"#555"}}>{b.bpm} BPM</span>
              </button>
            );
          })}
        </div>
      )}

      <style>{`@keyframes pu{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}


function BeatsTab() {
  var _s1 = useState(null), sel = _s1[0], sSel = _s1[1];
  var _s2 = useState(false), pl = _s2[0], sPl = _s2[1];
  var _s3 = useState(null), cid = _s3[0], sCid = _s3[1];
  var _s4 = useState("All"), mo = _s4[0], sMo = _s4[1];
  var _s5 = useState(BEATS), bts = _s5[0], sBts = _s5[1];
  var _s6 = useState(false), upl = _s6[0], sUpl = _s6[1];
  var _s7 = useState(""), sch = _s7[0], sSch = _s7[1];
  var _s8 = useState(null), uf = _s8[0], sUf = _s8[1];
var _s10 = useState(null), vf = _s10[0], sVf = _s10[1];
  var _s9 = useState(false), ld = _s9[0], sLd = _s9[1];
  var fr = useRef(null);
var vfr = useRef(null);

  useEffect(function() {
    (async function() {
      try {
        var r = await window.storage.get("cb");
        if (r && r.value) {
          var s = JSON.parse(r.value);
          sBts(function(p) { return p.map(function(b) { var f = s.find(function(x) { return x.id === b.id; }); return f ? Object.assign({}, b, {lk: f.lk}) : b; }); });
        }
      } catch(e) {}
      sLd(true);
    })();
  }, []);

  useEffect(function() {
    if (!ld) return;
    (async function() {
      try { await window.storage.set("cb", JSON.stringify(bts.map(function(b) { return {id: b.id, lk: b.lk}; }))); } catch(e) {}
    })();
  }, [bts, ld]);

  var fl = bts.filter(function(b) {
    return (mo === "All" || b.m === mo) && (!sch || b.t.toLowerCase().includes(sch.toLowerCase()) || b.p.toLowerCase().includes(sch.toLowerCase()));
  });

  var tP = function(id) {
    var beat = bts.find(function(b) { return b.id === id; });
    if (cid === id && pl) { sPl(false); sCid(null); engine.stop(); }
    else { sPl(true); sCid(id); if (beat) engine.start(beat); }
  };

  var cb = bts.find(function(b) { return b.id === cid; });

  return (
    <div style={{position:"absolute",inset:0,background:"#0a0a0a",overflowY:"auto",paddingBottom:80,fontFamily:"monospace"}}>
      <div style={{maxWidth:720,margin:"0 auto",padding:"0 16px"}}>
        <header style={{padding:"20px 0 14px",borderBottom:"1px solid rgba(0,212,255,0.12)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:900,margin:0,background:BG,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CYPHER</h1>
            <p style={{fontSize:9,color:"#666",margin:"3px 0 0",letterSpacing:3,textTransform:"uppercase"}}>Drop beats - Spit bars</p>
          </div>
          <button onClick={function() { sUf(null); sVf(null); sUpl(true); } }style={{background:BG,border:"none",borderRadius:8,padding:"9px 16px",color:"#0a0a0a",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>+ Upload</button>
        </header>

        <div style={{margin:"14px 0 10px"}}>
          <input type="text" placeholder="Search beats..." value={sch} onChange={function(e) { sSch(e.target.value); }} style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",background:"#111",border:"1px solid #222",borderRadius:8,color:"#ccc",fontSize:12,fontFamily:"inherit",outline:"none"}} />
          <div style={{display:"flex",gap:5,margin:"8px 0",flexWrap:"wrap"}}>
            {MS.map(function(m) {
              return <button key={m} onClick={function() { sMo(m); }} style={{background:mo===m?"rgba(0,212,255,0.15)":"#111",border:"1px solid "+(mo===m?"rgba(0,212,255,0.4)":"#222"),borderRadius:20,padding:"5px 12px",fontSize:10,color:mo===m?B:"#666",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{m}</button>;
            })}
          </div>
        </div>

        {sel && (
          <div onClick={function() { sSel(null); }} style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,0.6)",overflowY:"auto"}}>
            <div onClick={function(e) { e.stopPropagation(); }} style={{maxWidth:720,margin:"80px auto",padding:"0 16px 100px"}}>
              <button onClick={function() { sSel(null); }} style={{background:"none",border:"none",backgroundImage:BG,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",cursor:"pointer",fontSize:13,fontWeight:700,padding:"8px 0",fontFamily:"inherit"}}>Back to beats</button>
              <div style={{background:"#141414",borderRadius:16,padding:24,marginTop:8,border:"1px solid #1a1a1a"}}>
                <h2 style={{fontSize:22,fontWeight:900,margin:0,color:"#fff"}}>{sel.t}</h2>
                <p style={{color:B,fontSize:12,margin:"4px 0 16px"}}>{sel.p} - {sel.bpm} BPM - {sel.k}</p>
                <div style={{display:"flex",gap:12}}>
                  <button onClick={function() { tP(sel.id); }} style={{width:50,height:50,borderRadius:"50%",background:pl&&cid===sel.id?"rgba(0,212,255,0.2)":BG,border:pl&&cid===sel.id?"2px solid "+B:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:pl&&cid===sel.id?B:"#0a0a0a"}}>{pl&&cid===sel.id?"\u23F8":"\u25B6"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {fl.map(function(b) {
            return (
              <div key={b.id} style={{background:cid===b.id?"#111a20":"#111",borderRadius:12,padding:14,border:"1px solid "+(cid===b.id?"rgba(0,212,255,0.25)":"#1a1a1a"),cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <button onClick={function(e) { e.stopPropagation(); tP(b.id); }} style={{width:42,height:42,borderRadius:"50%",flexShrink:0,background:pl&&cid===b.id?"rgba(0,212,255,0.15)":"#1a1a1a",border:"1px solid "+(pl&&cid===b.id?"rgba(0,212,255,0.5)":"#2a2a2a"),cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",color:pl&&cid===b.id?B:"#888"}}>{pl&&cid===b.id?"\u23F8":"\u25B6"}</button>
                  <div style={{flex:1,minWidth:0}} onClick={function() { sSel(b); }}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <h3 style={{fontSize:14,fontWeight:800,margin:0,color:"#eee"}}>{b.t}</h3>
                      <span style={{fontSize:10,color:"#555"}}>{b.d}</span>
                    </div>
                    <div style={{margin:"5px 0"}}><MW s={b.id*2.5} /></div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",gap:6}}>
                        <span style={{fontSize:11,color:B,fontWeight:600}}>{b.p}</span>
                        <span style={{fontSize:9,color:"#444",background:"#1a1a1a",padding:"2px 6px",borderRadius:4}}>{b.bpm}</span>
                        <span style={{fontSize:9,color:"#444",background:"#1a1a1a",padding:"2px 6px",borderRadius:4}}>{b.k}</span>
                        <span style={{fontSize:9,color:"#555",background:"rgba(0,212,255,0.08)",padding:"2px 6px",borderRadius:4}}>{b.m}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:22,color:"#555"}}>{b.cy} {"\uD83C\uDFA4"}</span>
                        <button onClick={function(e) { e.stopPropagation(); sBts(function(p) { return p.map(function(x) { return x.id===b.id ? Object.assign({}, x, {lk: !x.lk}) : x; }); }); }} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:b.lk?B:"#333"}}>{b.lk?"\u2605":"\u2606"}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {fl.length === 0 && <div style={{textAlign:"center",padding:40,color:"#444"}}>No beats found.</div>}
        </div>
      </div>

      {upl && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={function() { sUpl(false); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{background:"#111",borderRadius:16,padding:24,maxWidth:420,width:"100%",border:"1px solid #222"}}>
            <h2 style={{fontSize:18,fontWeight:900,margin:"0 0 18px",color:"#fff"}}>Upload Beat</h2>
            <input ref={fr} type="file" accept=".mp3,.wav,.flac" style={{display:"none"}} onChange={function(e) { if (e.target.files[0]) sUf(e.target.files[0]); }} />
            <div onClick={function() { if (fr.current) fr.current.click(); }} style={{border:"2px dashed #333",borderRadius:12,padding:28,textAlign:"center",marginBottom:14,cursor:"pointer"}}>
              {uf ? <p style={{margin:0,fontSize:12,color:B,fontWeight:700}}>{uf.name}</p> : <p style={{margin:0,fontSize:12,color:"#666"}}>Drop beat or click to browse</p>}
            </div>
<input ref={vfr} type="file" accept=".mp4,.mov,.webm" style={{display:"none"}} onChange={function(e) { if (e.target.files[0]) sVf(e.target.files[0]); }} />
            <div onClick={function() { if (vfr.current) vfr.current.click(); }} style={{border:"2px dashed #222",borderRadius:12,padding:20,textAlign:"center",marginBottom:14,cursor:"pointer"}}>
              {vf ? <p style={{margin:0,fontSize:12,color:B,fontWeight:700}}>{"\uD83C\uDFA5"} {vf.name}</p> : <p style={{margin:0,fontSize:12,color:"#555"}}>Add a video (optional) - click to browse</p>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <input placeholder="Beat title" style={{background:"#0a0a0a",border:"1px solid #222",borderRadius:8,padding:"10px 12px",color:"#ccc",fontSize:12,fontFamily:"inherit",outline:"none"}} />
              <div style={{display:"flex",gap:8}}>
                <input placeholder="BPM" style={{background:"#0a0a0a",border:"1px solid #222",borderRadius:8,padding:"10px 12px",color:"#ccc",fontSize:12,fontFamily:"inherit",outline:"none",flex:1}} />
                <input placeholder="Key" style={{background:"#0a0a0a",border:"1px solid #222",borderRadius:8,padding:"10px 12px",color:"#ccc",fontSize:12,fontFamily:"inherit",outline:"none",flex:1}} />
              </div>
              <button style={{background:BG,border:"none",borderRadius:10,padding:13,color:"#0a0a0a",fontWeight:800,fontSize:13,cursor:"pointer",textTransform:"uppercase"}}>Upload Beat</button>
            </div>
          </div>
        </div>
      )}

      {cb && (
        <div style={{position:"fixed",bottom:62,left:0,right:0,background:"rgba(15,15,15,0.98)",borderTop:"1px solid rgba(0,212,255,0.15)",padding:"10px 14px",zIndex:50}}>
          <div style={{maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",gap:12}}>
            <button onClick={function() { tP(cb.id); }} style={{width:36,height:36,borderRadius:"50%",background:"rgba(0,212,255,0.15)",border:"1px solid rgba(0,212,255,0.3)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",color:B}}>{pl?"\u23F8":"\u25B6"}</button>
            <div style={{flex:1}}>
              <p style={{margin:0,fontSize:12,fontWeight:700,color:"#eee"}}>{cb.t}</p>
              <p style={{margin:0,fontSize:10,color:"#666"}}>{cb.p} - {cb.bpm} BPM</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function App() {
  var _s1 = useState("watch"), tab = _s1[0], sTab = _s1[1];
  var _s2 = useState(false), rec = _s2[0], sRec = _s2[1];
  var _s3 = useState(FEED), feed = _s3[0], setFeed = _s3[1];

  useEffect(function() {
    (async function() {
      try { var r = await window.storage.get("ct"); if (r && r.value) sTab(r.value); } catch(e) {}
    })();
  }, []);

  var sw = function(t) {
    engine.stop();
    sTab(t);
    (async function() { try { await window.storage.set("ct", t); } catch(e) {} })();
  };

  var onPost = function(beat, duration, videoUrl) {
    var newPost = {id: Date.now(), a: "@You", c: "new cypher - " + beat.t, bt: beat.t, p: beat.p, bpm: beat.bpm, li: 0, co: 0, sh: 0, lk: false, tp: "cypher", bg: "#0a1a2e", isNew: true, vid: videoUrl};
    setFeed(function(f) { return [newPost].concat(f); });
    sRec(false);
    sTab("watch");
  };

  return (
    <div style={{width:"100%",maxWidth:480,height:"100vh",margin:"0 auto",background:"#000",position:"relative",overflow:"hidden",fontFamily:"monospace",color:"#e8e8e8"}}>
      {rec && <RecScreen onClose={function() { sRec(false); }} onPost={onPost} />}
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:62}}>
        {tab === "watch" && <WatchTab feed={feed} setFeed={setFeed} />}
        {tab === "beats" && <BeatsTab />}
      </div>
      {!rec && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:62,background:"rgba(10,10,10,0.97)",borderTop:"1px solid #1a1a1a",display:"flex",alignItems:"center",zIndex:60}}>
          <button onClick={function() { sw("watch"); }} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 0",color:tab==="watch"?B:"#555",fontFamily:"inherit"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase"}}>Watch</span>
          </button>
          <div style={{flex:1,display:"flex",justifyContent:"center"}}>
            <button onClick={function() { engine.stop(); sRec(true); }} style={{width:50,height:50,borderRadius:14,background:BG,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(0,212,255,0.3)"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#000" stroke="none"><rect x="8" y="2" width="8" height="11" rx="4" /><path d="M6 11v1a6 6 0 0012 0v-1" stroke="#000" strokeWidth="2" fill="none" /><line x1="12" y1="18" x2="12" y2="22" stroke="#000" strokeWidth="2" /></svg>
            </button>
          </div>
          <button onClick={function() { sw("beats"); }} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 0",color:tab==="beats"?B:"#555",fontFamily:"inherit"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
            <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase"}}>Beats</span>
          </button>
        </div>
      )}
    </div>
  );
}
