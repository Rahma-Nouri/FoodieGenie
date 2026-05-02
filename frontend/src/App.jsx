import { useState, useRef, useEffect } from "react";
import axios from "axios";

// ─── Web Audio Sound Effects ──────────────────────────────────────────────────
function getCtx(ref) {
  if (!ref.current) ref.current = new (window.AudioContext || window.webkitAudioContext)();
  return ref.current;
}

function playMagicSound(ctx) {
  const now = ctx.currentTime;

  // Deep mysterious drone
  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = "sine";
  drone.frequency.setValueAtTime(80, now);
  drone.frequency.linearRampToValueAtTime(95, now + 3);
  droneGain.gain.setValueAtTime(0, now);
  droneGain.gain.linearRampToValueAtTime(0.18, now + 0.4);
  droneGain.gain.linearRampToValueAtTime(0.08, now + 3);
  drone.connect(droneGain); droneGain.connect(ctx.destination);
  drone.start(now); drone.stop(now + 3);

  // Eerie rising tone
  const rise = ctx.createOscillator();
  const riseGain = ctx.createGain();
  rise.type = "triangle";
  rise.frequency.setValueAtTime(200, now + 0.5);
  rise.frequency.exponentialRampToValueAtTime(800, now + 2.5);
  riseGain.gain.setValueAtTime(0, now + 0.5);
  riseGain.gain.linearRampToValueAtTime(0.12, now + 1);
  riseGain.gain.linearRampToValueAtTime(0, now + 2.8);
  rise.connect(riseGain); riseGain.connect(ctx.destination);
  rise.start(now + 0.5); rise.stop(now + 3);

  // Mystical shimmer pings
  [0.2, 0.6, 1.0, 1.5, 2.0, 2.4].forEach((t, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const freq = [440, 554, 659, 880, 1108, 1320][i];
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, now + t);
    g.gain.linearRampToValueAtTime(0.09, now + t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.6);
    o.connect(g); g.connect(ctx.destination);
    o.start(now + t); o.stop(now + t + 0.7);
  });

  // Low rumble
  const rumble = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  rumble.type = "sawtooth";
  rumble.frequency.value = 40;
  rumbleGain.gain.setValueAtTime(0, now);
  rumbleGain.gain.linearRampToValueAtTime(0.06, now + 0.8);
  rumbleGain.gain.linearRampToValueAtTime(0, now + 2.5);
  rumble.connect(rumbleGain); rumbleGain.connect(ctx.destination);
  rumble.start(now); rumble.stop(now + 2.5);
}

function playRevealSound(ctx) {
  const now = ctx.currentTime;
  [523, 784, 1047, 1568, 2093].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const t = now + i * 0.1;
    osc.type = "triangle";
    osc.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.04);
    g.gain.linearRampToValueAtTime(0, t + 0.35);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}

// ─── Food Types ───────────────────────────────────────────────────────────────
const FOOD_TYPES = [
  { id: "sweet",  label: "Sweet",  emoji: "🍰" },
  { id: "salty",  label: "Salty",  emoji: "🧂" },
  { id: "juice",  label: "Juice",  emoji: "🥤" },
  { id: "spicy",  label: "Spicy",  emoji: "🌶️" },
];

const MAGIC_PARTICLES = ["🍕", "🍔", "🌮", "🍜", "🍣", "🧁", "🍓", "🥑", "🍩", "🌶️", "🧀", "🥐"];

const RATINGS = [
  { emoji: "🤢", label: "No way..." },
  { emoji: "😐", label: "Meh..." },
  { emoji: "😋", label: "Actually good!" },
  { emoji: "🤩", label: "WISH GRANTED!" },
  { emoji: "🔥", label: "MAGIC!!" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Nunito:wght@500;700;800;900&display=swap');

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --gold:    #C9A227;
  --gold2:   #E8C458;
  --gold3:   #F5DFA0;
  --gold4:   #FFF5D6;
  --pink:    #FF7AC6;
  --pink2:   #FFB3E6;
  --pink3:   #FFE0F5;
  --pink4:   #FFF0FA;
  --rose:    #E85D9B;
  --purple:  #C084FC;
  --text:    #7A3B5E;
  --text2:   #A05070;
  --muted:   #C49BAA;
}

body {
  font-family: 'Nunito', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--text);
  background: linear-gradient(-45deg, #FFE8F7, #FFD0EE, #FFBCE6, #FFC8F0, #FFD8F5);
  background-size: 400% 400%;
  animation: gradientMove 10s ease infinite;
}

@keyframes gradientMove {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ── Floating sparkles bg ── */
.sparkle-field {
  position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
}
.sparkle {
  position: absolute;
  font-size: 1rem;
  animation: sparkleDrift var(--dur, 6s) ease-in-out infinite var(--delay, 0s);
  opacity: 0.4;
}
@keyframes sparkleDrift {
  0%   { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50%  { transform: translateY(-18px) rotate(180deg); opacity: 0.7; }
  100% { transform: translateY(0) rotate(360deg); opacity: 0.3; }
}

/* Soft glow orbs */
.orb {
  position: fixed; border-radius: 50%;
  filter: blur(70px); pointer-events: none; z-index: 0;
}
.orb1 { width:400px;height:400px;background:rgba(255,122,198,0.18);top:-100px;left:-80px;animation:orbDrift 12s ease-in-out infinite; }
.orb2 { width:350px;height:350px;background:rgba(201,162,39,0.13);bottom:-80px;right:-80px;animation:orbDrift 10s ease-in-out infinite reverse; }
.orb3 { width:300px;height:300px;background:rgba(192,132,252,0.12);top:35%;left:30%;animation:orbDrift 14s ease-in-out infinite 3s; }

@keyframes orbDrift {
  0%,100% { transform:translate(0,0) scale(1); }
  33%      { transform:translate(30px,-20px) scale(1.05); }
  66%      { transform:translate(-20px,15px) scale(0.95); }
}

/* ── Page wrapper ── */
.page { position:relative; z-index:1; min-height:100vh; padding:0 0 70px; }
.inner { max-width: 100%; margin:0; padding: 0 20px 0; }

/* ── Title area ── */
.title-area { 
  text-align:center; margin-bottom:36px; 
  width: 100%;
  margin-bottom: 36px;
}

.lamp-icon {
  font-size:4.5rem;
  display:block;
  margin-bottom:10px;
  filter: drop-shadow(0 4px 16px rgba(201,162,39,0.4));
  animation: lampGlow 2.8s ease-in-out infinite;
}
@keyframes lampGlow {
  0%,100% { transform:rotate(-5deg) scale(1); filter:drop-shadow(0 4px 16px rgba(201,162,39,0.4)); }
  50%      { transform:rotate(5deg) scale(1.08); filter:drop-shadow(0 4px 28px rgba(201,162,39,0.7)); }
}

.site-title-line1 {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 900;
  font-size: clamp(2.5rem, 6.5vw, 7rem);
  line-height: 1.05;
  background: linear-gradient(135deg, var(--gold) 0%, var(--rose) 50%, var(--gold2) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  white-space: normal;
  word-break: break-word;
}

/* ── Section label ── */
.slabel {
  font-size:0.72rem;
  text-transform:uppercase;
  letter-spacing:3px;
  color:var(--muted);
  font-weight:900;
  margin-bottom:14px;
  text-align:center;
}

/* ── Food type buttons ── */
.food-types {
  display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:28px;
}
.ft-btn {
  display:flex; flex-direction:column; align-items:center; gap:5px;
  padding:12px 18px; border-radius:20px;
  border:2px solid rgba(201,162,39,0.2);
  background:rgba(255,255,255,0.55);
  color:var(--muted);
  cursor:pointer;
  font-family:'Nunito',sans-serif; font-weight:800; font-size:0.82rem;
  transition:all 0.22s ease;
  min-width:80px;
  backdrop-filter: blur(8px);
}
.ft-btn .fe { font-size:1.9rem; }
.ft-btn:hover { transform:translateY(-4px); background:rgba(255,255,255,0.75); color:var(--text); box-shadow:0 6px 18px rgba(201,162,39,0.2); }
.ft-btn.active {
  border-color:var(--gold);
  background:linear-gradient(135deg, rgba(255,245,214,0.9), rgba(255,224,250,0.9));
  color:var(--gold);
  transform:translateY(-4px) scale(1.06);
  box-shadow:0 8px 24px rgba(201,162,39,0.3);
}

/* ── Sliders ── */
.sliders { display:flex; gap:16px; margin-bottom:28px; flex-wrap:wrap; }
.slider-card {
  flex:1; min-width:190px;
  background:rgba(255,255,255,0.6);
  border:1.5px solid rgba(201,162,39,0.25);
  border-radius:20px; padding:18px;
  backdrop-filter:blur(8px);
}
.slider-top { display:flex; justify-content:space-between; margin-bottom:12px; }
.slider-name { font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; color:var(--muted); font-weight:900; }
.slider-val {
  font-family:'Cinzel Decorative',cursive;
  font-size:1.1rem; color:var(--gold);
}
input[type=range] {
  width:100%; -webkit-appearance:none; height:5px;
  background:rgba(201,162,39,0.15); border-radius:3px; outline:none;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance:none; width:22px; height:22px; border-radius:50%;
  background:linear-gradient(135deg,var(--gold),var(--pink));
  cursor:pointer; box-shadow:0 2px 10px rgba(201,162,39,0.45);
}

/* ── Generate button ── */
.gen-btn-wrap { display:flex; justify-content:center; margin-top:8px; }
.gen-btn {
  background:linear-gradient(135deg, var(--gold) 0%, var(--rose) 60%, var(--gold2) 100%);
  color:#fff;
  border:none; border-radius:24px;
  padding:20px 48px;
  font-family:'Cinzel Decorative',cursive;
  font-size:1.05rem; font-weight:900;
  cursor:pointer;
  position:relative; overflow:hidden;
  box-shadow:0 8px 30px rgba(201,162,39,0.4), 0 2px 8px rgba(232,93,155,0.25);
  transition:transform 0.2s, box-shadow 0.2s;
  letter-spacing:0.5px;
  width:100%; max-width:400px;
  text-shadow: 0 1px 4px rgba(120,40,0,0.2);
}
.gen-btn::after {
  content:'';
  position:absolute; top:0; left:-100%; width:100%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);
  transition:left 0.5s;
}
.gen-btn:hover::after { left:100%; }
.gen-btn:hover:not(:disabled) { transform:translateY(-3px) scale(1.02); box-shadow:0 14px 40px rgba(201,162,39,0.5); }
.gen-btn:disabled { opacity:0.65; cursor:not-allowed; }

.error-box {
  background:rgba(255,200,200,0.4); border:1.5px solid rgba(232,93,155,0.4);
  color:var(--rose); border-radius:14px; padding:12px 16px;
  font-weight:700; font-size:0.88rem; margin-top:16px; text-align:center;
}

/* ── MAGIC LOADING OVERLAY ── */
.magic-overlay {
  position:fixed; inset:0;
  background:linear-gradient(135deg, rgba(255,220,245,0.97) 0%, rgba(255,245,215,0.97) 100%);
  z-index:200;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  animation:fadeIn 0.35s ease;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }

/* ── Magic Lamp Animation ── */
.lamp-stage {
  position:relative;
  width:220px; height:240px;
  margin-bottom:30px;
  display:flex; align-items:flex-end; justify-content:center;
}

.magic-lamp-emoji {
  font-size:6rem;
  display:block;
  filter: drop-shadow(0 4px 20px rgba(201,162,39,0.6));
  animation: lampWobble 1.4s ease-in-out infinite;
  transform-origin: bottom center;
  position:relative; z-index:2;
}
@keyframes lampWobble {
  0%   { transform: rotate(-12deg) scale(1); }
  25%  { transform: rotate(8deg) scale(1.06); }
  50%  { transform: rotate(-6deg) scale(1.02); }
  75%  { transform: rotate(10deg) scale(1.07); }
  100% { transform: rotate(-12deg) scale(1); }
}

/* smoke puffs coming from lamp spout */
.smoke-wrap {
  position:absolute;
  bottom:80px; left:50%;
  transform:translateX(-20px);
  width:0; height:0;
  pointer-events:none;
}
.puff {
  position:absolute;
  border-radius:50%;
  animation: puffRise var(--dur, 1.8s) ease-out infinite var(--delay, 0s);
  opacity:0;
}
@keyframes puffRise {
  0%   { opacity:0; transform:translate(var(--tx,0px), 0) scale(0.3); }
  20%  { opacity:0.7; }
  80%  { opacity:0.3; }
  100% { opacity:0; transform:translate(calc(var(--tx,0px) * 1.5), -140px) scale(1.8); }
}

/* floating sparkle particles */
.float-particle {
  position:absolute;
  font-size:1.4rem;
  animation:floatUp var(--dur,2s) ease-out infinite var(--delay,0s);
  pointer-events:none;
}
@keyframes floatUp {
  0%   { opacity:0; transform:translate(var(--tx,0px), 0) scale(0.5) rotate(0deg); }
  30%  { opacity:1; }
  100% { opacity:0; transform:translate(calc(var(--tx,0px)*1.6), -160px) scale(1.1) rotate(360deg); }
}

.magic-title {
  font-family:'Cinzel Decorative',cursive;
  font-size:1.5rem; color:var(--gold);
  text-align:center; margin-bottom:8px;
  animation:goldPulse 1.4s ease-in-out infinite;
  text-shadow: 0 2px 12px rgba(201,162,39,0.3);
}
@keyframes goldPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.75;transform:scale(0.98)} }

.magic-sub { color:var(--text2); font-size:0.9rem; font-weight:700; text-align:center; margin-bottom:24px; }

.magic-bar-wrap {
  width:240px; height:5px; background:rgba(201,162,39,0.15); border-radius:3px; overflow:hidden;
}
.magic-bar {
  height:100%;
  background:linear-gradient(90deg,var(--gold),var(--pink),var(--gold2));
  border-radius:3px;
  animation:barFlow 2s ease-in-out infinite;
}
@keyframes barFlow {
  0%   { width:0%; margin-left:0; }
  50%  { width:80%; margin-left:0; }
  100% { width:0%; margin-left:100%; }
}

/* ── PAGE 2 ── */
.back-btn {
  background:rgba(255,255,255,0.6);
  border:1.5px solid rgba(201,162,39,0.3);
  color:var(--text2); border-radius:12px;
  padding:8px 16px; font-family:'Nunito',sans-serif; font-weight:700; font-size:0.84rem;
  cursor:pointer; display:inline-flex; align-items:center; gap:5px;
  transition:all 0.2s; margin-bottom:22px;
  backdrop-filter:blur(6px);
}
.back-btn:hover { color:var(--gold); border-color:var(--gold); background:rgba(255,245,214,0.7); }

.combo-img-wrap {
  width:100%; aspect-ratio:1/1; max-height:320px;
  border-radius:24px; overflow:hidden;
  border:2px solid rgba(201,162,39,0.3);
  background:linear-gradient(135deg,rgba(255,224,250,0.8),rgba(255,245,214,0.8));
  margin-bottom:20px;
  position:relative;
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 8px 36px rgba(201,162,39,0.18);
}
.combo-img-wrap img { width:100%; height:100%; object-fit:cover; animation:imgReveal 0.6s ease; }
@keyframes imgReveal { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
.img-placeholder { font-size:5.5rem; animation:foodFloat 3s ease-in-out infinite; }
@keyframes foodFloat { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-12px) rotate(3deg)} }

.combo-name {
  font-family:'Playfair Display',serif;
  font-style:italic; font-weight:900;
  font-size:clamp(1.7rem,5vw,2.6rem);
  text-align:center;
  background:linear-gradient(135deg,var(--gold),var(--rose),var(--gold2));
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  line-height:1.2; margin-bottom:8px;
  animation:slideUp 0.5s ease;
}
@keyframes slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
.combo-tagline { text-align:center; color:var(--text2); font-weight:700; font-size:0.95rem; margin-bottom:24px; font-style:italic; }

.stats-row {
  display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px;
  animation:slideUp 0.5s 0.1s ease backwards;
}
.stat-c {
  background:rgba(255,255,255,0.65);
  border:1.5px solid rgba(201,162,39,0.22);
  border-radius:18px; padding:14px 10px; text-align:center;
  backdrop-filter:blur(6px);
}
.stat-ic { font-size:1.5rem; margin-bottom:4px; }
.stat-lb { font-size:0.65rem; text-transform:uppercase; letter-spacing:2px; color:var(--muted); font-weight:900; margin-bottom:4px; }
.stat-vl { font-family:'Cinzel Decorative',cursive; font-size:1.05rem; color:var(--gold); }

.section-card {
  background:rgba(255,255,255,0.65);
  border:1.5px solid rgba(201,162,39,0.2);
  border-radius:22px; padding:20px; margin-bottom:16px;
  animation:slideUp 0.5s 0.15s ease backwards;
  backdrop-filter:blur(6px);
}
.sec-title {
  font-family:'Cinzel Decorative',cursive;
  font-size:0.85rem; color:var(--gold);
  margin-bottom:14px; display:flex; align-items:center; gap:8px;
  letter-spacing:0.5px;
}
.ing-list { display:flex; flex-direction:column; gap:8px; }
.ing-item {
  display:flex; align-items:center; gap:10px;
  padding:9px 12px; background:rgba(255,245,214,0.4); border-radius:12px;
}
.ing-em { font-size:1.35rem; }
.ing-nm { flex:1; font-weight:700; color:var(--text); font-size:0.9rem; }
.ing-am { color:var(--gold); font-weight:800; font-size:0.85rem; }

.recipe-list { display:flex; flex-direction:column; gap:8px; }
.step {
  display:flex; gap:12px; align-items:flex-start;
  padding:8px 0; border-bottom:1px solid rgba(201,162,39,0.12);
}
.step:last-child { border-bottom:none; }
.step-num {
  width:26px; height:26px; border-radius:50%; flex-shrink:0;
  background:linear-gradient(135deg,var(--gold),var(--pink));
  display:flex; align-items:center; justify-content:center;
  font-family:'Cinzel Decorative',cursive; font-size:0.68rem; color:#fff;
  font-weight:900;
}
.step-txt { color:var(--text2); font-size:0.88rem; line-height:1.55; font-weight:700; padding-top:3px; }

.fun-fact {
  background:linear-gradient(135deg,rgba(255,245,214,0.7),rgba(255,224,250,0.7));
  border:1.5px solid rgba(201,162,39,0.25);
  border-radius:18px; padding:14px 16px; margin-bottom:16px;
  display:flex; gap:10px; align-items:flex-start;
  animation:slideUp 0.5s 0.2s ease backwards;
}
.ff-ic { font-size:1.3rem; flex-shrink:0; }
.ff-tx { color:var(--text2); font-size:0.88rem; font-weight:700; line-height:1.55; }

.rating-card {
  background:rgba(255,255,255,0.65);
  border:1.5px solid rgba(201,162,39,0.2);
  border-radius:22px; padding:20px; margin-bottom:20px; text-align:center;
  animation:slideUp 0.5s 0.25s ease backwards;
  backdrop-filter:blur(6px);
}
.rating-row { display:flex; justify-content:center; gap:10px; margin-top:12px; }
.r-btn {
  font-size:1.9rem; background:none; border:2px solid transparent;
  border-radius:50%; width:56px; height:56px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:all 0.2s;
}
.r-btn:hover { transform:scale(1.3); border-color:rgba(201,162,39,0.35); }
.r-btn.sel {
  border-color:var(--gold); background:rgba(255,245,214,0.6);
  transform:scale(1.2); animation:rPop 0.3s ease;
}
@keyframes rPop { 0%{transform:scale(1.5)} 100%{transform:scale(1.2)} }
.r-label { margin-top:8px; min-height:20px; font-weight:700; font-size:0.88rem; color:var(--gold); }

.action-row {
  display:flex; gap:12px; flex-wrap:wrap;
  animation:slideUp 0.5s 0.3s ease backwards;
}
.act-btn {
  flex:1; min-width:130px; padding:14px 18px;
  border-radius:18px; border:none;
  font-family:'Nunito',sans-serif; font-weight:800; font-size:0.92rem;
  cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
  transition:all 0.2s; color:#fff;
}
.btn-regen {
  background:linear-gradient(135deg,var(--gold),var(--gold2));
  box-shadow:0 6px 20px rgba(201,162,39,0.35);
  color:#7A3B00;
}
.btn-regen:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(201,162,39,0.45); }
.btn-share {
  background:linear-gradient(135deg,var(--pink),var(--rose));
  box-shadow:0 6px 20px rgba(255,122,198,0.35);
}
.btn-share:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(255,122,198,0.45); }

.toast {
  position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
  background:linear-gradient(135deg,var(--gold),var(--gold2));
  color:#7A3B00; padding:11px 22px; border-radius:14px; font-weight:800; font-size:0.88rem;
  z-index:300; animation:toastIn 0.3s ease, toastOut 0.3s ease 2.5s forwards;
  white-space:nowrap; box-shadow:0 4px 16px rgba(201,162,39,0.35);
}
@keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
@keyframes toastOut { to{opacity:0;transform:translateX(-50%) translateY(16px)} }

@media(max-width:480px) {
  .sliders { flex-direction:column; }
  .stats-row { grid-template-columns:repeat(3,1fr); }
  .action-row { flex-direction:column; }
}


.title-area {
  width: 100%;
  margin-bottom: 36px;
}

.genie-hero {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.genie-img {
  width: 40%;
  max-width: 900px;
  flex-shrink: 0;
  display: block;
  object-fit: contain;
  animation: genieFloat 3.5s ease-in-out infinite;
  margin-left: 2%;
}

@keyframes genieFloat {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-12px); }
}

.genie-title-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  gap: 8px;
  margin-left: -20%;
  min-width: 0;        
  overflow: hidden;
}

.site-tagline {
  font-size: clamp(0.8rem, 1.4vw, 1rem);
  font-weight: 700;
  color: var(--text2);
  letter-spacing: 0.3px;
  text-align: center;
}
`;

// ─── Sparkle Field ────────────────────────────────────────────────────────────
function SparkleField() {
  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    char: MAGIC_PARTICLES[i % MAGIC_PARTICLES.length],
    x: Math.random() * 100,
    y: Math.random() * 100,
    dur: (Math.random() * 4 + 4).toFixed(1),
    delay: (Math.random() * 5).toFixed(1),
  }));
  return (
    <div className="sparkle-field">
      {items.map(s => (
        <div key={s.id} className="sparkle" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          "--dur": `${s.dur}s`, "--delay": `-${s.delay}s`,
        }}>{s.char}</div>
      ))}
    </div>
  );
}

// ─── Magic Lamp Loading Screen ────────────────────────────────────────────────
function MagicLampOverlay() {
  const sparks = ["🍕","🍔","🌮","🍜","🍣","🧁","🍓","🥑","🍩","🌶️"].map((char, i) => ({
  id: i,
  char,
  tx: (Math.random() * 80 - 40).toFixed(0),      /* ← narrower spread */
  dur: (Math.random() * 1.5 + 1.5).toFixed(1),
  delay: (Math.random() * 2.5).toFixed(1),
  left: (38 + Math.random() * 24).toFixed(0),    /* ← centered inside the lid */
}));

  return (
    <div className="magic-overlay">
      <div className="lamp-stage">
      {sparks.map(p => (
  <div key={p.id} className="float-particle" style={{
    left: `${p.left}%`,
    bottom: "55%",      /* ← start from the lid area, not the bottom */
    "--tx": `${p.tx}px`,
    "--dur": `${p.dur}s`,
    animationDelay: `${p.delay}s`,
    fontSize: "1.6rem",
    zIndex: 3,          /* ← in front of the pot image */
  }}>{p.char}</div>
))}
        <img src="/magic.png" alt="Magic" style={{
          width: "1000px",
          animation: "lampWobble 1.8s ease-in-out infinite",
          filter: "drop-shadow(0 8px 24px rgba(201,162,39,0.5))",
          position: "relative", zIndex: 1,
        }} />
      </div>
      <div className="magic-title">Your wish is being granted...</div>
      <div className="magic-bar-wrap"><div className="magic-bar" /></div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(1);
  const [foodType, setFoodType] = useState("sweet");
  const [maxTime, setMaxTime] = useState(15);
  const [maxCalories, setMaxCalories] = useState(600);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const audioRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setRating(null);

    try {
      const ctx = getCtx(audioRef);
      if (ctx.state === "suspended") await ctx.resume();
      playMagicSound(ctx);
    } catch (e) {}

    try {
      const res = await axios.post("http://127.0.0.1:5000/generate-combo", {
        type: foodType, maxTime, maxCalories,
      });
      setResult(res.data.result);
      setLoading(false);
      setTimeout(async () => {
        try {
          const ctx = getCtx(audioRef);
          if (ctx.state === "suspended") await ctx.resume();
          playRevealSound(ctx);
        } catch (e) {}
        setPage(2);
      }, 400);
    } catch (err) {
      setLoading(false);
      setError("❌ " + (err.response?.data?.error || err.message || "Something went wrong"));
    }
  };

  const handleShare = async () => {
    const text = result
      ? `🧞‍♂️ FoodieGenie granted my wish!\n✨ ${result.name}\n"${result.tagline}"\n⏱️ ${result.prepTime} min | 🔥 ${result.calories} cal`
      : "";
    if (navigator.share) {
      try { await navigator.share({ title: result?.name, text }); return; } catch {}
    }
    await navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const comboEmoji = result?.ingredients?.[0]?.emoji || "🍽️";

  return (
    <>
      <style>{CSS}</style>
      <SparkleField />
      <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />

      {/* ══ PAGE 1 ══ */}
      {page === 1 && (
        <div className="page">
          <div className="title-area">
            <div className="genie-hero">
              <img src="/genie.png" alt="Genie" className="genie-img" />
              <div className="genie-title-overlay">
                <span className="site-title-line1">FoodieGenie</span>
                <p className="site-tagline">Press the button. Get a weird combo. Make it. Post it. Become a legend.</p>
              </div>
            </div>
          </div>

          <div className="inner">
            <div className="slabel">choose your magic</div>
            <div className="food-types">
              {FOOD_TYPES.map(ft => (
                <button key={ft.id} className={`ft-btn ${foodType === ft.id ? "active" : ""}`}
                  onClick={() => setFoodType(ft.id)}>
                  <span className="fe">{ft.emoji}</span>{ft.label}
                </button>
              ))}
            </div>

            <div className="sliders">
              <div className="slider-card">
                <div className="slider-top">
                  <span className="slider-name">⏱️ Max Time</span>
                  <span className="slider-val">{maxTime}m</span>
                </div>
                <input type="range" min={1} max={60} value={maxTime}
                  onChange={e => setMaxTime(+e.target.value)} />
              </div>
              <div className="slider-card">
                <div className="slider-top">
                  <span className="slider-name">🔥 Calories</span>
                  <span className="slider-val">{maxCalories}</span>
                </div>
                <input type="range" min={50} max={2000} step={50} value={maxCalories}
                  onChange={e => setMaxCalories(+e.target.value)} />
              </div>
            </div>

            <div className="gen-btn-wrap">
              <button className="gen-btn" onClick={handleGenerate} disabled={loading}>
                🧞‍♂️ Grant My Wish 🧞‍♂️
              </button>
            </div>
            {error && <div className="error-box">{error}</div>}
          </div>
        </div>
      )}

      {/* ══ MAGIC LOADING OVERLAY ══ */}
      {loading && <MagicLampOverlay />}

      {/* ══ PAGE 2 ══ */}
      {page === 2 && result && (
        <div className="page">
          <div className="inner">
            <button className="back-btn" onClick={() => { setPage(1); setResult(null); }}>← Back</button>

            <div className="combo-img-wrap">
              {result.imageUrl
                ? <img src={result.imageUrl} alt={result.name} />
                : <span className="img-placeholder">{comboEmoji}</span>
              }
            </div>

            <h1 className="combo-name">{result.name}</h1>
            <p className="combo-tagline">"{result.tagline}"</p>

            <div className="stats-row">
              <div className="stat-c">
                <div className="stat-ic">⏱️</div>
                <div className="stat-lb">Prep</div>
                <div className="stat-vl">{result.prepTime}m</div>
              </div>
              <div className="stat-c">
                <div className="stat-ic">🔥</div>
                <div className="stat-lb">Calories</div>
                <div className="stat-vl">{result.calories}</div>
              </div>
              <div className="stat-c">
                <div className="stat-ic">💪</div>
                <div className="stat-lb">Protein</div>
                <div className="stat-vl">{result.protein || "—"}</div>
              </div>
            </div>

            <div className="section-card">
              <div className="sec-title">🧺 Ingredients</div>
              <div className="ing-list">
                {(result.ingredients || []).map((ing, i) => (
                  <div key={i} className="ing-item">
                    <span className="ing-em">{ing.emoji}</span>
                    <span className="ing-nm">{ing.name}</span>
                    <span className="ing-am">{ing.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <div className="sec-title">🪄 Recipe</div>
              <div className="recipe-list">
                {(result.recipe || []).map((step, i) => (
                  <div key={i} className="step">
                    <div className="step-num">{i + 1}</div>
                    <div className="step-txt">{step.replace(/^step\s*\d+[:.]\s*/i, "")}</div>
                  </div>
                ))}
              </div>
            </div>

            {result.funFact && (
              <div className="fun-fact">
                <span className="ff-ic">💡</span>
                <span className="ff-tx">{result.funFact}</span>
              </div>
            )}

            <div className="rating-card">
              <div className="sec-title" style={{ justifyContent: "center" }}>🌟 Rate this wish</div>
              <div className="rating-row">
                {RATINGS.map((r, i) => (
                  <button key={i} className={`r-btn ${rating === i ? "sel" : ""}`}
                    onClick={() => setRating(i)} title={r.label}>
                    {r.emoji}
                  </button>
                ))}
              </div>
              <div className="r-label">{rating !== null ? RATINGS[rating].label : ""}</div>
            </div>

            <div className="action-row">
              <button className="act-btn btn-regen" onClick={() => { setPage(1); setResult(null); }}>
                🔄 New Wish
              </button>
              <button className="act-btn btn-share" onClick={handleShare}>
                📤 Share Magic
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && <div className="toast">✅ Copied to clipboard!</div>}
    </>
  );
}