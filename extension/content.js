"use strict";
(() => {
  // src/core/classify.ts
  var KIND_LABELS = {
    path: "PATH",
    level: "LEVEL",
    project: "PROJECT",
    req: "REQUIRED",
    step: "STEP",
    after: "AFTER SPEECH",
    choose: "PICK ELECTIVES"
  };
  var STATE_LABELS = {
    done: "\u2714 DONE",
    todo: "TO DO",
    next: "\u2605 NEXT"
  };
  var isRequired = (title) => /^level\s*\d+\s*:/i.test(title) || /completion\s*$/i.test(title) || /^reflect on your path/i.test(title);
  var isChooser = (title) => /^electives?$/i.test(title);
  var kindOf = (title) => isRequired(title) ? "req" : isChooser(title) ? "choose" : "project";
  var isAfterSpeech = (title) => /^complete your project/i.test(title);
  var labelFor = (kind, state) => state ? `${KIND_LABELS[kind]} \xB7 ${STATE_LABELS[state]}` : KIND_LABELS[kind];
  var crumbKind = (index, text) => {
    if (index === 1) return "path";
    if (index === 2) return "level";
    if (index >= 3) return kindOf(text);
    return null;
  };

  // src/core/banners.ts
  var INTRO_STEP = /^introduction and assignment$/i;
  var purposeHint = ({ stepTitle, projectSteps, projectIsDone }) => {
    if (projectIsDone || INTRO_STEP.test(stepTitle.trim())) return null;
    if (!projectSteps.some((step) => INTRO_STEP.test(step.trim()))) return null;
    return {
      chip: "FOR YOUR PAPER FORM",
      cls: "tm-b-req",
      text: "Need the project purpose or the speech time? Both are on the \u201CIntroduction and Assignment\u201D step of this project."
    };
  };
  var bannerFor = (stepTitle, levelTitle) => {
    if (/checklist and completion/i.test(stepTitle)) {
      const level = levelTitle || "this level";
      return {
        chip: "REQUIRED",
        cls: "tm-b-req",
        text: `REQUIRED before ${level} is finished: complete EVERY item on this checklist (including your Successful Club Series presentation, if your level lists one), then scroll to the bottom and press \u201CComplete My Requirements\u201D.`
      };
    }
    if (/^level\s*\d+\s*requirements$/i.test(stepTitle.trim())) {
      return {
        chip: "ALSO REQUIRED",
        cls: "tm-b-req",
        text: "This page lists what the level needs besides its projects. If it shows a Successful Club Series, choosing and giving one of those presentations is required to finish the level. You can do it any time, so it is your next step once every project is finished. Tick it off on the Checklist step that follows."
      };
    }
    if (isAfterSpeech(stepTitle)) {
      return {
        chip: "AFTER YOUR SPEECH",
        cls: "tm-b-after",
        text: "Do this step AFTER you have given your speech and received your evaluation. Not before. This is where you record what you learned (Know / Wonder / Learned) and log your speech (title, date, club, evaluator). Tip: \u201CSave & Email\u201D notifies your evaluator, so only use it when you are ready."
      };
    }
    return null;
  };

  // src/core/electives.ts
  var parseMinimumRequired = (pageText) => {
    const match = pageText.match(/Minimum of (\d+) Required Projects?/i);
    return match?.[1] ? parseInt(match[1], 10) : null;
  };
  var recordMinimum = (existing, level, min, now) => {
    if (existing[level]?.min === min) return null;
    return { ...existing, [level]: { min, savedAt: now } };
  };

  // src/core/location.ts
  var whereParts = ({ breadcrumb, hasPathCards: hasPathCards2 }) => {
    const parts = [];
    if (breadcrumb) {
      if (breadcrumb.names.length === 0 && breadcrumb.lastItemText) parts.push(["path", breadcrumb.lastItemText]);
      breadcrumb.names.forEach((name, i) => {
        parts.push([crumbKind(i + 1, name) ?? "project", name]);
      });
      if (breadcrumb.unitNumber) parts.push(["step", `Step ${breadcrumb.unitNumber}`]);
    } else if (hasPathCards2) {
      parts.push(["path", "Pick a Path to open"]);
    }
    return parts;
  };
  var nextUpText = (next) => {
    if (!next) return null;
    const what = next.titles.length > 1 ? `any one of: ${next.titles.join(" \xB7 ")}` : `${next.titles[0] ?? ""}${next.pick ? " (pick another elective)" : ""}`;
    return `\u2605 Next up: ${next.level} \u203A ${what} (from your last Overview visit)`;
  };

  // src/core/overview-plan.ts
  var NOTE_UNKNOWN_COUNT = "Pick more electives (open this page once to see how many)";
  var settledState = (ariaLabel) => {
    if (/incomplete/i.test(ariaLabel)) return "todo";
    if (/complete/i.test(ariaLabel)) return "done";
    return null;
  };
  var toRow = (isLevel) => (link) => ({
    title: link.title,
    kind: isLevel ? kindOf(link.title) : "req",
    state: settledState(link.ariaLabel),
    note: "",
    indented: link.indented
  });
  var toUnits = (rows, min) => {
    const units = [];
    for (const row of rows) {
      const last = units[units.length - 1];
      if (row.kind === "choose") {
        units.push({ group: true, chooser: row, kids: [], min: min ?? 0, needPick: false, pendingKids: [] });
      } else if (row.indented && last?.group) {
        last.kids.push(row);
      } else {
        units.push({ group: false, link: row });
      }
    }
    for (const unit of units) {
      if (!unit.group) continue;
      unit.needPick = min ? unit.kids.length < min : unit.chooser.state === "todo";
      unit.pendingKids = unit.kids.filter((kid) => kid.state === "todo");
      unit.chooser.note = unit.needPick ? min ? `Pick ${min - unit.kids.length} more (${min} required)` : NOTE_UNKNOWN_COUNT : "";
    }
    return units;
  };
  var isPending = (unit) => unit.group ? unit.pendingKids.length > 0 || unit.needPick : unit.link.kind === "project" && unit.link.state === "todo";
  var chooseNext = (name, units, rows) => {
    const unit = units.find(isPending);
    if (unit) {
      if (!unit.group) {
        unit.link.state = "next";
        return { level: name, titles: [unit.link.title], pick: false };
      }
      if (unit.pendingKids.length > 0) {
        for (const kid of unit.pendingKids) {
          kid.state = "next";
          if (unit.pendingKids.length > 1) kid.note = "Any one of these could be your next project";
        }
        return { level: name, titles: unit.pendingKids.map((kid) => kid.title), pick: false };
      }
      unit.chooser.state = "next";
      return { level: name, titles: [unit.chooser.title], pick: true };
    }
    const remaining = rows.find((row) => row.state === "todo");
    if (!remaining) return null;
    remaining.state = "next";
    return { level: name, titles: [remaining.title], pick: false };
  };
  var headerState = (isLevel, lmsDone, rows, incomplete) => {
    if (isLevel) return lmsDone ? "done" : "todo";
    if (rows.length === 0) return null;
    return incomplete > 0 ? "todo" : "done";
  };
  var planOverview = (sections, electives) => {
    const prepared = sections.map((section) => {
      const isLevel = /^level\s*\d+/i.test(section.name);
      const rows = section.links.map(toRow(isLevel));
      const units = toUnits(rows, electives[section.name]?.min);
      return { section, isLevel, rows, units };
    });
    let next = null;
    for (const item of prepared) {
      next = chooseNext(item.section.name, item.units, item.rows);
      if (next) break;
    }
    const items = {};
    const pickMore = {};
    const planned = prepared.map(({ section, isLevel, rows, units }) => {
      const incomplete = rows.filter((row) => row.state === "todo" || row.state === "next").length;
      for (const unit of units) {
        if (unit.group && unit.needPick) pickMore[section.name] = unit.min ? unit.min - unit.kids.length : -1;
      }
      for (const row of rows) {
        items[`${section.name}|${row.title}`] = row.state === "next" ? "todo" : row.state;
      }
      const headerKind = isLevel ? "level" : "req";
      return {
        name: section.name,
        isLevel,
        headerKind,
        headerState: headerState(isLevel, section.lmsDone, rows, incomplete),
        headerNote: section.lmsDone && incomplete > 0 ? `\u26A0 ${incomplete} item(s) still incomplete` : "",
        links: rows.map(({ title, kind, state, note }) => ({ title, kind, state, note }))
      };
    });
    return { sections: planned, saved: { items, next, pickMore } };
  };

  // src/core/sidebar-plan.ts
  var REQUIREMENTS_STEP = /^level\s*\d+\s*requirements$/i;
  var INTRO_STEP2 = /^introduction and assignment$/i;
  var NOTE_PRINT_EVALUATION = "PRINT the Evaluation Resource for your evaluator";
  var NOTE_PAPER_FORM = "FOR YOUR PAPER FORM: purpose & speech time";
  var NOTE_REQUIREMENTS = "Pick a Club Series presentation";
  var pickNote = (need) => {
    if (!need) return "";
    if (need < 0) return "Pick more electives";
    return `Pick ${need} more elective${need > 1 ? "s" : ""}`;
  };
  var planSidebar = ({ level, wrappers, saved, clubSeriesPicked, evaluationResourceSteps }) => wrappers.map((wrapper) => {
    const kind = kindOf(wrapper.title);
    let state = saved.items?.[`${level}|${wrapper.title}`] ?? null;
    if (saved.next && saved.next.level === level && saved.next.titles.includes(wrapper.title)) state = "next";
    const need = kind === "choose" ? saved.pickMore?.[level] ?? 0 : 0;
    const steps = wrapper.steps.map((step, index) => {
      let settled = /not completed/i.test(step.srText) ? "todo" : /completed/i.test(step.srText) ? "done" : null;
      let note = pickNote(need);
      if (need) settled = "todo";
      if (REQUIREMENTS_STEP.test(step.title.trim())) {
        settled = clubSeriesPicked ? "done" : null;
        note = clubSeriesPicked ? "" : NOTE_REQUIREMENTS;
      }
      if (kind === "project" && state !== "done" && INTRO_STEP2.test(step.title.trim())) note = NOTE_PAPER_FORM;
      if (evaluationResourceSteps?.[wrapper.title] === index) note = NOTE_PRINT_EVALUATION;
      return { kind: isAfterSpeech(step.title) ? "after" : "step", state: settled, note };
    });
    return { kind, state, steps };
  });

  // src/adapters/dom.ts
  var txt = (el2) => (el2?.textContent ?? "").replace(/\s+/g, " ").trim();
  var q = (selector, ctx = document) => ctx.querySelector(selector);
  var qa = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));
  function setAttr(el2, name, value) {
    if (!el2) return;
    if (value === null || value === void 0 || value === "") {
      if (el2.hasAttribute(name)) el2.removeAttribute(name);
    } else if (el2.getAttribute(name) !== value) {
      el2.setAttribute(name, value);
    }
  }
  function mark(el2, kind, state) {
    setAttr(el2, "data-tm", kind);
    setAttr(el2, "data-tm-label", labelFor(kind, state));
    setAttr(el2, "data-tm-s", state ?? "");
  }
  function markRow(el2, kind, state) {
    setAttr(el2, "data-tm-row", kind);
    setAttr(el2, "data-tm-state", state === "next" ? "next" : "");
  }
  function courseId() {
    try {
      return decodeURIComponent(location.pathname).match(/course-v1:[^/]+/)?.[0] ?? "";
    } catch {
      return "";
    }
  }

  // src/adapters/course-page.ts
  var BREADCRUMB = 'nav[aria-label="breadcrumb"]';
  function paintBreadcrumbs() {
    for (const crumb of qa(BREADCRUMB)) {
      qa("a", crumb).forEach((a, i) => setAttr(a, "data-tm-crumb", crumbKind(i, txt(a))));
      setAttr(q(".unit-number", crumb), "data-tm-crumb", "step");
    }
  }
  function readBreadcrumb() {
    const crumb = q(BREADCRUMB);
    if (!crumb) return null;
    return {
      names: qa("a", crumb).slice(1).map(txt),
      lastItemText: txt(q("ol > li:last-child", crumb)),
      unitNumber: txt(q(".unit-number", crumb))
    };
  }
  var hasPathCards = () => !!q(".MuiCardActionArea-root");
  function readElectivesRequirement() {
    const links = qa(BREADCRUMB + " a");
    if (!links.some((a) => kindOf(txt(a)) === "choose")) return null;
    const level = txt(links[2]);
    const text = (q("main") ?? document.body).innerText ?? "";
    const min = parseMinimumRequired(text);
    return level && min !== null ? { level, min } : null;
  }
  function paintDashboard() {
    for (const button of qa(".MuiCardActionArea-root")) {
      const heading = q("h3", button);
      if (!heading) continue;
      mark(heading, "path", null);
      markRow(button.closest(".MuiPaper-root"), "path", null);
    }
  }
  var currentLevel = () => txt(q(".course-section-title"));
  function readSidebar() {
    const elements = qa(".nav-link-wrapper");
    const wrappers = elements.map((w) => ({
      title: txt(q("a.nav-link .nav-title", w)),
      steps: qa("a.subNav-link", w).map((s) => ({ title: txt(q(".nav-title", s)), srText: txt(q(".sr-only", s)) }))
    }));
    return { wrappers, elements };
  }
  function paintSidebar(elements, plan) {
    qa(".course-overview .course-title").forEach((el2) => mark(el2, "path", null));
    const level = q(".course-section-title");
    if (level) mark(level, "level", null);
    elements.forEach((wrapper, i) => {
      const planned = plan[i];
      const titleEl = q("a.nav-link .nav-title", wrapper);
      if (!planned || !titleEl || !txt(titleEl)) return;
      mark(titleEl, planned.kind, planned.state);
      markRow(wrapper, planned.kind, planned.state);
      qa("a.subNav-link", wrapper).forEach((step, j) => {
        const plannedStep = planned.steps[j];
        const title = q(".nav-title", step);
        if (!plannedStep) return;
        setAttr(title, "data-tm-note", plannedStep.note);
        mark(title, plannedStep.kind, plannedStep.state);
      });
    });
  }
  var activeStepTitle = () => txt(q("a.subNav-link.active .nav-title"));
  var activeProjectIndex = (elements) => elements.findIndex((w) => !!q("a.subNav-link.active", w));
  var activeStepIndex = (elements, projectIndex) => qa("a.subNav-link", elements[projectIndex]).findIndex((step) => step.classList.contains("active"));
  function paintBox(id, banner) {
    const wrapper = q(".unit-iframe-wrapper");
    const existing = document.getElementById(id);
    if (!wrapper || !banner) {
      existing?.remove();
      return;
    }
    if (existing) {
      if (existing.parentNode === wrapper.parentNode && existing.dataset.tmText === banner.text) return;
      existing.remove();
    }
    const box = document.createElement("div");
    box.id = id;
    box.className = `tm-banner ${banner.cls}${id === "tm-hint" ? " tm-b-hint" : ""}`;
    box.dataset.tmText = banner.text;
    box.setAttribute("role", "note");
    const chip = document.createElement("span");
    chip.className = "tm-banner-chip";
    chip.textContent = banner.chip;
    const body = document.createElement("span");
    body.textContent = banner.text;
    box.append(chip, body);
    wrapper.parentNode?.insertBefore(box, wrapper);
  }
  function paintStepBanner(hint) {
    paintBox("tm-banner", q(".unit-iframe-wrapper") ? bannerFor(activeStepTitle(), currentLevel()) : null);
    paintBox("tm-hint", hint);
  }

  // src/core/status.ts
  var isText = (value) => typeof value === "string" && value !== "";
  var normalizeNext = (raw) => {
    if (typeof raw !== "object" || raw === null) return null;
    const saved = raw;
    if (!isText(saved.level)) return null;
    const titles = Array.isArray(saved.titles) ? saved.titles.filter(isText) : isText(saved.title) ? [saved.title] : [];
    if (titles.length === 0) return null;
    return { level: saved.level, titles, pick: saved.pick === true };
  };

  // src/adapters/storage.ts
  var safeGet = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  var safeSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  };
  var readJson = (key, fallback) => {
    try {
      return JSON.parse(safeGet(key) ?? "");
    } catch {
      return fallback;
    }
  };
  var loadStatus = (course) => {
    const saved = readJson(`tmHelper.status.${course}`, null) ?? {};
    return { ...saved, next: normalizeNext(saved.next) };
  };
  var saveStatus = (course, status, now) => safeSet(`tmHelper.status.${course}`, JSON.stringify({ ...status, savedAt: now }));
  var loadElectives = (course) => readJson(`tmHelper.electives.${course}`, {});
  var saveElectives = (course, value) => safeSet(`tmHelper.electives.${course}`, JSON.stringify(value));
  var isClubSeriesPicked = (course, level) => readJson(`tmHelper.clubSeries.${course}`, {})[level] === true;
  var saveClubSeriesPicked = (course, level) => safeSet(`tmHelper.clubSeries.${course}`, JSON.stringify({ ...readJson(`tmHelper.clubSeries.${course}`, {}), [level]: true }));
  var loadEvaluationResourceSteps = (course, level) => readJson(`tmHelper.evaluationResource.${course}`, {})[level] ?? {};
  var saveEvaluationResourceStep = (course, level, project, stepIndex) => {
    const all = readJson(`tmHelper.evaluationResource.${course}`, {});
    safeSet(`tmHelper.evaluationResource.${course}`, JSON.stringify({ ...all, [level]: { ...all[level], [project]: stepIndex } }));
  };
  var isHighlightOn = () => safeGet("tmHelper.on") !== "0";
  var saveHighlightOn = (on) => safeSet("tmHelper.on", on ? "1" : "0");
  var isLegendCollapsed = () => safeGet("tmHelper.collapsed") === "1";
  var saveLegendCollapsed = (collapsed) => safeSet("tmHelper.collapsed", collapsed ? "1" : "0");

  // src/adapters/legend.ts
  var COLORS = {
    path: "#6a2c91",
    level: "#0b5fa5",
    project: "#b45309",
    req: "#b3123f",
    step: "#4b5563",
    after: "#0f766e",
    choose: "#b45309"
  };
  var el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  var swatch = (kind, text) => {
    const s = el("span", "tm-sw", text ?? KIND_LABELS[kind]);
    s.style.background = COLORS[kind];
    return s;
  };
  var legendRow = (kind, description) => {
    const row = el("div", "tm-row");
    row.append(swatch(kind), el("span", "tm-d", description));
    return row;
  };
  var panel = null;
  var lastWhere = "";
  function buildLegend(isOn, onToggle) {
    if (panel || !document.body) return;
    const root2 = el("div");
    root2.id = "tm-legend";
    if (isLegendCollapsed()) root2.classList.add("tm-collapsed");
    const head = el("button", "tm-head");
    head.type = "button";
    head.append(el("span", void 0, "Pathways Highlighter"), el("span", "tm-chev"));
    const reflectState = () => {
      const open = !root2.classList.contains("tm-collapsed");
      head.setAttribute("aria-expanded", String(open));
      head.title = open ? "Click to minimise" : "Click to open";
    };
    reflectState();
    head.addEventListener("click", () => {
      root2.classList.toggle("tm-collapsed");
      saveLegendCollapsed(root2.classList.contains("tm-collapsed"));
      reflectState();
    });
    const body = el("div", "tm-body");
    const where = el("div", "tm-where");
    where.id = "tm-where";
    const nextBox = el("div", "tm-next");
    nextBox.id = "tm-nextbox";
    nextBox.style.display = "none";
    const toggleLabel = el("label", "tm-toggle");
    const checkbox = el("input");
    checkbox.type = "checkbox";
    checkbox.id = "tm-toggle";
    checkbox.checked = isOn();
    checkbox.addEventListener("change", () => onToggle(checkbox.checked));
    toggleLabel.append(checkbox, el("span", void 0, "Highlights on "), el("small", void 0, "(Alt+H)"));
    body.append(
      el("h4", void 0, "You are here"),
      where,
      nextBox,
      el("h4", void 0, "Colour key"),
      legendRow("path", "The whole program, e.g. Presentation Mastery."),
      legendRow("level", "A stage inside a path. Levels 1\u20135."),
      legendRow("project", "A speech/assignment you do in your club."),
      legendRow("req", "Checklist, requirements & completion items. Easy to miss \u2013 needed to finish the level!"),
      legendRow("step", "A page inside a project."),
      legendRow("after", "Fill in only AFTER you have given your speech and been evaluated."),
      el("h4", void 0, "Status"),
      el("div", void 0, "\u2714 DONE \xB7 TO DO \xB7 \u2605 NEXT (first thing not yet complete)"),
      toggleLabel
    );
    root2.append(head, body);
    document.body.appendChild(root2);
    panel = root2;
  }
  function syncToggle(on) {
    const checkbox = document.getElementById("tm-toggle");
    if (checkbox) checkbox.checked = on;
  }
  function updateLegend(parts, nextText) {
    if (!panel) return;
    const where = document.getElementById("tm-where");
    const key = JSON.stringify(parts);
    if (where && key !== lastWhere) {
      lastWhere = key;
      where.replaceChildren();
      if (parts.length === 0) where.appendChild(el("small", void 0, "Open a Path to see where you are."));
      parts.forEach(([kind, text], i) => {
        if (i) where.appendChild(document.createTextNode("\u203A"));
        where.appendChild(swatch(kind, text));
      });
    }
    const nextBox = document.getElementById("tm-nextbox");
    if (!nextBox) return;
    if (nextText) {
      if (nextBox.textContent !== nextText) nextBox.textContent = nextText;
      nextBox.style.display = "";
    } else {
      nextBox.style.display = "none";
    }
  }

  // src/adapters/overview-page.ts
  var expandedOnce = false;
  function expandAllOnce() {
    if (expandedOnce) return;
    const button = qa("button").find((b) => /^\s*expand all\s*$/i.test(b.textContent ?? ""));
    if (button) {
      expandedOnce = true;
      button.click();
    }
  }
  var isIndented = (li) => {
    const first = li?.firstElementChild;
    return !!first && parseFloat(getComputedStyle(first).marginLeft) > 0;
  };
  function readOverviewPage() {
    const roots = qa(".pgn_collapsible").filter((c) => q(".collapsible-trigger h3", c));
    if (roots.length === 0) return null;
    expandAllOnce();
    return roots.map((root2) => {
      const header = q(".collapsible-trigger h3", root2);
      const anchors = qa(".collapsible-body li a", root2);
      return {
        root: root2,
        header,
        anchors,
        data: {
          name: txt(header),
          lmsDone: !!q(".course-section-serial.completed", root2),
          links: anchors.map((a) => ({
            title: txt(a),
            ariaLabel: a.getAttribute("aria-label") ?? "",
            indented: isIndented(a.closest("li"))
          }))
        }
      };
    });
  }
  function paintOverview(page, plan) {
    page.forEach((pageSection, i) => {
      const planned = plan.sections[i];
      if (!planned) return;
      mark(pageSection.header, planned.headerKind, planned.headerState);
      markRow(pageSection.root, planned.headerKind, null);
      setAttr(pageSection.header, "data-tm-note", planned.headerNote);
      pageSection.anchors.forEach((a, j) => {
        const link = planned.links[j];
        if (!link) return;
        mark(a, link.kind, link.state);
        setAttr(a, "data-tm-note", link.note);
        markRow(a.closest("li"), link.kind, link.state);
      });
    });
  }

  // src/adapters/content-entry.ts
  var root = document.documentElement;
  var setHighlight = (on) => {
    saveHighlightOn(on);
    root.classList.toggle("tm-on", on);
    syncToggle(on);
  };
  function applyOverview() {
    const page = readOverviewPage();
    if (!page) return;
    const course = courseId();
    const plan = planOverview(
      page.map((section) => section.data),
      loadElectives(course)
    );
    paintOverview(page, plan);
    saveStatus(course, plan.saved, Date.now());
  }
  function rememberElectivesRequirement(course) {
    const requirement = readElectivesRequirement();
    if (!requirement) return;
    const updated = recordMinimum(loadElectives(course), requirement.level, requirement.min, Date.now());
    if (updated) saveElectives(course, updated);
  }
  function applyCourse() {
    const course = courseId();
    paintBreadcrumbs();
    rememberElectivesRequirement(course);
    const { wrappers, elements } = readSidebar();
    const plan = planSidebar({
      level: currentLevel(),
      wrappers,
      saved: loadStatus(course),
      clubSeriesPicked: isClubSeriesPicked(course, currentLevel()),
      evaluationResourceSteps: loadEvaluationResourceSteps(course, currentLevel())
    });
    paintSidebar(elements, plan);
    const at = activeProjectIndex(elements);
    const inProject = plan[at]?.kind === "project";
    paintStepBanner(
      inProject ? purposeHint({
        stepTitle: activeStepTitle(),
        projectSteps: wrappers[at]?.steps.map((step) => step.title) ?? [],
        projectIsDone: plan[at]?.state === "done"
      }) : null
    );
  }
  function applyLegend() {
    buildLegend(() => root.classList.contains("tm-on"), setHighlight);
    updateLegend(whereParts({ breadcrumb: readBreadcrumb(), hasPathCards: hasPathCards() }), nextUpText(loadStatus(courseId()).next));
  }
  function apply() {
    try {
      paintDashboard();
      applyOverview();
      applyCourse();
      applyLegend();
    } catch (error) {
      console.warn("[Pathways Highlighter]", error);
    }
  }
  function start() {
    if (window.__tmHelperLoaded) return;
    window.__tmHelperLoaded = true;
    root.classList.toggle("tm-on", isHighlightOn());
    apply();
    let timer;
    new MutationObserver((mutations) => {
      if (mutations.every((m) => m.target.closest?.("#tm-legend"))) return;
      clearTimeout(timer);
      timer = setTimeout(apply, 250);
    }).observe(document.body, { childList: true, subtree: true });
    setInterval(apply, 3e3);
    window.addEventListener("message", (event) => {
      if (event.origin !== "https://basecamp.toastmasters.org") return;
      const data = event.data;
      if (data?.tmHelper === "clubSeries" && data.picked === true) {
        saveClubSeriesPicked(courseId(), currentLevel());
        apply();
      } else if (data?.tmHelper === "evaluationResource") {
        const { wrappers, elements } = readSidebar();
        const project = activeProjectIndex(elements);
        const step = activeStepIndex(elements, project);
        const title = wrappers[project]?.title;
        if (title && step >= 0) saveEvaluationResourceStep(courseId(), currentLevel(), title, step);
        apply();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.altKey && event.code === "KeyH" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setHighlight(!root.classList.contains("tm-on"));
      }
    });
  }
  start();
})();
