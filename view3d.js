/* Chế độ xem 3D: cây hình nón, mỗi đời là một vòng tròn xếp tầng từ trên xuống. */
window.Tree3D = (() => {
  "use strict";
  const R = 58, H = 48, TEXT_H = 4.2;
  let host = null, graph = null, sprites = new Map(), nodesById = new Map(), hits = new Set(), selected = null, onPick = null;

  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const palette = () => ({
    bg: css("--bg"), ink: css("--ink"), muted: css("--muted"), line: css("--line"),
    male: css("--male"), maleB: css("--male-b"), female: css("--female"), femaleB: css("--female-b"),
    hl: css("--hl"), accent: css("--accent"), warn: css("--warn"),
  });

  function layout(people) {
    const root = d3.stratify().id(d => d.id).parentId(d => d.parent)(people);
    d3.tree().size([2 * Math.PI, 1]).separation((a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(a.depth, 1))(root);
    const maxDepth = d3.max(root.descendants(), d => d.depth);
    const nodes = root.descendants().map(d => {
      const r = d.depth * R, a = d.x;
      const x = r * Math.cos(a), z = r * Math.sin(a), y = (maxDepth / 2 - d.depth) * H;
      return { id: d.id, p: d.data, depth: d.depth, x, y, z, fx: x, fy: y, fz: z };
    });
    const links = root.links().map(l => ({ source: l.source.id, target: l.target.id }));
    return { nodes, links };
  }

  function style(n) {
    const s = sprites.get(n.id); if (!s) return;
    const c = palette(), f = n.p.sex === "f";
    const isHit = hits.has(n.id), isSel = n.id === selected;
    s.color = c.ink;
    s.backgroundColor = isHit ? c.hl : (f ? c.female : c.male);
    s.borderColor = isSel ? c.accent : n.p.issue ? c.warn : (f ? c.femaleB : c.maleB);
    s.borderWidth = isSel ? 0.9 : 0.45;
  }

  function makeSprite(n) {
    const lines = [n.p.name];
    if (n.p.life) lines.push(n.p.life);
    const s = new SpriteText(lines.join("\n"), TEXT_H);
    s.fontFace = getComputedStyle(document.body).fontFamily;
    s.fontWeight = "600";
    s.padding = [2.2, 1.4];
    s.borderRadius = 2;
    sprites.set(n.id, s);
    style(n);
    return s;
  }

  function init(el, people, pick) {
    onPick = pick; host = el;
    const data = layout(people);
    data.nodes.forEach(n => nodesById.set(n.id, n));
    const ex = d3.extent(data.nodes, n => n.x), ez = d3.extent(data.nodes, n => n.z);
    const cx = (ex[0] + ex[1]) / 2, cz = (ez[0] + ez[1]) / 2;
    extent = { cx, cz, r: d3.max(data.nodes, n => Math.hypot(n.x - cx, n.z - cz)) + 30, h: d3.max(data.nodes, n => Math.abs(n.y)) + 20 };
    const c = palette();
    graph = ForceGraph3D({ controlType: "orbit" })(el)
      .backgroundColor(c.bg)
      .showNavInfo(false)
      .graphData(data)
      .nodeThreeObject(makeSprite)
      .nodeLabel(() => "")
      .linkColor(() => c.muted)
      .linkOpacity(0.85)
      .linkWidth(0)
      .warmupTicks(0).cooldownTicks(0)
      .enableNodeDrag(false)
      .onNodeClick(n => { onPick && onPick(n.id); })
      .onBackgroundClick(() => { onPick && onPick(null); });
    resize();
    fit(0);
    window.addEventListener("resize", resize);
    return api;
  }

  function resize() {
    if (!graph) return;
    const r = host.getBoundingClientRect();
    graph.width(r.width).height(r.height);
  }
  let extent = { r: 1, h: 1 };
  function fit(ms = 700) {
    if (!graph) return;
    const cam = graph.camera(), r = host.getBoundingClientRect();
    const vf = (cam.fov * Math.PI) / 360, hf = Math.atan(Math.tan(vf) * (r.width / Math.max(r.height, 1)));
    const need = Math.max(extent.r / Math.tan(Math.min(vf, hf)), extent.h / Math.tan(vf)) * 0.7 + extent.r * 0.3;
    graph.cameraPosition({ x: extent.cx, y: need * 0.22, z: extent.cz + need }, { x: extent.cx, y: 0, z: extent.cz }, ms);
  }
  function zoomBy(f) {
    if (!graph) return;
    const cam = graph.camera(), ctl = graph.controls(), t = ctl.target;
    const p = { x: t.x + (cam.position.x - t.x) / f, y: t.y + (cam.position.y - t.y) / f, z: t.z + (cam.position.z - t.z) / f };
    graph.cameraPosition(p, t, 250);
  }
  function focus(id, ms = 900) {
    const n = nodesById.get(id); if (!graph || !n) return;
    const len = Math.hypot(n.fx, n.fz) || 1;
    const out = 1 + 170 / len;  // camera sits outside the ring, looking in at the person
    const pos = n.depth === 0 ? { x: 0, y: n.fy + 60, z: 190 } : { x: n.fx * out, y: n.fy + 45, z: n.fz * out };
    // on phones the detail sheet covers the lower part of the screen, so aim below the person
    const dy = window.matchMedia("(max-width: 720px)").matches ? 40 : 0;
    pos.y -= dy;
    graph.cameraPosition(pos, { x: n.fx, y: n.fy - dy, z: n.fz }, ms);
  }
  function restyleAll() { nodesById.forEach(style); }
  function setHits(set) { hits = set; restyleAll(); }
  function setSelected(id) { selected = id; restyleAll(); }
  function retheme() {
    if (!graph) return;
    const c = palette();
    graph.backgroundColor(c.bg).linkColor(() => c.muted);
    restyleAll();
  }
  function pause(p) { if (graph) p ? graph.pauseAnimation() : graph.resumeAnimation(); }

  const api = { init, fit, zoomBy, focus, setHits, setSelected, resize, retheme, pause };
  return api;
})();
