/* Chế độ xem 3D tự vẽ bằng canvas 2D (không cần WebGL, chạy trên mọi trình duyệt).
   Cây hình nón: Thủy tổ ở đỉnh, mỗi đời là một vòng tròn xếp tầng bên dưới. */
window.Tree3D = (() => {
  "use strict";
  const R = 58, H = 50, LABEL = 4.4, FOV = 45 * Math.PI / 180;
  let host, cv, ctx, nodes = [], links = [], byId = new Map();
  let hits = new Set(), selected = null, onPick = null, onToggle = null, stateOf = () => ({ visible: true, kids: 0, open: false }), colors = {};
  let W = 0, Hh = 0, dpr = 1, f = 1;
  const cam = { yaw: 0.5, pitch: 0.28, dist: 900, tx: 0, ty: 0, tz: 0, cyFrac: 0.5, cxOff: 0 };
  let anim = null, dirty = true, running = false, autoSpin = true, extent = { cx: 0, cz: 0, r: 1, h: 1 };

  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  function readColors() {
    colors = { bg: css("--bg"), ink: css("--ink"), muted: css("--muted"), line: css("--line"),
      male: css("--male"), maleB: css("--male-b"), female: css("--female"), femaleB: css("--female-b"),
      hl: css("--hl"), accent: css("--accent"), warn: css("--warn") };
  }

  function layout(people) {
    const root = d3.stratify().id(d => d.id).parentId(d => d.parent)(people);
    d3.tree().size([2 * Math.PI, 1]).separation((a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(a.depth, 1))(root);
    const maxDepth = d3.max(root.descendants(), d => d.depth);
    nodes = root.descendants().map(d => {
      const r = d.depth * R;
      return { id: d.id, p: d.data, depth: d.depth, x: r * Math.cos(d.x), z: r * Math.sin(d.x), y: (maxDepth / 2 - d.depth) * H };
    });
    nodes.forEach(n => byId.set(n.id, n));
    links = root.links().map(l => [byId.get(l.source.id), byId.get(l.target.id)]);
    const ex = d3.extent(nodes, n => n.x), ez = d3.extent(nodes, n => n.z);
    const cx = (ex[0] + ex[1]) / 2, cz = (ez[0] + ez[1]) / 2;
    extent = { cx, cz, r: d3.max(nodes, n => Math.hypot(n.x - cx, n.z - cz)) + 25, h: maxDepth * H / 2 + 20 };
  }

  // ---------- projection ----------
  function project(n) {
    const vx = n.x - cam.tx, vy = n.y - cam.ty, vz = n.z - cam.tz;
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const x1 = vx * cy - vz * sy, z1 = vx * sy + vz * cy;
    const y2 = vy * cp - z1 * sp, z2 = vy * sp + z1 * cp;
    const depth = cam.dist - z2;
    if (depth < 5) return null;
    const s = f / depth;
    return { sx: W / 2 + cam.cxOff + x1 * s, sy: Hh * cam.cyFrac - y2 * s, s, depth };
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  let boxes = [];
  function draw() {
    dirty = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, Hh);
    const P = new Map(), S = new Map();
    nodes.forEach(n => { const st = stateOf(n.id); S.set(n.id, st); P.set(n.id, st.visible ? project(n) : null); });
    ctx.strokeStyle = colors.muted; ctx.lineWidth = 1; ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (const [a, b] of links) {
      const pa = P.get(a.id), pb = P.get(b.id); if (!pa || !pb) continue;
      ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
    const order = nodes.filter(n => P.get(n.id)).sort((a, b) => P.get(b.id).depth - P.get(a.id).depth);
    boxes = [];
    const font = getComputedStyle(document.body).fontFamily;
    for (const n of order) {
      const pr = P.get(n.id), fs = LABEL * pr.s, isF = n.p.sex === "f";
      const fill = hits.has(n.id) ? colors.hl : isF ? colors.female : colors.male;
      const stroke = n.id === selected ? colors.accent : n.p.issue ? colors.warn : isF ? colors.femaleB : colors.maleB;
      if (fs < 4.8) { // too far away to read: draw a dot
        const r = Math.max(2.5, fs * 0.6);
        ctx.beginPath(); ctx.arc(pr.sx, pr.sy, r, 0, 7); ctx.fillStyle = fill; ctx.fill();
        const closed = S.get(n.id).kids && !S.get(n.id).open;
        ctx.lineWidth = n.id === selected ? 2.5 : closed ? 2.4 : 1.2; ctx.strokeStyle = closed && n.id !== selected ? colors.accent : stroke; ctx.stroke();
        boxes.push({ id: n.id, x: pr.sx - r - 4, y: pr.sy - r - 4, w: 2 * r + 8, h: 2 * r + 8 });
        continue;
      }
      const big = Math.max(7.5, Math.min(fs, 22));
      const name = n.p.name, life = n.p.life || "";
      ctx.font = `600 ${big}px ${font}`;
      const w1 = ctx.measureText(name).width;
      ctx.font = `400 ${big * 0.8}px ${font}`;
      const w2 = life ? ctx.measureText(life).width : 0;
      const padX = big * 0.6, padY = big * 0.45, lh = big * 1.15;
      const w = Math.max(w1, w2) + padX * 2, h = padY * 2 + lh + (life ? lh * 0.85 : 0);
      const x = pr.sx - w / 2, y = pr.sy - h / 2;
      roundRect(x, y, w, h, big * 0.45);
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = n.id === selected ? 3 : n.p.issue ? 2 : 1.3; ctx.strokeStyle = stroke;
      ctx.setLineDash(n.p.issue && n.id !== selected ? [5, 3] : []); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = colors.ink; ctx.textBaseline = "top"; ctx.textAlign = "center";
      ctx.font = `600 ${big}px ${font}`; ctx.fillText(name, pr.sx, y + padY);
      if (life) { ctx.font = `400 ${big * 0.8}px ${font}`; ctx.fillStyle = colors.muted; ctx.fillText(life, pr.sx, y + padY + lh); }
      boxes.push({ id: n.id, x, y, w, h });
      // expand / collapse button under the card (children sit on the ring below)
      const st = S.get(n.id);
      if (st.kids) {
        const label = st.open ? "▴ Thu gọn" : `▾ ${st.kids} con`, bf = big * 0.78;
        ctx.font = `700 ${bf}px ${font}`;
        const bw = ctx.measureText(label).width + bf * 1.4, bh = bf * 1.7, bx = pr.sx - bw / 2, by = y + h + big * 0.25;
        roundRect(bx, by, bw, bh, bh / 2);
        ctx.fillStyle = st.open ? colors.bg : colors.accent; ctx.fill();
        ctx.lineWidth = 1.2; ctx.strokeStyle = st.open ? colors.line : colors.accent; ctx.stroke();
        ctx.fillStyle = st.open ? colors.muted : "#fff"; ctx.textBaseline = "middle";
        ctx.fillText(label, pr.sx, by + bh / 2 + 0.5);
        boxes.push({ id: n.id, toggle: true, x: bx - 4, y: by - 2, w: bw + 8, h: bh + 6 });
      }
    }
  }

  function loop(t) {
    if (!running) return;
    if (anim) {
      const k = Math.min(1, (t - anim.t0) / anim.ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      for (const key in anim.to) cam[key] = anim.from[key] + (anim.to[key] - anim.from[key]) * e;
      dirty = true;
      if (k >= 1) anim = null;
    } else if (autoSpin) { cam.yaw += 0.0025; dirty = true; }
    if (dirty) draw();
    requestAnimationFrame(loop);
  }
  function animateTo(to, ms = 800) {
    const from = {}; for (const k in to) from[k] = cam[k];
    if ("yaw" in to) { // shortest way round
      let d = to.yaw - from.yaw; d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; to.yaw = from.yaw + d;
    }
    if (ms <= 0) { Object.assign(cam, to); dirty = true; return; }
    anim = { from, to, ms, t0: performance.now() };
  }

  function fitParams() {
    const vf = FOV / 2, hf = Math.atan(Math.tan(vf) * (W / Math.max(Hh, 1)));
    const need = Math.max(extent.r / Math.tan(Math.min(vf, hf)), extent.h / Math.tan(vf)) * 1.05 + extent.r * 0.5;
    return { tx: extent.cx, ty: 0, tz: extent.cz, dist: need, pitch: 0.28, cyFrac: 0.5, cxOff: 0 };
  }
  function fit(ms = 700) { animateTo(fitParams(), ms); }
  const clampDist = d => Math.max(60, Math.min(d, fitParams().dist * 2.5));
  function zoomBy(k) { autoSpin = false; animateTo({ dist: clampDist(cam.dist / k) }, 250); }

  function focus(id, ms = 900) {
    const n = byId.get(id); if (!n) return;
    autoSpin = false;
    const to = { tx: n.x, ty: n.y, tz: n.z, dist: 230, pitch: 0.3, ...offsets() };
    if (n.depth > 0) to.yaw = Math.atan2(n.x, n.z);
    animateTo(to, ms);
  }

  // The details panel covers the right side on desktop and the bottom on phones.
  const offsets = () => window.matchMedia("(max-width: 720px)").matches ? { cyFrac: 0.3, cxOff: 0 } : { cyFrac: 0.5, cxOff: W > 900 ? -200 : 0 };

  // Make the tapped person the new pivot: keep the viewing angle, slide the centre to them.
  function recenter(id) {
    const n = byId.get(id); if (!n) return;
    autoSpin = false;
    animateTo({ tx: n.x, ty: n.y, tz: n.z, dist: Math.min(cam.dist, 320), ...offsets() }, 650);
  }

  // ---------- input: drag to rotate, pinch / wheel to zoom, tap to pick ----------
  const pts = new Map(); let downAt = null, pinch0 = null, moved = false;
  function bindInput() {
    cv.addEventListener("pointerdown", e => {
      cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      autoSpin = false; anim = null;
      if (pts.size === 1) { moved = false; downAt = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch }; }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: cam.dist }; moved = true; }
    });
    cv.addEventListener("pointermove", e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2 && pinch0) {
        const [a, b] = [...pts.values()];
        cam.dist = clampDist(pinch0.dist * pinch0.d / Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)));
        dirty = true;
      } else if (downAt) {
        const dx = e.clientX - downAt.x, dy = e.clientY - downAt.y;
        if (Math.hypot(dx, dy) > 6) moved = true;
        cam.yaw = downAt.yaw - dx * 0.006;
        cam.pitch = Math.max(-1.2, Math.min(1.35, downAt.pitch + dy * 0.005));
        dirty = true;
      }
    });
    const up = e => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch0 = null;
      if (pts.size === 0) { if (!moved && downAt) pick(e.clientX, e.clientY); downAt = null; }
      else { const [a] = [...pts.values()]; downAt = { x: a.x, y: a.y, yaw: cam.yaw, pitch: cam.pitch }; }
    };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("wheel", e => {
      e.preventDefault(); autoSpin = false; anim = null;
      cam.dist = clampDist(cam.dist * Math.exp(e.deltaY * 0.0015)); dirty = true;
    }, { passive: false });
  }
  function pick(cx, cy) {
    const r = cv.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        if (b.toggle) { onToggle && onToggle(b.id); return; }
        recenter(b.id); onPick && onPick(b.id); return;
      }
    }
    onPick && onPick(null);
  }

  function resize() {
    if (!cv) return;
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = r.width; Hh = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
    cv.style.width = W + "px"; cv.style.height = Hh + "px";
    f = Hh / (2 * Math.tan(FOV / 2));
    dirty = true;
  }

  function init(el, people, opts) {
    host = el;
    if (typeof opts === "function") opts = { pick: opts }; // older app.js still in a browser cache
    onPick = opts.pick; onToggle = opts.toggle || null; if (opts.state) stateOf = opts.state;
    cv = document.createElement("canvas"); cv.style.touchAction = "none"; cv.style.display = "block";
    host.appendChild(cv); ctx = cv.getContext("2d");
    readColors(); layout(people); resize();
    Object.assign(cam, fitParams());
    bindInput();
    window.addEventListener("resize", resize);
    pause(false);
    return api;
  }
  function pause(p) { const was = running; running = !p; if (running && !was) { dirty = true; requestAnimationFrame(loop); } }
  function setHits(s) { hits = s; dirty = true; }
  function setSelected(id) {
    selected = id; dirty = true;
    if (!id) animateTo({ cyFrac: 0.5, cxOff: 0 }, 300);
  }
  function retheme() { readColors(); dirty = true; }

  function refresh() { dirty = true; }
  const api = { init, refresh, fit, zoomBy, focus, setHits, setSelected, resize, retheme, pause, boxes: () => boxes, cam: () => ({ ...cam }) };
  return api;
})();
