// Dream Football — mobile PWA pulled from the estate
// Host a room, run an auction draft, manage roster. Installable on Android.
// v0.1.1: cap enforced, honest room copy (local draft), install icon.

const PLAYERS = [
  { name:"Jordan Love", pos:"QB", value:42 },
  { name:"Bijan Robinson", pos:"RB", value:68 },
  { name:"CeeDee Lamb", pos:"WR", value:61 },
  { name:"Sam LaPorta", pos:"TE", value:28 },
  { name:"Justin Jefferson", pos:"WR", value:72 },
  { name:"Christian McCaffrey", pos:"RB", value:75 },
  { name:"Patrick Mahomes", pos:"QB", value:55 },
  { name:"Tyreek Hill", pos:"WR", value:58 },
  { name:"Travis Kelce", pos:"TE", value:34 },
  { name:"Saquon Barkley", pos:"RB", value:52 }
];

let room = localStorage.getItem("df-room") || null;
let roster = JSON.parse(localStorage.getItem("df-roster") || "[]");
let cap = 301.2;
let spent = roster.reduce((s,p) => s + (p.cost||0), 0);

function save() {
  localStorage.setItem("df-room", room || "");
  localStorage.setItem("df-roster", JSON.stringify(roster));
}

function genCode() {
  return Math.random().toString(36).slice(2,6).toUpperCase();
}

function render() {
  const tab = document.querySelector(".tab.active").dataset.tab;
  const app = document.getElementById("app");
  if (tab === "room") {
    app.innerHTML = `
      <div class="card">
        <p class="muted">Host or join with a 4-letter code. Drafts run on this device — live multi-club sync is a later track.</p>
        <input id="code" placeholder="4-letter code" maxlength="4" value="${room||''}">
        <button class="primary" id="host">Host new room</button>
        <button class="primary" id="join" style="margin-top:8px;background:#1e2d4a;color:var(--ink)">Join room</button>
      </div>
      ${room ? `<div class="card">Room <strong>${room}</strong> active on this device. Share the code to compare rosters — drafts are not synced yet.</div>` : ""}`;
    document.getElementById("host").onclick = () => { room = genCode(); save(); render(); };
    document.getElementById("join").onclick = () => {
      const c = document.getElementById("code").value.toUpperCase().trim();
      if (c.length === 4) { room = c; save(); render(); }
    };
  } else if (tab === "draft") {
    const remaining = cap - spent;
    const available = PLAYERS.filter(p => !roster.find(r => r.name === p.name));
    const affordable = available.filter(p => p.value <= remaining);
    const next = affordable[0];
    app.innerHTML = `
      <div class="card">
        <div class="muted">Cap remaining</div>
        <div style="font-size:28px;font-weight:600;${
          remaining < 60 ? (remaining < 30 ? "color:var(--red)" : "color:var(--accent)") : ""
        }">$${remaining.toFixed(1)}M</div>
      </div>
      ${next ? `<div class="card">
        <strong>${next.name}</strong> <span class="muted">${next.pos}</span>
        <div class="muted">Suggested $${next.value}M</div>
        <button class="primary" id="bid">Sign $${next.value}M</button>
      </div>`
      : (available.length
        ? `<div class="card">No players left under your cap. Cheapest remaining is $${Math.min(...available.map(p=>p.value))}M — you have $${remaining.toFixed(1)}M.</div>`
        : `<div class="card">Draft complete.</div>`)}`;
    if (next) document.getElementById("bid").onclick = () => {
      if (next.value > cap - spent) return; // cap guard, never sign over the cap
      roster.push({ ...next, cost: next.value });
      spent += next.value;
      save();
      render();
    };
  } else if (tab === "roster") {
    let html = `<div class="card"><strong>Your franchise</strong><div class="muted">Spent $${spent.toFixed(1)}M of $${cap}M</div></div>`;
    roster.forEach(p => html += `<div class="card">${p.name} <span class="muted">${p.pos} · $${p.cost}M</span></div>`;
    if (!roster.length) html += `<div class="card muted">No players yet. Start the draft.</div>`;
    app.innerHTML = html;
  } else {
    app.innerHTML = `
      <div class="card"><strong>Standings</strong> <span class="muted">8 clubs · top 4 make playoffs</span></div>
      <div class="card">1. Your Club <span class="muted">${roster.length} players</span></div>
      <div class="card muted">CPU clubs fill in once the full season engine is wired.</div>`;
  }
}

document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    render();
  };
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
