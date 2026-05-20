/* =========================================
   AgroSense 360º — JavaScript principal
   ========================================= */

const cows = [
  { id:'V-001', name:'Blanquita', x:28, y:35, vx:0.4,  vy:0.2,  hr:62, temp:38.4, act:72, status:'ok',   outside:false, hist:[] },
  { id:'V-002', name:'Morena',    x:55, y:55, vx:-0.3, vy:0.35, hr:65, temp:38.6, act:85, status:'ok',   outside:false, hist:[] },
  { id:'V-003', name:'Canela',    x:70, y:30, vx:0.2,  vy:-0.4, hr:58, temp:38.8, act:40, status:'ok',   outside:false, hist:[] },
  { id:'V-004', name:'Estrella',  x:25, y:65, vx:0.5,  vy:0.15, hr:88, temp:39.5, act:20, status:'warn', outside:false, hist:[] },
  { id:'V-005', name:'Pinta',     x:50, y:20, vx:-0.2, vy:0.5,  hr:70, temp:38.2, act:90, status:'ok',   outside:false, hist:[] },
];

cows.forEach(c => {
  for (let i = 0; i < 20; i++) {
    c.hist.push(+(c.temp + (Math.random() - 0.5) * 0.4).toFixed(1));
  }
});

const alerts = [];
let selectedId = 'V-001';

/* ---- UTILIDADES ---- */
function ts() {
  return new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

function addAlert(msg, type) {
  alerts.unshift({ msg, type, time: ts() });
  if (alerts.length > 5) alerts.pop();
  const log = document.getElementById('alertLog');
  if (!log) return;
  log.innerHTML = alerts.map(a => `
    <div class="aitem ${a.type === 'fence' ? 'a-fence' : a.type === 'hr' ? 'a-hr' : 'a-ok'}">
      <span>${a.type === 'fence' ? '⚠️' : a.type === 'hr' ? '❤️' : '✅'}</span>
      <span>${a.time} — ${a.msg}</span>
    </div>`).join('');
}

function updateStats() {
  const ok   = cows.filter(c => !c.outside && c.status === 'ok').length;
  const warn = cows.filter(c => !c.outside && c.status === 'warn').length;
  const out  = cows.filter(c => c.outside).length;
  const avgT = (cows.reduce((s, c) => s + c.temp, 0) / cows.length).toFixed(1);
  const avgH = Math.round(cows.reduce((s, c) => s + c.hr, 0) / cows.length);
  if (document.getElementById('sOk'))   document.getElementById('sOk').textContent   = ok;
  if (document.getElementById('sWarn')) document.getElementById('sWarn').textContent = warn;
  if (document.getElementById('sOut'))  document.getElementById('sOut').textContent  = out;
  if (document.getElementById('sTemp')) document.getElementById('sTemp').textContent = avgT + '°';
  if (document.getElementById('sHR'))   document.getElementById('sHR').textContent   = avgH + ' bpm';
}

function renderList() {
  const list = document.getElementById('cowList');
  if (!list) return;
  list.innerHTML = '';
  cows.forEach(cow => {
    const d = document.createElement('div');
    d.className = 'cow-item' + (cow.id === selectedId ? ' sel' : '');
    const bc = cow.outside ? 'b-out' : cow.status === 'warn' ? 'b-warn' : 'b-ok';
    const bt = cow.outside ? 'FUERA' : cow.status === 'warn' ? 'Revisar' : 'Normal';
    d.innerHTML = `
      <div class="cow-row">
        <span class="cow-name">${cow.name} <span class="cow-id">${cow.id}</span></span>
        <span class="badge ${bc}">${bt}</span>
      </div>
      <div class="sensors">
        <div class="snsr"><div class="snsr-v" style="color:${cow.hr > 80 ? '#c62828' : '#2e7d32'}">${cow.hr}</div><div class="snsr-l">bpm</div></div>
        <div class="snsr"><div class="snsr-v" style="color:${cow.temp > 39.2 ? '#c62828' : '#2e7d32'}">${cow.temp.toFixed(1)}°</div><div class="snsr-l">temp</div></div>
        <div class="snsr"><div class="snsr-v">${cow.act}</div><div class="snsr-l">activ.</div></div>
      </div>`;
    d.addEventListener('click', () => { selectedId = cow.id; renderList(); });
    list.appendChild(d);
  });
}

/* ---- MAPA ---- */
const cowEls = {};

function fenceRect() {
  const r = document.getElementById('mapArea').getBoundingClientRect();
  const f = document.getElementById('fence').getBoundingClientRect();
  return {
    x1: ((f.left - r.left) / r.width) * 100,
    y1: ((f.top  - r.top)  / r.height) * 100,
    x2: ((f.right  - r.left) / r.width) * 100,
    y2: ((f.bottom - r.top)  / r.height) * 100,
  };
}

function createCowEl(cow) {
  const layer = document.getElementById('cowsLayer');
  if (!layer) return;
  const d = document.createElement('div');
  d.className = 'cow-marker';
  d.id = 'cm-' + cow.id;
  d.innerHTML = `<div class="cow-icon" id="ci-${cow.id}">🐄</div><div class="cow-lbl">${cow.name}</div>`;
  d.style.left = cow.x + '%';
  d.style.top  = cow.y + '%';
  d.addEventListener('click', () => { selectedId = cow.id; renderList(); });
  layer.appendChild(d);
  cowEls[cow.id] = d;
}

function tickMap() {
  const fence = fenceRect();
  cows.forEach(cow => {
    cow.x += cow.vx * (0.4 + Math.random() * 0.7);
    cow.y += cow.vy * (0.4 + Math.random() * 0.7);
    if (cow.x < 1 || cow.x > 99) { cow.vx *= -1; cow.x = Math.max(1, Math.min(99, cow.x)); }
    if (cow.y < 1 || cow.y > 99) { cow.vy *= -1; cow.y = Math.max(1, Math.min(99, cow.y)); }
    if (Math.random() < 0.04) cow.vx = (Math.random() - 0.5) * 0.8;
    if (Math.random() < 0.04) cow.vy = (Math.random() - 0.5) * 0.8;

    const prev = cow.outside;
    cow.outside = (cow.x < fence.x1 || cow.x > fence.x2 || cow.y < fence.y1 || cow.y > fence.y2);
    if (cow.outside && !prev) addAlert(cow.name + ' salió del vallado virtual', 'fence');
    if (!cow.outside && prev) addAlert(cow.name + ' volvió al interior', 'ok');

    cow.hr   = Math.round(Math.max(45, Math.min(110, cow.hr + (Math.random() - 0.5) * 4)));
    cow.temp = +(Math.max(37.5, Math.min(41, cow.temp + (Math.random() - 0.5) * 0.12))).toFixed(1);
    cow.act  = Math.round(Math.max(0, Math.min(100, cow.act + (Math.random() - 0.5) * 10)));
    cow.hist.push(cow.temp);
    if (cow.hist.length > 20) cow.hist.shift();

    if (cow.hr > 90 && cow.status !== 'warn') { cow.status = 'warn'; addAlert(cow.name + ': FC elevada (' + cow.hr + ' bpm)', 'hr'); }
    else if (cow.hr <= 85 && cow.status === 'warn') cow.status = 'ok';

    const el = cowEls[cow.id];
    if (el) { el.style.left = cow.x + '%'; el.style.top = cow.y + '%'; }
    const ic = document.getElementById('ci-' + cow.id);
    if (ic) ic.style.background = cow.outside ? '#f44336' : cow.status === 'warn' ? '#ff9800' : '#4caf50';
  });
  updateStats();
  renderList();
}

function triggerSOS() {
  addAlert('🚨 EMERGENCIA activada por operador', 'hr');
  cows.forEach(c => { c.status = 'warn'; });
  setTimeout(() => { cows.forEach(c => { c.status = 'ok'; }); addAlert('Emergencia despejada', 'ok'); }, 8000);
}

function initMapa() {
  cows.forEach(createCowEl);
  renderList();
  addAlert('Sistema AgroSense 360º iniciado', 'ok');
  setInterval(tickMap, 900);
  setInterval(() => {
    const clk = document.getElementById('clk');
    if (clk) clk.textContent = new Date().toLocaleTimeString('es-ES');
  }, 1000);
}

/* ---- DETALLE ---- */
let histChartInstance = null;

function initDetalle() {
  const sel = document.getElementById('detailSelect');
  if (!sel) return;
  sel.innerHTML = cows.map(c => `<option value="${c.id}">${c.name} (${c.id})</option>`).join('');
  sel.value = selectedId;
  renderDetail();
  setInterval(() => {
    cows.forEach(cow => {
      cow.hr   = Math.round(Math.max(45, Math.min(110, cow.hr + (Math.random() - 0.5) * 4)));
      cow.temp = +(Math.max(37.5, Math.min(41, cow.temp + (Math.random() - 0.5) * 0.12))).toFixed(1);
      cow.act  = Math.round(Math.max(0, Math.min(100, cow.act + (Math.random() - 0.5) * 10)));
      cow.hist.push(cow.temp);
      if (cow.hist.length > 20) cow.hist.shift();
    });
    renderDetail();
  }, 1500);
}

function renderDetail() {
  const sel = document.getElementById('detailSelect');
  if (sel) selectedId = sel.value;
  const cow = cows.find(c => c.id === selectedId);
  if (!cow) return;

  const hrColor = cow.hr > 80 ? '#c62828' : '#2e7d32';
  const tColor  = cow.temp > 39.2 ? '#c62828' : '#2e7d32';

  const bigEl = document.getElementById('bigSensors');
  if (bigEl) bigEl.innerHTML = `
    <div class="big-snsr"><div class="big-snsr-v" style="color:${hrColor}">${cow.hr}</div><div class="big-snsr-l">bpm — Frec. cardíaca</div></div>
    <div class="big-snsr"><div class="big-snsr-v" style="color:${tColor}">${cow.temp.toFixed(1)}°C</div><div class="big-snsr-l">Temperatura corporal</div></div>`;

  const actBar = document.getElementById('actBar');
  if (actBar) {
    actBar.style.width = cow.act + '%';
    actBar.style.background = cow.act < 30 ? '#f44336' : cow.act < 60 ? '#ff9800' : '#4caf50';
  }
  const actVal = document.getElementById('actVal');
  if (actVal) actVal.textContent = cow.act + ' / 100 — ' + (cow.act < 30 ? 'Inactiva' : cow.act < 60 ? 'Moderada' : 'Activa');

  const gpsEl = document.getElementById('gpsInfo');
  if (gpsEl) gpsEl.innerHTML = `
    <div>Identificador: <span>${cow.id}</span></div>
    <div>Nombre: <span>${cow.name}</span></div>
    <div>Latitud: <span>37.${(5443 + cow.x * 10).toString().slice(0,4)}°N</span></div>
    <div>Longitud: <span>-4.${(8980 + cow.y * 10).toString().slice(0,4)}°W</span></div>
    <div>Zona: <span style="color:${cow.outside ? '#c62828' : '#2e7d32'}">${cow.outside ? 'FUERA DEL VALLADO' : 'Dentro del vallado'}</span></div>
    <div>Estado: <span style="color:${cow.status === 'warn' ? '#e65100' : '#2e7d32'}">${cow.status === 'warn' ? 'Revisar' : 'Normal'}</span></div>`;

  const canvas = document.getElementById('histChart');
  if (canvas) {
    if (histChartInstance) { histChartInstance.destroy(); histChartInstance = null; }
    histChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: cow.hist.map((_, i) => i === cow.hist.length - 1 ? 'Ahora' : '-' + (cow.hist.length - 1 - i) + 's'),
        datasets: [{
          label: 'Temperatura °C',
          data: cow.hist,
          borderColor: '#e65100',
          backgroundColor: 'rgba(230,81,0,0.07)',
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 37, max: 41, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 9 }, maxTicksLimit: 6 } }
        }
      }
    });
  }
}
