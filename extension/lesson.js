"use strict";
(() => {
  // src/core/assignment.ts
  var printNoteFor = (linkText) => /evaluation resource/i.test(linkText) ? "Print this for your evaluator to use when you give your speech" : null;
  var parseAssignment = (pageText) => {
    const purpose = /purpose:\s*(.+)/i.exec(pageText)?.[1]?.trim() ?? null;
    const range = /(\d+)\s*-?\s*(?:to|-|–|—)\s*(\d+)\s*-?\s*minute/i.exec(pageText);
    const single = /(\d+)\s*-?\s*minute/i.exec(pageText);
    const time = range ? `${range[1]} to ${range[2]} minutes` : single ? `${single[1]} minutes` : null;
    return { purpose, time };
  };

  // src/adapters/lesson-frame-entry.ts
  var BOX_ID = "tm-assignment";
  var purposeParagraph = () => Array.from(document.querySelectorAll("p, li, div")).find(
    (el) => /^\s*purpose:/i.test(el.innerText ?? "") && !el.querySelector("p, li, div")
  ) ?? null;
  function paint() {
    if (document.getElementById(BOX_ID)) return;
    const paragraph = purposeParagraph();
    if (!paragraph) return;
    const { purpose, time } = parseAssignment(document.body.innerText ?? "");
    if (!purpose) return;
    paragraph.classList.add("tm-purpose-line");
    const box = document.createElement("div");
    box.id = BOX_ID;
    box.setAttribute("role", "note");
    const chip = document.createElement("span");
    chip.className = "tm-assignment-chip";
    chip.textContent = "FOR YOUR PAPER FORM";
    const lines = document.createElement("span");
    lines.textContent = time ? `Purpose: the line below. Speech time: ${time}.` : "Purpose: the line below.";
    box.append(chip, lines);
    paragraph.parentNode?.insertBefore(box, paragraph);
  }
  function paintResources() {
    for (const link of document.querySelectorAll("a")) {
      const note = printNoteFor(link.textContent ?? "");
      if (!note || link.dataset.tmPrint) continue;
      link.dataset.tmPrint = "1";
      const chip = document.createElement("span");
      chip.className = "tm-print-chip";
      chip.textContent = `\u{1F5A8} ${note}`;
      link.insertAdjacentElement("afterend", chip);
      if (window.parent !== window) window.parent.postMessage({ tmHelper: "evaluationResource" }, "https://apps.basecamp.toastmasters.org");
    }
  }
  function reportClubSeries() {
    if (window.parent === window) return;
    if (!/successful club series/i.test(document.body.innerText ?? "")) return;
    if (!document.querySelector('input[type="radio"]:checked')) return;
    window.parent.postMessage({ tmHelper: "clubSeries", picked: true }, "https://apps.basecamp.toastmasters.org");
  }
  var timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      paint();
      paintResources();
      reportClubSeries();
    }, 250);
  }).observe(document.documentElement, { childList: true, subtree: true });
  paint();
  paintResources();
  reportClubSeries();
  document.addEventListener("change", reportClubSeries);
})();
