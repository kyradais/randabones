(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const S = { bones: [], sel: null, tool: 'select', mode: 'setup', v: { x: 0, y: 0, z: 1 }, t: 0, play: false, fps: 30, dur: 120, fw: 12, keys: {}, show: { bones: true, grid: true, axes: true } };
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI, r1 = n => Math.round(n * 10) / 10;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ---------- util ---------- */
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 1900); }
const todo = n => toast(n + ' — not implemented yet (see CHECKLIST.md)');

/* ---------- data skeleton ---------- */
function mk(name, parent, x, y, rotation, length) {
  const b = { name, parent, x, y, rotation, length, scaleX: 1, scaleY: 1, shearX: 0, shearY: 0, inheritRotation: true, inheritScale: true, color: '#e6b23e' };
  S.bones.push(b); return b;
}
const uniq = base => { let n = base, i = 1; while (S.bones.some(b => b.name === n)) n = base + (++i); return n; };
const kids = b => S.bones.filter(c => c.parent === b);
const depth = b => b.parent ? 1 + depth(b.parent) : 0;
function world(b) {
  if (!b.parent) return { x: b.x, y: b.y, r: b.rotation };
  const p = world(b.parent), c = Math.cos(rad(p.r)), s = Math.sin(rad(p.r));
  return { x: p.x + b.x * c - b.y * s, y: p.y + b.x * s + b.y * c, r: p.r + b.rotation };
}
function newSkeleton() {
  S.bones = []; S.keys = {};
  const root = mk('root', null, 0, -150, 0, 40);
  const spine = mk('spine', root, 40, 0, 90, 120);
  mk('head', spine, 120, 0, 0, 70);
  mk('arm_l', spine, 95, 0, 70, 85);
  mk('arm_r', spine, 95, 0, -70, 85);
  S.sel = spine; refresh();
}
function removeBone(b) {
  if (!b || !b.parent) return toast('The root bone cannot be deleted');
  const del = new Set(); (function walk(x) { del.add(x); kids(x).forEach(walk); })(b);
  S.bones = S.bones.filter(x => !del.has(x)); S.sel = b.parent; refresh();
}
function saveJson() {
  const data = { skeleton: { name: 'skeleton', fps: S.fps }, bones: S.bones.map(b => { const o = { ...b, parent: b.parent ? b.parent.name : undefined }; if (!o.parent) delete o.parent; return o; }), animations: { animation1: { keys: S.keys } } };
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'skeleton.json'; a.click(); URL.revokeObjectURL(a.href); toast('skeleton.json downloaded');
}

/* ---------- viewport ---------- */
const cv = $('#cv'), g = cv.getContext('2d'); let W = 1, H = 1;
const sx = x => W / 2 + S.v.x + x * S.v.z, sy = y => H / 2 + S.v.y - y * S.v.z;
const wx = x => (x - W / 2 - S.v.x) / S.v.z, wy = y => -(y - H / 2 - S.v.y) / S.v.z;
function resize() {
  const r = cv.parentElement.getBoundingClientRect(), d = devicePixelRatio || 1; W = r.width; H = r.height;
  cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px'; g.setTransform(d, 0, 0, d, 0, 0); draw();
}
function tip(b) { const w = world(b), l = b.length * b.scaleX; return { x: w.x + l * Math.cos(rad(w.r)), y: w.y + l * Math.sin(rad(w.r)) }; }
function drawBone(b, col, a) {
  const w = world(b), t = tip(b), x0 = sx(w.x), y0 = sy(w.y), x1 = sx(t.x), y1 = sy(t.y);
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, k = clamp(L * .13, 4, 11);
  g.globalAlpha = a; g.fillStyle = col; g.strokeStyle = '#000a'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + dx * .15 + nx * k, y0 + dy * .15 + ny * k); g.lineTo(x1, y1); g.lineTo(x0 + dx * .15 - nx * k, y0 + dy * .15 - ny * k); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.arc(x0, y0, 4.5, 0, 7); g.fillStyle = '#1a1c20'; g.fill(); g.strokeStyle = col; g.lineWidth = 1.5; g.stroke(); g.globalAlpha = 1;
}
function draw() {
  g.clearRect(0, 0, W, H);
  if (S.show.grid) {
    const step = S.v.z < .5 ? 100 : 50; g.lineWidth = 1; g.strokeStyle = '#ffffff0d'; g.beginPath();
    for (let x = Math.floor(wx(0) / step) * step; sx(x) < W; x += step) { g.moveTo(Math.round(sx(x)) + .5, 0); g.lineTo(Math.round(sx(x)) + .5, H); }
    for (let y = Math.floor(wy(H) / step) * step; sy(y) > 0; y += step) { g.moveTo(0, Math.round(sy(y)) + .5); g.lineTo(W, Math.round(sy(y)) + .5); }
    g.stroke();
  }
  if (S.show.axes) {
    g.lineWidth = 1; g.strokeStyle = '#e5484d99'; g.beginPath(); g.moveTo(0, sy(0)); g.lineTo(W, sy(0)); g.stroke();
    g.strokeStyle = '#46b86a99'; g.beginPath(); g.moveTo(sx(0), 0); g.lineTo(sx(0), H); g.stroke();
  }
  if (S.show.bones) S.bones.forEach(b => { if (b !== S.sel) drawBone(b, b.color || '#e6b23e', .85); });
  if (S.show.bones && S.sel) drawBone(S.sel, '#4cc9f0', 1);
  if (D && D.type === 'create') {
    g.strokeStyle = '#4cc9f0'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(sx(D.x0), sy(D.y0)); g.lineTo(sx(D.x1), sy(D.y1)); g.stroke(); g.setLineDash([]);
  }
}
function pick(px, py) {
  for (let i = S.bones.length - 1; i >= 0; i--) {
    const b = S.bones[i], w = world(b), t = tip(b), ax = sx(w.x), ay = sy(w.y), bx = sx(t.x), by = sy(t.y);
    const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1, u = clamp(((px - ax) * vx + (py - ay) * vy) / l2, 0, 1);
    if (Math.hypot(px - (ax + u * vx), py - (ay + u * vy)) < 9) return b;
  }
  return null;
}
let D = null, panKey = false;
cv.addEventListener('pointerdown', e => {
  const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, x = wx(px), y = wy(py);
  cv.setPointerCapture(e.pointerId);
  if (e.button === 1 || e.button === 2 || S.tool === 'pan' || panKey) { D = { type: 'pan', px, py }; return; }
  if (S.tool === 'create') { D = { type: 'create', x0: x, y0: y, x1: x, y1: y }; return; }
  const hit = pick(px, py); if (hit !== S.sel) { S.sel = hit; refresh(); }
  if (hit && S.tool === 'translate') D = { type: 'move', x, y };
  if (hit && S.tool === 'rotate') D = { type: 'rot' };
  if (S.tool === 'scale' || S.tool === 'shear') todo('Tool ' + S.tool);
});
cv.addEventListener('pointermove', e => {
  const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, x = wx(px), y = wy(py);
  $('#coord').textContent = `x ${Math.round(x)} · y ${Math.round(y)}`;
  if (!D) return;
  if (D.type === 'pan') { S.v.x += px - D.px; S.v.y += py - D.py; D.px = px; D.py = py; }
  else if (D.type === 'create') { D.x1 = x; D.y1 = y; }
  else if (D.type === 'move' && S.sel) {
    const pr = S.sel.parent ? world(S.sel.parent).r : 0, dx = x - D.x, dy = y - D.y, c = Math.cos(rad(-pr)), s = Math.sin(rad(-pr));
    S.sel.x = r1(S.sel.x + dx * c - dy * s); S.sel.y = r1(S.sel.y + dx * s + dy * c); D.x = x; D.y = y; syncProps();
  } else if (D.type === 'rot' && S.sel) {
    const w = world(S.sel), pr = S.sel.parent ? world(S.sel.parent).r : 0;
    S.sel.rotation = r1(deg(Math.atan2(y - w.y, x - w.x)) - pr); syncProps();
  }
  draw();
});
cv.addEventListener('pointerup', () => {
  if (D && D.type === 'create') {
    const par = S.sel || S.bones[0], p = world(par), dx = D.x0 - p.x, dy = D.y0 - p.y, c = Math.cos(rad(-p.r)), s = Math.sin(rad(-p.r));
    let len = Math.hypot(D.x1 - D.x0, D.y1 - D.y0), ang = deg(Math.atan2(D.y1 - D.y0, D.x1 - D.x0));
    if (len < 5) { len = 80; ang = 0; }
    S.sel = mk(uniq('bone'), par, r1(dx * c - dy * s), r1(dx * s + dy * c), r1(ang - p.r), Math.round(len)); refresh();
  }
  D = null; draw();
});
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => {
  e.preventDefault(); const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, ox = wx(px), oy = wy(py);
  S.v.z = clamp(S.v.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), .15, 8); S.v.x = px - W / 2 - ox * S.v.z; S.v.y = py - H / 2 + oy * S.v.z; zoomLabel(); draw();
}, { passive: false });
const zoomLabel = () => $('#zoom').textContent = Math.round(S.v.z * 100) + '%';
function zoomBy(f) { S.v.z = clamp(S.v.z * f, .15, 8); S.v.x *= f; S.v.y *= f; zoomLabel(); draw(); }
function resetView() { S.v = { x: 0, y: 0, z: 1 }; zoomLabel(); draw(); }
$('#zin').onclick = () => zoomBy(1.25); $('#zout').onclick = () => zoomBy(.8); $('#zfit').onclick = resetView;

/* ---------- tree ---------- */
function drawTree() {
  const el = $('#tree'); el.innerHTML = '';
  const row = (label, d, cls, on, extra, fn) => { const r = document.createElement('div'); r.className = 'ti ' + cls + (on ? ' on' : ''); r.style.paddingLeft = 8 + d * 14 + 'px'; r.innerHTML = `<span class="ic">${cls === 'grpn' ? '▸' : '◆'}</span>${label}${extra ? `<em>${extra}</em>` : ''}`; r.onclick = fn; el.appendChild(r); };
  row('skeleton', 0, 'grpn', false, '', () => { });
  (function walk(b, d) { row(b.name, d, '', b === S.sel, '', () => { S.sel = b; refresh(); }); kids(b).forEach(c => walk(c, d + 1)); })(S.bones[0], 1);
  ['Slots', 'Draw order', 'Skins', 'IK constraints', 'Transform constraints', 'Path constraints', 'Physics', 'Events'].forEach(n => row(n, 1, 'grpn', false, '0', () => todo(n)));
}

/* ---------- properti ---------- */
const FIELDS = [
  ['Bone', [['name', 'Name', 'text']]],
  ['Transform', [['x', 'Position', 'number', 'y'], ['rotation', 'Rotation', 'number'], ['scaleX', 'Scale', 'number', 'scaleY'], ['shearX', 'Shear', 'number', 'shearY'], ['length', 'Length', 'number']]],
  ['Inherit', [['inheritRotation', 'Rotation', 'checkbox'], ['inheritScale', 'Scale', 'checkbox']]],
  ['Appearance', [['color', 'Color', 'color']]]
];
function buildProps() {
  const el = $('#props'); el.innerHTML = '';
  for (const [title, rows] of FIELDS) {
    el.insertAdjacentHTML('beforeend', `<div class="ph">${title}</div>`);
    for (const [k, label, type, k2] of rows) {
      const r = document.createElement('div'); r.className = 'pr';
      const inp = key => `<input data-k="${key}" type="${type}" ${type === 'number' ? 'step="any"' : ''} ${key === 'shearX' || key === 'shearY' ? 'class="stubf"' : ''}>`;
      r.innerHTML = `<span>${label}</span>` + (k2 ? inp(k) + inp(k2) : `<div class="w2">${inp(k)}</div>`);
      el.appendChild(r);
    }
  }
  $$('#props input').forEach(i => i.addEventListener('input', () => {
    const b = S.sel; if (!b) return; const k = i.dataset.k;
    if (i.type === 'checkbox') b[k] = i.checked;
    else if (i.type === 'number') { const v = parseFloat(i.value); if (!isNaN(v)) b[k] = v; }
    else if (k === 'name') { const v = i.value.trim(); if (v && !S.bones.some(o => o !== b && o.name === v)) { delete S.keys[b.name]; b.name = v; } }
    else b[k] = i.value;
    if (k === 'name') { drawTree(); drawTimeline(); } draw();
  }));
}
function syncProps() {
  const b = S.sel; $$('#props input').forEach(i => {
    i.disabled = !b; if (!b || document.activeElement === i) return; const v = b[i.dataset.k];
    if (i.type === 'checkbox') i.checked = !!v; else i.value = v ?? '';
  });
}

/* ---------- timeline ---------- */
function drawTimeline() {
  const w = S.dur * S.fw, box = $('#tlbody'), top = box.scrollTop, left = box.scrollLeft;
  let h = `<div class="tlw" style="width:${170 + w}px"><div class="row ruler" data-r="1"><div class="nm">animation1</div><div class="cells" style="width:${w}px">`;
  for (let f = 0; f <= S.dur; f += 5) h += `<span class="tick${f % 10 ? '' : ' big'}" style="left:${f * S.fw}px">${f % 10 ? '' : f}</span>`;
  h += '</div></div>';
  const rowH = (name, label, cls, d, keys) => `<div class="row ${cls}" data-b="${name || ''}"><div class="nm" style="padding-left:${8 + d * 12}px">${label}</div><div class="cells" style="width:${w}px">${(keys || []).map(f => `<i class="key" style="left:${f * S.fw}px"></i>`).join('')}</div></div>`;
  S.bones.forEach(b => {
    h += rowH(b.name, b.name, b === S.sel ? 'sel' : '', depth(b), S.keys[b.name]);
    if (b === S.sel) ['Rotate', 'Translate', 'Scale', 'Shear'].forEach(k => h += rowH(b.name, k, 'sub', depth(b) + 1));
  });
  h += `<div id="ph" style="left:${170 + S.t * S.fw}px"></div></div>`;
  box.innerHTML = h; box.scrollTop = top; box.scrollLeft = left;
}
function setTime(t) {
  S.t = clamp(t, 0, S.dur); const ph = $('#ph'); if (ph) ph.style.left = 170 + S.t * S.fw + 'px';
  if (document.activeElement !== $('#tcur')) $('#tcur').value = Math.round(S.t);
}
let scrub = false;
const frameAt = (e, row) => Math.round((e.clientX - row.querySelector('.cells').getBoundingClientRect().left) / S.fw);
$('#tlbody').addEventListener('pointerdown', e => {
  const row = e.target.closest('.row'); if (!row) return;
  if (row.dataset.r) { scrub = true; $('#tlbody').setPointerCapture(e.pointerId); setTime(frameAt(e, row)); return; }
  const b = S.bones.find(x => x.name === row.dataset.b); if (b && b !== S.sel) { S.sel = b; refresh(); }
  setTime(frameAt(e, $('#tlbody .row')));
});
$('#tlbody').addEventListener('pointermove', e => { if (scrub) setTime(frameAt(e, $('#tlbody .row'))); });
$('#tlbody').addEventListener('pointerup', () => scrub = false);
function setKey() {
  if (S.mode !== 'animate') return toast('Switch to Animate mode to set keys');
  if (!S.sel) return toast('Select a bone first');
  const f = Math.round(S.t), k = S.keys[S.sel.name] = S.keys[S.sel.name] || [];
  if (!k.includes(f)) k.push(f); drawTimeline();
}
let last = 0;
function loop(ts) { if (!S.play) return; const dt = (ts - last) / 1000; last = ts; let t = S.t + dt * S.fps; if (t > S.dur) t = 0; setTime(t); requestAnimationFrame(loop); }
function togglePlay() { S.play = !S.play; $('#tplay').textContent = S.play ? '⏸' : '▶'; if (S.play) { last = performance.now(); requestAnimationFrame(loop); } }
$('#tplay').onclick = togglePlay; $('#tfirst').onclick = () => setTime(0); $('#tlast').onclick = () => setTime(S.dur);
$('#tprev').onclick = () => setTime(Math.round(S.t) - 1); $('#tnext').onclick = () => setTime(Math.round(S.t) + 1); $('#tkey').onclick = setKey;
$('#tcur').onchange = e => setTime(+e.target.value || 0);
$('#tfps').onchange = e => S.fps = Math.max(1, +e.target.value || 30);
$('#tdur').onchange = e => { S.dur = Math.max(1, +e.target.value || 120); drawTimeline(); };
$('#tzoom').oninput = e => { S.fw = +e.target.value; drawTimeline(); };
$('#animsel').onchange = () => todo('Switch animation');

/* ---------- toolbar, tab, menu ---------- */
function setTool(t) { S.tool = t; $$('#tools button').forEach(b => b.classList.toggle('on', b.dataset.tool === t)); cv.style.cursor = { pan: 'grab', create: 'crosshair' }[t] || 'default'; $('#hint').textContent = { create: 'Click and drag to create a bone (parent: selected bone)', translate: 'Drag the selected bone to move it', rotate: 'Drag to rotate the selected bone', pan: 'Drag to pan the canvas' }[t] || ''; }
$$('#tools button').forEach(b => b.onclick = () => setTool(b.dataset.tool));
$$('[data-todo]').forEach(b => b.onclick = () => todo(b.dataset.todo));
$$('[data-show]').forEach(b => b.onclick = () => { const k = b.dataset.show; S.show[k] = !S.show[k]; b.classList.toggle('on', S.show[k]); draw(); });
$$('#modes button').forEach(b => b.onclick = () => { S.mode = b.dataset.mode; document.body.className = S.mode; $$('#modes button').forEach(x => x.classList.toggle('on', x === b)); });
function setRTab(n) { $$('#rtabs button').forEach(x => x.classList.toggle('on', x.dataset.p === n)); $$('.rpane').forEach(p => p.classList.toggle('on', p.dataset.p === n)); }
$$('#rtabs button').forEach(b => b.onclick = () => { setRTab(b.dataset.p); L.rtab = b.dataset.p; store.set(LK, L); });

const MENUS = {
  File: [['New skeleton', '', newSkeleton], ['Open…', 'Ctrl+O'], ['Save JSON', 'Ctrl+S', saveJson], ['Import data…'], ['Export…', 'Ctrl+E'], ['Pack texture…']],
  Edit: [['Undo', 'Ctrl+Z'], ['Redo', 'Ctrl+Y'], ['Delete bone', 'Del', () => removeBone(S.sel)], ['Duplicate', 'Ctrl+D'], ['Preferences…']],
  Create: [['Bone', 'B', () => setTool('create')], ['Slot'], ['Region attachment'], ['Mesh'], ['IK constraint'], ['Transform constraint'], ['Path constraint']],
  Animate: [['New animation'], ['Set key', 'K', setKey], ['Auto key'], ['Loop'], ['Set speed…']],
  View: [['Reset view', '', resetView], ['Zoom in', '', () => zoomBy(1.25)], ['Zoom out', '', () => zoomBy(.8)], ['Panel layout…']],
  Window: [['Save layout profile…', '', saveProfile], ['Reset layout', '', () => { profile = 'Default'; store.set(PK2, profile); applyLayout(DEF); fillProfiles(); }], ['Show atlas'], ['Graph editor']],
  Help: [['Keyboard shortcuts'], ['About Randabones']]
};
const mw = $('#menus');
for (const [name, items] of Object.entries(MENUS)) {
  const m = document.createElement('div'); m.className = 'mn'; m.innerHTML = `<button>${name}</button><div class="dd"></div>`;
  items.forEach(([l, k, fn]) => { const d = document.createElement('div'); if (!fn) d.className = 'stub'; d.innerHTML = `${l}<em>${k || ''}</em>`; d.onclick = () => { m.classList.remove('open'); fn ? fn() : todo(l); }; $('.dd', m).appendChild(d); });
  m.firstChild.onclick = e => { e.stopPropagation(); const o = m.classList.contains('open'); $$('.mn').forEach(x => x.classList.remove('open')); if (!o) m.classList.add('open'); };
  mw.appendChild(m);
}
document.addEventListener('click', () => $$('.mn').forEach(x => x.classList.remove('open')));

addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); togglePlay(); }
  else if (k === 'v') setTool('select'); else if (k === 'h') setTool('pan'); else if (k === 'b') setTool('create');
  else if (k === 't') setTool('translate'); else if (k === 'r') setTool('rotate'); else if (k === 'k') setKey();
  else if (k === 'delete' || k === 'backspace') removeBone(S.sel);
});

/* ---------- layout: resizable panels + profiles ---------- */
const DEF = { lw: 250, rw: 230, th: 250, tp: 240, rtab: 'images' };
const LK = 'randabones.layout', PK = 'randabones.profiles', PK2 = 'randabones.profile';
const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } } };
let L = { ...DEF, ...store.get(LK, {}) }, profile = store.get(PK2, 'Default');
const rs = document.documentElement.style;
function applyLayout(l, save = true) {
  if (l) L = { ...DEF, ...l };
  const aw = innerWidth, ah = innerHeight;
  L.lw = clamp(L.lw, 160, Math.max(160, Math.min(520, aw - L.rw - 320)));
  L.rw = clamp(L.rw, 160, Math.max(160, Math.min(520, aw - L.lw - 320)));
  L.th = clamp(L.th, 120, Math.max(120, ah - 72 - 160));
  L.tp = clamp(L.tp, 70, Math.max(70, ah - 72 - L.th - 130));
  rs.setProperty('--lw', L.lw + 'px'); rs.setProperty('--rw', L.rw + 'px'); rs.setProperty('--th', L.th + 'px'); rs.setProperty('--tp', L.tp + 'px');
  setRTab(L.rtab); if (save) store.set(LK, L);
}
function dragger(id, key, calc) {
  const el = $(id);
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('drag'); document.body.style.userSelect = 'none'; });
  el.addEventListener('pointermove', e => { if (!el.classList.contains('drag')) return; L[key] = calc(e, $('#app').getBoundingClientRect()); applyLayout(null, false); });
  const end = () => { if (!el.classList.contains('drag')) return; el.classList.remove('drag'); document.body.style.userSelect = ''; store.set(LK, L); };
  el.addEventListener('pointerup', end); el.addEventListener('lostpointercapture', end);
  el.addEventListener('dblclick', () => { L[key] = DEF[key]; applyLayout(null); });
}
dragger('#sp-l', 'lw', (e, a) => e.clientX - a.left);
dragger('#sp-r', 'rw', (e, a) => a.right - e.clientX);
dragger('#sp-t', 'th', (e, a) => a.bottom - e.clientY);
dragger('#sp-lp', 'tp', e => e.clientY - $('#treep').getBoundingClientRect().top);
const profiles = () => ({ Default: DEF, ...store.get(PK, {}) });
function fillProfiles() {
  const s = $('#lprof'), p = profiles(); s.innerHTML = '';
  Object.keys(p).forEach(n => { const o = document.createElement('option'); o.textContent = n; s.appendChild(o); });
  if (!p[profile]) profile = 'Default'; s.value = profile; $('#ldel').disabled = profile === 'Default';
}
function saveProfile() {
  const name = (prompt('Layout profile name:', profile === 'Default' ? '' : profile) || '').trim();
  if (!name) return; if (name === 'Default') return toast('"Default" is reserved');
  const p = store.get(PK, {}); p[name] = { ...L }; store.set(PK, p); profile = name; store.set(PK2, name); fillProfiles(); toast('Layout profile "' + name + '" saved');
}
$('#lsave').onclick = saveProfile;
$('#ldel').onclick = () => {
  if (profile === 'Default' || !confirm('Delete layout profile "' + profile + '"?')) return;
  const p = store.get(PK, {}); delete p[profile]; store.set(PK, p); profile = 'Default'; store.set(PK2, profile); applyLayout(DEF); fillProfiles();
};
$('#lprof').onchange = e => { profile = e.target.value; store.set(PK2, profile); applyLayout(profiles()[profile]); fillProfiles(); };
addEventListener('resize', () => applyLayout(null, false));

function refresh() { drawTree(); syncProps(); drawTimeline(); draw(); }
new ResizeObserver(resize).observe(cv.parentElement);
fillProfiles(); applyLayout(null); buildProps(); setTool('select'); newSkeleton(); resize();
})();
