/* Cây gia phả họ Hứa – d3 v7 */
(() => {
  "use strict";
  const DUR = 350;
  const isMobile = () => window.matchMedia("(max-width: 720px)").matches;
  let VERT = isMobile();
  const GEN_NAMES = ["Thủy tổ", "Đời thứ nhất", "Đời thứ hai", "Đời thứ ba", "Đời thứ tư",
    "Đời thứ năm", "Đời thứ sáu", "Đời thứ bảy", "Đời thứ tám", "Đời thứ chín"];

  const svg = d3.select("#tree");
  const gRoot = svg.append("g");
  const gGen = gRoot.append("g");
  const gLinks = gRoot.append("g");
  const gNodes = gRoot.append("g");
  const panel = document.getElementById("panel");
  const panelBody = document.getElementById("panelBody");
  let root, byId = new Map(), selectedId = null, hitIds = new Set(), DATA;
  let mode = "2d", T3 = null, loading3d = null;

  const zoom = d3.zoom().scaleExtent([0.15, 2.5]).on("zoom", e => gRoot.attr("transform", e.transform));
  svg.call(zoom).on("dblclick.zoom", null);

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fold = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const genName = g => GEN_NAMES[g] ?? `Đời thứ ${g}`;

  fetch("data/gia-pha.json").then(r => r.json()).then(init).catch(err => {
    document.getElementById("stage").innerHTML = `<p style="padding:24px">Không tải được dữ liệu: ${esc(err.message)}</p>`;
  });

  function init(data) {
    DATA = data;
    const strat = d3.stratify().id(d => d.id).parentId(d => d.parent);
    root = strat(data.people);
    root.each(d => { byId.set(d.id, d); d._kids = d.children; });
    collapseTo(VERT ? 2 : 3);
    update(root);
    fit(false);
    bindUI();
    showTip();
    const hash = decodeURIComponent(location.hash.slice(1));
    let want = new URLSearchParams(location.search).get("che-do");
    if (!want) { try { want = localStorage.getItem("giapha-mode"); } catch (e) {} }
    const go = () => { if (hash && byId.has(hash)) focusPerson(hash, true); };
    if (want === "3d") setMode("3d").then(go); else go();
  }

  // ---------- 2D / 3D ----------
  function loadScript(src) {
    return new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => fail(new Error(src)); document.head.appendChild(s); });
  }
  function load3d() {
    loading3d = loading3d || ["view3d.js"]
      .reduce((p, src) => p.then(() => loadScript(src)), Promise.resolve());
    return loading3d;
  }
  async function setMode(m) {
    const btn = document.getElementById("mode"), host = document.getElementById("tree3d");
    if (m === "3d") {
      btn.disabled = true; btn.textContent = "Đang tải…";
      try { await load3d(); } catch (e) { btn.disabled = false; btn.textContent = "Xem 3D"; alertBox("Không tải được chế độ 3D."); return; }
      host.hidden = false; svg.style("display", "none");
      if (!T3) {
        T3 = window.Tree3D.init(host, DATA.people, id => id ? select(id, false) : closePanel());
        T3.setHits(hitIds); if (selectedId) T3.setSelected(selectedId);
      } else { T3.pause(false); T3.resize(); }
      if (selectedId) setTimeout(() => T3.focus(selectedId), 120);
      btn.disabled = false;
    } else {
      host.hidden = true; svg.style("display", null); T3 && T3.pause(true);
      if (selectedId) { const d = byId.get(selectedId); revealPath(d); update(d.parent || d); setTimeout(() => centerOn(d), DUR + 20); }
    }
    mode = m;
    document.body.classList.toggle("is3d", m === "3d");
    btn.textContent = m === "3d" ? "Xem 2D" : "Xem 3D";
    btn.title = m === "3d" ? "Chuyển sang sơ đồ 2D" : "Chuyển sang chế độ 3D";
    try { localStorage.setItem("giapha-mode", m); } catch (e) {}
  }
  function alertBox(msg) { const p = document.createElement("div"); p.className = "toast"; p.textContent = msg; document.body.appendChild(p); setTimeout(() => p.remove(), 3000); }

  function collapseTo(depth) {
    for (const d of byId.values()) d.children = d.depth < depth ? d._kids : null;
  }
  function expandAll() { for (const d of byId.values()) d.children = d._kids; }
  function revealPath(d) { for (let a = d.parent; a; a = a.parent) a.children = a._kids; }

  function lifeLine(p) {
    const bits = [];
    if (p.life) bits.push(p.life);
    if (p.gio && !p.life) bits.push("Giỗ " + p.gio);
    return bits.join(" · ");
  }
  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  // Desktop: tree grows left → right. Phone (portrait): tree grows bottom → up.
  function dims() {
    return VERT ? { W: 160, H: 58, SIB: 176, GEN: 150 } : { W: 214, H: 58, SIB: 72, GEN: 300 };
  }
  function place(d) {
    if (VERT) { d.px = d.x; d.py = -d.y; } else { d.px = d.y; d.py = d.x; }
  }
  const pillText = d => d.children ? "Thu gọn" : `${d._kids.length} con`;
  const pillW = d => 30 + pillText(d).length * 7.2;

  function update(source) {
    const D = dims();
    d3.tree().nodeSize([D.SIB, D.GEN]).separation((a, b) => a.parent === b.parent ? 1 : 1.12)(root);
    const nodes = root.descendants(), links = root.links();
    nodes.forEach(place);
    const sx0 = source.px0 ?? source.px, sy0 = source.py0 ?? source.py;

    // generation labels
    const byDepth = d3.group(nodes, d => d.depth);
    const gens = [...byDepth.keys()];
    const minPy = d3.min(nodes, d => d.py), maxPy = d3.max(nodes, d => d.py);
    const gl = gGen.selectAll("g.gen").data(gens, d => d);
    const glE = gl.enter().append("g").attr("class", "gen");
    glE.append("line").attr("class", "genline");
    glE.append("text").attr("class", "genlabel");
    gl.exit().remove();
    const gAll = gGen.selectAll("g.gen");
    if (VERT) {
      const minPx = d3.min(nodes, d => d.px) - D.W / 2 - 14, maxPx = d3.max(nodes, d => d.px) + D.W / 2 + 14;
      gAll.select("line").attr("x1", minPx).attr("x2", maxPx).attr("y1", g => -g * D.GEN + D.H / 2 + 8).attr("y2", g => -g * D.GEN + D.H / 2 + 8);
      gAll.select("text").text(genName).attr("text-anchor", "start")
        .attr("x", g => d3.min(byDepth.get(g), d => d.px) - D.W / 2).attr("y", g => -g * D.GEN + D.H / 2 + 24);
    } else {
      gAll.select("line").attr("x1", g => g * D.GEN).attr("x2", g => g * D.GEN).attr("y1", minPy - 40).attr("y2", maxPy + 50);
      gAll.select("text").text(genName).attr("text-anchor", "middle").attr("x", g => g * D.GEN).attr("y", minPy - 50);
    }

    // links (from the parent's expand button to the child's card)
    const path = (s, t) => {
      if (VERT) {
        const y1 = s.py - D.H / 2 - 26, y2 = t.py + D.H / 2, m = (y1 + y2) / 2;
        return `M${s.px},${y1}C${s.px},${m} ${t.px},${m} ${t.px},${y2}`;
      }
      const x1 = s.px + D.W / 2 + (s._kids ? pillW(s) + 4 : 0), x2 = t.px - D.W / 2, m = (x1 + x2) / 2;
      return `M${x1},${s.py}C${m},${s.py} ${m},${t.py} ${x2},${t.py}`;
    };
    const stub = p => path(p, { px: p.px + (VERT ? 0 : D.W), py: p.py - (VERT ? D.H : 0) });
    const link = gLinks.selectAll("path.link").data(links, d => d.target.id);
    link.enter().append("path").attr("class", "link")
      .attr("d", () => stub({ px: sx0, py: sy0, _kids: source._kids, children: source.children }))
      .merge(link).transition().duration(DUR).attr("d", d => path(d.source, d.target));
    link.exit().transition().duration(DUR).attr("d", () => stub(source)).remove();

    // nodes
    const node = gNodes.selectAll("g.node").data(nodes, d => d.id);
    const nE = node.enter().append("g")
      .attr("transform", `translate(${sx0},${sy0})`).attr("opacity", 0)
      .on("click", (e, d) => { e.stopPropagation(); openPerson(d); });
    nE.append("rect").attr("class", "card");
    nE.append("text").attr("class", "nm");
    nE.append("text").attr("class", "lf");
    nE.append("text").attr("class", "info").text("ⓘ");
    const tg = nE.append("g").attr("class", "pill").attr("role", "button")
      .on("click", (e, d) => { e.stopPropagation(); toggle(d); });
    tg.append("rect").attr("class", "pill-bg");
    tg.append("path").attr("class", "chev");
    tg.append("text").attr("class", "pill-t");
    nE.append("title");

    const nAll = nE.merge(node);
    nAll.attr("class", d => `node ${d.data.sex}${d.data.issue ? " issue" : ""}${d.id === selectedId ? " selected" : ""}${hitIds.has(d.id) ? " hit" : ""}`);
    nAll.select("rect.card").attr("x", -D.W / 2).attr("y", -D.H / 2).attr("width", D.W).attr("height", D.H);
    nAll.select(".nm").attr("x", -D.W / 2 + 12).attr("y", -4).text(d => trunc(d.data.name, VERT ? 18 : 24));
    nAll.select(".lf").attr("x", -D.W / 2 + 12).attr("y", 15).text(d => {
      const p = d.data, s = lifeLine(p), n = p.spouses?.length || 0;
      const sp = n > 1 ? `${n} bà vợ` : n === 1 && !/chưa/i.test(p.spouses[0].name) ? `Vợ: ${p.spouses[0].name}` : "";
      return trunc([s, sp].filter(Boolean).join(" · "), VERT ? 22 : 32);
    });
    nAll.select(".info").attr("x", D.W / 2 - 18).attr("y", -D.H / 2 + 17);
    nAll.select("title").text(d => `${d.data.name}: nhấn để xem chi tiết${d._kids ? " và mở các con" : ""}`);

    const pills = nAll.select(".pill").style("display", d => d._kids ? null : "none")
      .classed("open", d => !!d.children)
      .attr("aria-label", d => d.children ? "Thu gọn nhánh" : `Mở ${d._kids?.length || 0} người con`);
    pills.attr("transform", d => {
      if (!d._kids) return null;
      return VERT ? `translate(${-pillW(d) / 2},${-D.H / 2 - 26})` : `translate(${D.W / 2 + 4},${-12})`;
    });
    pills.select(".pill-bg").attr("width", d => d._kids ? pillW(d) : 0).attr("height", 24).attr("rx", 12);
    // chevron points toward the children when closed, back toward the card when open
    pills.select(".chev").attr("d", d => {
      const up = VERT ? !d.children : !!d.children; // vertical: closed ▲, open ▼ ; horizontal: closed ▶, open ◀
      if (VERT) return up ? "M9,15 L14,9 L19,15" : "M9,9 L14,15 L19,9";
      return d.children ? "M17,7 L11,12 L17,17" : "M11,7 L17,12 L11,17";
    });
    pills.select(".pill-t").attr("x", 24).attr("y", 16.5).text(d => d._kids ? pillText(d) : "");

    nAll.transition().duration(DUR).attr("opacity", 1).attr("transform", d => `translate(${d.px},${d.py})`);
    node.exit().transition().duration(DUR).attr("opacity", 0)
      .attr("transform", `translate(${source.px},${source.py})`).remove();

    nodes.forEach(d => { d.px0 = d.px; d.py0 = d.py; });
  }

  // Tapping a card shows details and, if the branch is closed, opens it.
  function openPerson(d) {
    const opened = d._kids && !d.children;
    if (opened) { d.children = d._kids; update(d); }
    select(d.id);
    if (opened) setTimeout(() => revealKids(d), DUR + 20);
    dismissTip();
  }

  function toggle(d) {
    d.children = d.children ? null : d._kids;
    update(d);
    if (d.children) setTimeout(() => revealKids(d), DUR + 20);
    if (selectedId === d.id) renderPanel(d);
    dismissTip();
  }

  // ---------- view helpers ----------
  function size() { const r = svg.node().getBoundingClientRect(); return [r.width, r.height]; }
  function fit(animate = true) {
    const D = dims(), nodes = root.descendants();
    const x1 = d3.min(nodes, d => d.px) - D.W / 2 - 20, x2 = d3.max(nodes, d => d.px) + D.W / 2 + (VERT ? 20 : 110);
    const y1 = d3.min(nodes, d => d.py) - D.H - 60, y2 = d3.max(nodes, d => d.py) + D.H + 20;
    const [w, h] = size();
    let k = Math.min(1.1, 0.92 * Math.min(w / (x2 - x1), h / (y2 - y1)));
    let tx = w / 2 - k * (x1 + x2) / 2, ty = h / 2 - k * (y1 + y2) / 2;
    const minK = VERT ? 0.72 : 0.6;
    if (k < minK) {
      k = minK; // keep text readable; the rest is reachable by dragging
      if (VERT) { tx = w / 2 - k * root.px; ty = h - 76 - k * (root.py + D.H / 2); } // root at the bottom
      else { tx = 16 - k * x1; }
    }
    (animate ? svg.transition().duration(500) : svg).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  }
  function centerOn(d) {
    const [w, h] = size();
    const mobile = isMobile();
    const k = Math.max(d3.zoomTransform(svg.node()).k, VERT ? 0.8 : 0.85);
    const cx = mobile ? w / 2 : (panel.hidden ? w / 2 : (w - 400) / 2);
    const cy = mobile && !panel.hidden ? (h - panel.offsetHeight) / 2 : h / 2;
    svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(cx - k * d.px, cy - k * d.py).scale(k));
  }

  // After a branch opens, slide the view so the person and their children are in sight.
  function revealKids(d) {
    if (!d.children) return;
    const [w, h] = size(), D = dims(), t = d3.zoomTransform(svg.node()), k = t.k;
    const xs = d.children.map(c => c.px), ys = d.children.map(c => c.py);
    let cx, cy;
    if (VERT) { // parent near the bottom of the view, children above it
      cx = (d3.min(xs) + d3.max(xs)) / 2; if ((d3.max(xs) - d3.min(xs) + D.W) * k > w) cx = d.px;
      const sheet = !panel.hidden ? panel.offsetHeight : 0;
      const tx = w / 2 - k * cx, ty = (h - sheet) - (sheet ? 16 : 84) - k * (d.py + D.H / 2);
      return svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    }
    cy = (d3.min(ys) + d3.max(ys)) / 2; if ((d3.max(ys) - d3.min(ys) + D.H) * k > h) cy = d.py;
    const right = panel.hidden ? w : w - 400;
    const tx = Math.min(t.x, right - 40 - k * (d.children[0].px + D.W / 2));
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(Math.max(tx, 40 - k * (d.px - D.W / 2)), h / 2 - k * cy).scale(k));
  }

  // ---------- first-visit tip ----------
  function showTip() {
    let seen = null; try { seen = localStorage.getItem("giapha-tip"); } catch (e) {}
    if (!seen) document.getElementById("tip").hidden = false;
  }
  function dismissTip() {
    const t = document.getElementById("tip"); if (t.hidden) return;
    t.hidden = true; try { localStorage.setItem("giapha-tip", "1"); } catch (e) {}
  }

  function focusPerson(id, center = true) {
    const d = byId.get(id); if (!d) return;
    if (mode === "3d") { select(id, false); if (center) T3.focus(id); return; }
    revealPath(d);
    update(d.parent || d);
    select(id, false);
    if (center) setTimeout(() => centerOn(d), DUR + 20);
  }

  function select(id, recenter) {
    selectedId = id;
    const d = byId.get(id);
    gNodes.selectAll("g.node").classed("selected", n => n.id === id);
    T3 && T3.setSelected(id);
    renderPanel(d);
    panel.hidden = false;
    history.replaceState(null, "", "#" + encodeURIComponent(id));
    if (recenter) centerOn(d);
  }

  // ---------- detail panel ----------
  function renderPanel(d) {
    const p = d.data, parent = d.parent;
    const row = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : "";
    const gen = p.gen != null ? genName(p.gen) : "";
    const spouseLabel = p.sex === "f" ? "Chồng" : (p.spouses?.length > 1 ? "Các bà vợ" : "Vợ");
    let h = `<h2>${esc(p.name)}</h2>
      <div>${gen ? `<span class="tag">${esc(gen)}</span>` : ""}${p.code ? `<span class="tag">${esc(p.code)}</span>` : ""}
      <span class="tag">${p.sex === "f" ? "Nữ" : "Nam"}</span>${p.adopted ? `<span class="tag">Con nuôi</span>` : ""}</div>
      <dl>${row("Năm sinh – mất", p.life)}${row("Ngày giỗ", p.gio)}${row("Nơi ở", p.place)}${row("Hôn nhân", p.married)}${row("Ghi chú", p.note)}</dl>`;
    if (p.issue) h += `<div class="issue"><b>Cần xác nhận:</b> ${esc(p.issue)}</div>`;
    if (p.spouses?.length) {
      h += `<h3>${spouseLabel}</h3>` + p.spouses.map(s => `<div class="spouse"><b>${esc(s.name)}</b>
        <span>${[s.life, s.gio && "Giỗ " + s.gio, s.origin, s.note].filter(Boolean).map(esc).join(" · ")}</span></div>`).join("");
    }
    if (parent) h += `<h3>Cha</h3><div class="chips">${chip(parent)}</div>`;
    if (d._kids) h += `<h3>Các con (${d._kids.length})</h3><div class="chips">${d._kids.map(chip).join("")}</div>`;
    if (parent) {
      const sib = parent._kids.filter(s => s !== d);
      if (sib.length) h += `<h3>Anh chị em</h3><div class="chips">${sib.map(chip).join("")}</div>`;
    }
    h += `<div class="actions">${d._kids ? `<button data-act="toggle">${d.children ? "Thu gọn nhánh" : "Mở nhánh"}</button>` : ""}
      <button data-act="center">Xem trên cây</button><button data-act="share">Sao chép liên kết</button></div>`;
    panelBody.innerHTML = h;
    panelBody.scrollTop = 0; panel.scrollTop = 0;
  }
  function chip(n) { return `<button class="chip ${n.data.sex}" data-id="${esc(n.id)}">${esc(n.data.name)}</button>`; }

  // ---------- search ----------
  let INDEX = null;
  function buildIndex() {
    INDEX = [];
    for (const d of byId.values()) {
      const p = d.data;
      INDEX.push({ id: d.id, label: p.name, sub: [genName(p.gen), p.life, p.parent && "con " + byId.get(p.parent).data.name].filter(Boolean).join(" · "),
        key: fold(p.name), extra: fold([p.life, p.gio, p.place, p.married, p.note, p.code].join(" ")) });
      (p.spouses || []).forEach(s => INDEX.push({ id: d.id, label: s.name, sub: `${p.sex === "f" ? "Chồng" : "Vợ"} của ${p.name}`,
        key: fold(s.name), extra: fold([s.life, s.gio, s.origin].join(" ")) }));
    }
  }
  function search(q) {
    if (!INDEX) buildIndex();
    const f = fold(q).trim(); if (!f) return [];
    const words = f.split(/\s+/);
    const scored = [];
    for (const it of INDEX) {
      const hay = it.key + " " + it.extra;
      if (!words.every(w => hay.includes(w))) continue;
      let s = it.key === f ? 0 : it.key.endsWith(f) ? 1 : it.key.includes(f) ? 2 : words.every(w => it.key.includes(w)) ? 3 : 5;
      scored.push([s, it]);
    }
    return scored.sort((a, b) => a[0] - b[0] || a[1].label.localeCompare(b[1].label, "vi")).slice(0, 40).map(x => x[1]);
  }

  // ---------- UI bindings ----------
  function bindUI() {
    const q = document.getElementById("q"), res = document.getElementById("results");
    let cur = -1, items = [];
    const render = () => {
      items = search(q.value);
      hitIds = new Set(q.value.trim() ? items.map(i => i.id) : []);
      gNodes.selectAll("g.node").classed("hit", n => hitIds.has(n.id));
      T3 && T3.setHits(hitIds);
      if (!q.value.trim()) { res.hidden = true; return; }
      res.innerHTML = items.length ? items.map((it, i) => `<li role="option" data-i="${i}" aria-selected="${i === cur}">
          <div class="r-name">${esc(it.label)}</div><div class="r-sub">${esc(it.sub)}</div></li>`).join("")
        : `<li class="empty">Không tìm thấy kết quả</li>`;
      res.hidden = false;
    };
    const choose = i => { const it = items[i]; if (!it) return; res.hidden = true; q.blur(); focusPerson(it.id); };
    q.addEventListener("input", () => { cur = -1; render(); });
    q.addEventListener("focus", () => q.value.trim() && render());
    q.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { cur = Math.min(cur + 1, items.length - 1); render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { cur = Math.max(cur - 1, 0); render(); e.preventDefault(); }
      else if (e.key === "Enter") choose(cur < 0 ? 0 : cur);
      else if (e.key === "Escape") { q.value = ""; render(); }
    });
    res.addEventListener("pointerdown", e => { const li = e.target.closest("li[data-i]"); if (li) { e.preventDefault(); choose(+li.dataset.i); } });
    document.addEventListener("pointerdown", e => { if (!e.target.closest(".search")) res.hidden = true; });

    document.getElementById("zoomIn").onclick = () => mode === "3d" ? T3.zoomBy(1.3) : svg.transition().duration(250).call(zoom.scaleBy, 1.3);
    document.getElementById("zoomOut").onclick = () => mode === "3d" ? T3.zoomBy(1 / 1.3) : svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.3);
    document.getElementById("fit").onclick = () => mode === "3d" ? T3.fit() : fit();
    document.getElementById("mode").onclick = () => setMode(mode === "3d" ? "2d" : "3d");
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => T3 && T3.retheme());
    document.getElementById("expandAll").onclick = () => { expandAll(); update(root); setTimeout(fit, DUR); };
    document.getElementById("collapseAll").onclick = () => { collapseTo(VERT ? 2 : 3); update(root); setTimeout(fit, DUR); };
    document.getElementById("closePanel").onclick = closePanel;
    svg.on("click", closePanel);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden && document.activeElement !== q) closePanel(); });

    panelBody.addEventListener("click", e => {
      const c = e.target.closest("[data-id]");
      if (c) return focusPerson(c.dataset.id);
      const a = e.target.closest("[data-act]"); if (!a) return;
      const d = byId.get(selectedId);
      if (a.dataset.act === "toggle") toggle(d);
      else if (a.dataset.act === "center") mode === "3d" ? T3.focus(d.id) : centerOn(d);
      else if (a.dataset.act === "share") {
        navigator.clipboard?.writeText(location.href).then(() => { a.textContent = "Đã sao chép"; setTimeout(() => a.textContent = "Sao chép liên kết", 1500); });
      }
    });

    // swipe down to close the bottom sheet on mobile
    let sy = null;
    panel.addEventListener("touchstart", e => { sy = panel.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    panel.addEventListener("touchend", e => { if (sy != null && e.changedTouches[0].clientY - sy > 90) closePanel(); sy = null; });

    const dlg = document.getElementById("notes");
    document.getElementById("info").onclick = () => { renderNotes(); dlg.showModal(); };
    document.getElementById("closeNotes").onclick = () => dlg.close();
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
    document.getElementById("tipOk").onclick = dismissTip;
    let rz;
    window.addEventListener("resize", () => {
      clearTimeout(rz);
      rz = setTimeout(() => { if (isMobile() !== VERT) { VERT = isMobile(); update(root); fit(false); } }, 150);
    });
  }

  function closePanel() {
    panel.hidden = true; selectedId = null;
    gNodes.selectAll("g.node").classed("selected", false);
    T3 && T3.setSelected(null);
    history.replaceState(null, "", location.pathname + location.search);
  }

  function renderNotes() {
    const m = DATA.meta, issues = DATA.people.filter(p => p.issue);
    document.getElementById("notesBody").innerHTML = `
      <h2>${esc(m.title)}</h2><p>${esc(m.origin)}</p>
      <p>Tổng cộng ${DATA.people.length} người mang huyết thống trong cây (chưa kể vợ, chồng), qua ${new Set(DATA.people.map(p => p.gen)).size} đời.</p>
      <h3>Cách dùng</h3>
      <ul><li>Kéo để di chuyển, cuộn chuột hoặc chụm hai ngón tay để phóng to, thu nhỏ.</li>
      <li>Nhấn vào ô tên để xem chi tiết và mở các con của người đó. Nút “▸ N con” mở nhánh, nút “Thu gọn” đóng nhánh.</li>
      <li>Trên điện thoại, cây mọc từ dưới lên: Thủy tổ ở dưới cùng, con cháu ở phía trên.</li>
      <li>Nút “Xem 3D” chuyển sang cây 3D hình nón: kéo để xoay, chụm hoặc cuộn để phóng to, nhấn vào tên để xem chi tiết.</li>
      <li>Ô tìm kiếm không cần gõ dấu, ví dụ “hua van hiep”, “1944”, “xom 4”.</li></ul>
      <h3>Ghi chú về dữ liệu</h3><ul>${m.sourceNotes.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      <h3>Những chỗ cần gia đình xác nhận (${issues.length})</h3>
      <ul>${issues.map(p => `<li><b>${esc(p.name)}</b>: ${esc(p.issue)}</li>`).join("")}</ul>
      <h3>Tham khảo tự điển Hán Việt cổ đại</h3>
      <table>${DATA.glossary.map(([h, v, m]) => `<tr><td class="han">${esc(h)}</td><td><b>${esc(v)}</b></td><td>${esc(m)}</td></tr>`).join("")}</table>`;
  }
})();
