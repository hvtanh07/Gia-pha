/* Cây gia phả họ Hứa – d3 v7 */
(() => {
  "use strict";
  const CARD_W = 210, CARD_H = 54, GAP_Y = 68, GAP_X = 270, DUR = 350;
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
    collapseTo(3);
    update(root);
    fit(false);
    bindUI();
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
    loading3d = loading3d || ["vendor/three.min.js", "vendor/three-spritetext.min.js", "vendor/3d-force-graph.min.js", "view3d.js"]
      .reduce((p, src) => p.then(() => loadScript(src)), Promise.resolve());
    return loading3d;
  }
  async function setMode(m) {
    const btn = document.getElementById("mode"), host = document.getElementById("tree3d");
    if (m === "3d") {
      btn.disabled = true; btn.textContent = "Đang tải…";
      try { await load3d(); } catch (e) { btn.disabled = false; btn.textContent = "3D"; alertBox("Không tải được chế độ 3D."); return; }
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
    btn.textContent = m === "3d" ? "2D" : "3D";
    btn.title = m === "3d" ? "Chuyển sang sơ đồ 2D" : "Chuyển sang chế độ 3D";
    try { localStorage.setItem("giapha-mode", m); } catch (e) {}
  }
  function alertBox(msg) { const p = document.createElement("div"); p.className = "toast"; p.textContent = msg; document.body.appendChild(p); setTimeout(() => p.remove(), 3000); }

  function collapseTo(depth) {
    root.each(d => { d.children = d.depth < depth ? d._kids : null; });
  }
  function expandAll() { root.each(d => { d.children = d._kids; }); }
  function revealPath(d) { for (let a = d.parent; a; a = a.parent) a.children = a._kids; }

  function lifeLine(p) {
    const bits = [];
    if (p.life) bits.push(p.life);
    if (p.gio && !p.life) bits.push("Giỗ " + p.gio);
    return bits.join(" · ");
  }
  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  function update(source) {
    const layout = d3.tree().nodeSize([GAP_Y, GAP_X]).separation((a, b) => a.parent === b.parent ? 1 : 1.15);
    layout(root);
    const nodes = root.descendants(), links = root.links();
    const x0 = source.x0 ?? source.x, y0 = source.y0 ?? source.y;

    // generation guides
    const minX = d3.min(nodes, d => d.x) - 60, maxX = d3.max(nodes, d => d.x) + 60;
    const depths = [...new Set(nodes.map(d => d.depth))];
    const gl = gGen.selectAll("g.gen").data(depths, d => d);
    const glE = gl.enter().append("g").attr("class", "gen");
    glE.append("line").attr("class", "genline");
    glE.append("text").attr("class", "genlabel").attr("text-anchor", "middle");
    gl.exit().remove();
    gGen.selectAll("g.gen").select("line").transition().duration(DUR)
      .attr("x1", d => d * GAP_X).attr("x2", d => d * GAP_X).attr("y1", minX + 10).attr("y2", maxX);
    gGen.selectAll("g.gen").select("text").text(d => genName(d)).transition().duration(DUR)
      .attr("x", d => d * GAP_X).attr("y", minX - 4);

    // links
    const diag = (s, t) => `M${s.y + CARD_W / 2},${s.x}C${(s.y + t.y) / 2 + CARD_W / 4},${s.x} ${(s.y + t.y) / 2 + CARD_W / 4},${t.x} ${t.y - CARD_W / 2},${t.x}`;
    const link = gLinks.selectAll("path.link").data(links, d => d.target.id);
    link.enter().append("path").attr("class", "link")
      .attr("d", () => diag({ x: x0, y: y0 }, { x: x0, y: y0 + CARD_W }))
      .merge(link).transition().duration(DUR).attr("d", d => diag(d.source, d.target));
    link.exit().transition().duration(DUR)
      .attr("d", () => diag({ x: source.x, y: source.y }, { x: source.x, y: source.y + CARD_W })).remove();

    // nodes
    const node = gNodes.selectAll("g.node").data(nodes, d => d.id);
    const nE = node.enter().append("g")
      .attr("transform", `translate(${y0},${x0})`).attr("opacity", 0)
      .on("click", (e, d) => { e.stopPropagation(); select(d.id); });
    nE.append("rect").attr("class", "card").attr("x", -CARD_W / 2).attr("y", -CARD_H / 2)
      .attr("width", CARD_W).attr("height", CARD_H);
    nE.append("text").attr("class", "nm").attr("x", -CARD_W / 2 + 12).attr("y", -4);
    nE.append("text").attr("class", "lf").attr("x", -CARD_W / 2 + 12).attr("y", 15);
    const tg = nE.append("g").attr("class", "toggle").attr("transform", `translate(${CARD_W / 2},0)`)
      .on("click", (e, d) => { e.stopPropagation(); toggle(d); });
    tg.append("circle").attr("r", 11);
    tg.append("text").attr("text-anchor", "middle").attr("dy", "0.35em");
    nE.append("title");

    const nAll = nE.merge(node);
    nAll.attr("class", d => `node ${d.data.sex}${d.data.issue ? " issue" : ""}${d.id === selectedId ? " selected" : ""}${hitIds.has(d.id) ? " hit" : ""}`);
    nAll.select(".nm").text(d => trunc(d.data.name, 24));
    nAll.select(".lf").text(d => {
      const p = d.data, s = lifeLine(p), n = p.spouses?.length || 0;
      const sp = n > 1 ? `${n} bà vợ` : n === 1 && !/chưa/i.test(p.spouses[0].name) ? `Vợ: ${p.spouses[0].name}` : "";
      return trunc([s, sp].filter(Boolean).join(" · "), 32);
    });
    nAll.select("title").text(d => d.data.name);
    nAll.select(".toggle").style("display", d => d._kids ? null : "none")
      .select("text").text(d => d.children ? "−" : d._kids ? String(d._kids.length) : "");
    nAll.transition().duration(DUR).attr("opacity", 1).attr("transform", d => `translate(${d.y},${d.x})`);
    node.exit().transition().duration(DUR).attr("opacity", 0)
      .attr("transform", `translate(${source.y},${source.x})`).remove();

    nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
  }

  function toggle(d) {
    d.children = d.children ? null : d._kids;
    update(d);
    if (selectedId === d.id) renderPanel(d);
  }

  // ---------- view helpers ----------
  function size() { const r = svg.node().getBoundingClientRect(); return [r.width, r.height]; }
  function fit(animate = true) {
    const nodes = root.descendants();
    const x1 = d3.min(nodes, d => d.y) - CARD_W / 2 - 20, x2 = d3.max(nodes, d => d.y) + CARD_W / 2 + 30;
    const y1 = d3.min(nodes, d => d.x) - CARD_H - 50, y2 = d3.max(nodes, d => d.x) + CARD_H + 20;
    const [w, h] = size();
    let k = Math.min(1.2, 0.92 * Math.min(w / (x2 - x1), h / (y2 - y1)));
    let tx = w / 2 - k * (x1 + x2) / 2;
    if (k < 0.6) { k = 0.6; tx = 16 - k * x1; } // keep text readable on small screens; pan to see the rest
    const t = d3.zoomIdentity.translate(tx, h / 2 - k * (y1 + y2) / 2).scale(k);
    (animate ? svg.transition().duration(500) : svg).call(zoom.transform, t);
  }
  function centerOn(d) {
    const [w, h] = size();
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    const k = Math.max(d3.zoomTransform(svg.node()).k, 0.85);
    const cx = mobile ? w / 2 : (panel.hidden ? w / 2 : (w - 400) / 2);
    const cy = mobile && !panel.hidden ? h * 0.28 : h / 2;
    svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(cx - k * d.y, cy - k * d.x).scale(k));
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
    document.getElementById("collapseAll").onclick = () => { collapseTo(3); update(root); setTimeout(fit, DUR); };
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
    window.addEventListener("resize", () => { if (panel.hidden) return; });
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
      <li>Nhấn vào một người để xem chi tiết. Nhấn vào nút tròn bên phải ô (số con) để mở hoặc thu gọn nhánh.</li>
      <li>Ô tìm kiếm không cần gõ dấu, ví dụ “hua van hiep”, “1944”, “xom 4”.</li></ul>
      <h3>Ghi chú về dữ liệu</h3><ul>${m.sourceNotes.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      <h3>Những chỗ cần gia đình xác nhận (${issues.length})</h3>
      <ul>${issues.map(p => `<li><b>${esc(p.name)}</b>: ${esc(p.issue)}</li>`).join("")}</ul>
      <h3>Tham khảo tự điển Hán Việt cổ đại</h3>
      <table>${DATA.glossary.map(([h, v, m]) => `<tr><td class="han">${esc(h)}</td><td><b>${esc(v)}</b></td><td>${esc(m)}</td></tr>`).join("")}</table>`;
  }
})();
