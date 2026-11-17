/* ============================================================================
   HTSOLUTIONLLC Interactive Layer
   - Mobile drawer navigation
   - Peak Workbench: Scroll/tab channel selector + Break-even ROAS & budget allocator
   - Calculator-to-Form sync ("Apply this configuration to Audit Form") + cross-page persistence
   - Validated Lead Intake Form (static browser persistence, no false network success)
   ============================================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "htsolution_audit_state_v1";
  const WB_BLOCK_START = "[Estimated Configuration from HTSOLUTIONLLC Workbench]";
  const WB_BLOCK_END = "[/Workbench Configuration]";

  const DEFAULT_STATE = {
    budget: 60,
    aov: 850000,
    margin: 38,
    goal: "ecom",
    applied: false,
    appliedBudgetTier: "30-80",
    appliedNotesBlock: ""
  };

  const CHANNEL_DATA = {
    meta: {
      key: "meta",
      label: "Facebook / Meta Ads",
      role: "Demand Generation & Multi-Tier Retargeting",
      structure: "70% Broad / Advantage+ · 30% Dynamic Retargeting",
      tracking: "Meta Pixel + Conversions API (CAPI Server-Side)",
      cadence: "Test 4–6 new creative angles weekly",
      summary: "Optimize CPA through continuous creative iteration and server-side CAPI signals to prevent iOS conversion loss.",
      image: "assets/images/service-meta.jpg",
      imageAlt: "Smartphone displaying social media and messaging apps resting on a laptop keyboard"
    },
    google: {
      key: "google",
      label: "Google Ads (Search & PMax)",
      role: "Capturing High-Intent Search Demand",
      structure: "Brand Search + Non-Brand Exact + Shopping / PMax",
      tracking: "Google Tag Manager + GA4 Enhanced Conversions",
      cadence: "Weekly negative keyword audits & feed optimization",
      summary: "Capture buyers actively searching for your products and services, cross-verifying verified conversions via GA4.",
      image: "assets/images/service-google.jpg",
      imageAlt: "Laptop displaying line charts, geographic heatmaps, and pie charts on Google Analytics"
    },
    tiktok: {
      key: "tiktok",
      label: "TikTok Ads & Spark Ads",
      role: "Viral Awareness & Short-Form Video Conversions",
      structure: "Spark Ads UGC + In-Feed Conversion + Retargeting",
      tracking: "TikTok Pixel + Events API + Standardized UTMs",
      cadence: "Refresh 3-second hooks every 7–10 days to prevent creative fatigue",
      summary: "Leverage native video formats that capture viewers in the first 3 seconds to systematically expand new customer pools.",
      image: "assets/images/service-tiktok.jpg",
      imageAlt: "Smartphone mounted on a tripod recording a content creator in a bright studio"
    }
  };

  const GOAL_SPLITS = {
    ecom:   { label: "E-commerce / Retail Sales",   meta: 40, google: 35, tiktok: 25 },
    lead:   { label: "B2B / Service Lead Gen",       meta: 35, google: 50, tiktok: 15 },
    launch: { label: "Product Launch / New Scale",   meta: 35, google: 20, tiktok: 45 }
  };

  function readState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign({}, DEFAULT_STATE, JSON.parse(raw));
    } catch (_) {}
    return Object.assign({}, DEFAULT_STATE);
  }

  function saveState(patch) {
    const next = Object.assign(readState(), patch);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
    return next;
  }

  function formatVND(amount) {
    if (!Number.isFinite(amount)) return "0 VND";
    return Math.round(amount).toLocaleString("en-US") + " VND";
  }

  function resolveAssetPath(relPath) {
    const rootPrefix = document.documentElement.getAttribute("data-root") || ".";
    if (rootPrefix === ".") return relPath;
    return rootPrefix.replace(/\/$/, "") + "/" + relPath;
  }

  function getBudgetTier(budgetMil) {
    if (budgetMil < 15) return "5-15";
    if (budgetMil < 30) return "15-30";
    if (budgetMil < 80) return "30-80";
    if (budgetMil < 200) return "80-200";
    return "200+";
  }

  function buildWorkbenchSummary(st) {
    const split = GOAL_SPLITS[st.goal] || GOAL_SPLITS.ecom;
    const roas = (1 / (st.margin / 100)).toFixed(2);
    const maxCpa = formatVND(st.aov * (st.margin / 100));
    return [
      WB_BLOCK_START,
      "- Primary Goal: " + split.label,
      "- Planned Monthly Budget: " + st.budget + " million VND/mo (AOV: " + formatVND(st.aov) + ", Gross Margin: " + st.margin + "%)",
      "- Break-even ROAS: " + roas + "x | Max Allowable CPA: " + maxCpa,
      "- Benchmark Allocation: Meta " + split.meta + "% / Google " + split.google + "% / TikTok " + split.tiktok + "%",
      WB_BLOCK_END
    ].join("\n");
  }

  function upsertWorkbenchNotes(currentText, summaryBlock) {
    const raw = (currentText || "").trim();
    const blockPattern = /\[Estimated Configuration from HTSOLUTIONLLC Workbench\][\s\S]*?\[\/Workbench Configuration\]/g;
    const cleaned = raw.replace(blockPattern, "").trim();
    if (!summaryBlock) return cleaned;
    if (!cleaned) return summaryBlock;
    return cleaned + "\n\n" + summaryBlock;
  }

  function flashFieldSynced(el) {
    if (!el) return;
    el.classList.remove("is-synced");
    void el.offsetWidth;
    el.classList.add("is-synced");
    setTimeout(function () {
      el.classList.remove("is-synced");
    }, 1800);
  }

  function applyBriefToForm(tier, summaryBlock, highlight) {
    const budgetSelect = document.getElementById("lead-budget");
    const notesInput = document.getElementById("lead-notes");
    if (budgetSelect && tier) {
      const hasOption = Array.from(budgetSelect.options).some(function (opt) {
        return opt.value === tier;
      });
      if (hasOption) budgetSelect.value = tier;
      if (highlight) flashFieldSynced(budgetSelect);
    }
    if (notesInput && summaryBlock) {
      notesInput.value = upsertWorkbenchNotes(notesInput.value, summaryBlock);
      if (highlight) flashFieldSynced(notesInput);
    }
  }

  /* ------------------------------------------------ Mobile Nav Drawer -- */
  function initMobileNav() {
    const btn = document.querySelector(".ht-nav__toggle");
    const drawer = document.getElementById("ht-mobile-drawer");
    if (!btn || !drawer) return;

    function closeDrawer() {
      if (!drawer.classList.contains("is-open")) return;
      drawer.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function () {
      const open = drawer.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });

    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeDrawer);
    });

    document.addEventListener("click", function (e) {
      if (!drawer.classList.contains("is-open")) return;
      const target = e.target;
      if (target instanceof Node && !drawer.contains(target) && !btn.contains(target)) {
        closeDrawer();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        closeDrawer();
        btn.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeDrawer();
    }, { passive: true });
  }

  /* ----------------------- Peak Act Workbench & Break-Even Calculator -- */
  function initWorkbench() {
    const workbench = document.getElementById("channel-workbench");
    if (!workbench) return;

    const tabs = Array.from(workbench.querySelectorAll("[data-wb-tab]"));
    const imgEl = workbench.querySelector("[data-wb-img]");
    const titleEl = workbench.querySelector("[data-wb-title]");
    const summaryEl = workbench.querySelector("[data-wb-summary]");
    const roleEl = workbench.querySelector("[data-wb-role]");
    const structEl = workbench.querySelector("[data-wb-structure]");
    const trackEl = workbench.querySelector("[data-wb-tracking]");
    const cadenceEl = workbench.querySelector("[data-wb-cadence]");
    const stageAct = document.getElementById("peak-act");

    let userLocked = false;
    let currentChannel = "meta";

    function renderChannel(key, isManual) {
      const data = CHANNEL_DATA[key] || CHANNEL_DATA.meta;
      currentChannel = data.key;
      if (isManual) userLocked = true;

      tabs.forEach(function (t) {
        const active = t.getAttribute("data-wb-tab") === data.key;
        t.setAttribute("aria-selected", String(active));
        t.setAttribute("tabindex", active ? "0" : "-1");
      });

      if (titleEl) titleEl.textContent = data.label;
      if (summaryEl) summaryEl.textContent = data.summary;
      if (roleEl) roleEl.textContent = data.role;
      if (structEl) structEl.textContent = data.structure;
      if (trackEl) trackEl.textContent = data.tracking;
      if (cadenceEl) cadenceEl.textContent = data.cadence;
      if (imgEl) {
        imgEl.src = resolveAssetPath(data.image);
        imgEl.alt = data.imageAlt;
      }
      if (stageAct) {
        stageAct.setAttribute("data-sc-verify-state", "channel:" + data.key);
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        const key = tab.getAttribute("data-wb-tab");
        renderChannel(key, true);
      });

      tab.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const nextTab = tabs[(index + dir + tabs.length) % tabs.length];
        if (!nextTab) return;
        renderChannel(nextTab.getAttribute("data-wb-tab"), true);
        nextTab.focus();
      });
    });

    // Sync channel phase gently with pinned scroll progress unless user clicked manually
    const meterFill = workbench.querySelector("[data-wb-meter-fill]");
    const meterPct = workbench.querySelector("[data-wb-meter-pct]");
    if (stageAct) {
      let rafPending = false;
      window.addEventListener("scroll", function () {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          const raw = getComputedStyle(stageAct).getPropertyValue("--sc-p").trim();
          const p = parseFloat(raw);
          if (!Number.isFinite(p)) return;
          const clamped = Math.min(1, Math.max(0.04, p));
          if (meterFill) {
            meterFill.style.transform = "scaleX(" + clamped.toFixed(3) + ")";
          }
          if (meterPct) {
            meterPct.textContent = Math.round(clamped * 100) + "% funnel journey";
          }
          let target = currentChannel;
          if (!userLocked && window.innerWidth > 960) {
            target = "meta";
            if (p >= 0.66) target = "tiktok";
            else if (p >= 0.33) target = "google";
            if (target !== currentChannel) {
              renderChannel(target, false);
            }
          }
          stageAct.setAttribute(
            "data-sc-verify-state",
            "channel:" + target + "|fill:" + Math.round(clamped * 100)
          );
        });
      }, { passive: true });
    }

    // Calculator logic
    const budgetIn = document.getElementById("calc-budget");
    const aovIn = document.getElementById("calc-aov");
    const marginIn = document.getElementById("calc-margin");
    const goalIn = document.getElementById("calc-goal");

    const outRoas = document.getElementById("out-roas");
    const outCpa = document.getElementById("out-cpa");
    const segMeta = document.getElementById("seg-meta");
    const segGoogle = document.getElementById("seg-google");
    const segTiktok = document.getElementById("seg-tiktok");
    const legendMeta = document.getElementById("leg-meta");
    const legendGoogle = document.getElementById("leg-google");
    const legendTiktok = document.getElementById("leg-tiktok");
    const applyBtn = document.getElementById("calc-apply-btn");

    function parseClamped(inputEl, min, max, fallback) {
      const raw = parseFloat(inputEl.value);
      if (!Number.isFinite(raw)) return fallback;
      if (max !== null) return Math.max(min, Math.min(max, raw));
      return Math.max(min, raw);
    }

    function updateCalculator(commitInputs) {
      if (!budgetIn || !aovIn || !marginIn || !goalIn) return;

      const budgetMil = parseClamped(budgetIn, 5, 5000, 60);
      const aov = parseClamped(aovIn, 50000, null, 850000);
      const marginPct = parseClamped(marginIn, 5, 90, 38);
      const goalKey = goalIn.value || "ecom";
      const split = GOAL_SPLITS[goalKey] || GOAL_SPLITS.ecom;

      if (commitInputs) {
        budgetIn.value = String(budgetMil);
        aovIn.value = String(aov);
        marginIn.value = String(marginPct);
      }

      const breakEvenRoas = 1 / (marginPct / 100);
      const maxCpa = aov * (marginPct / 100);

      const totalVnd = budgetMil * 1000000;
      const metaVnd = (totalVnd * split.meta) / 100;
      const googleVnd = (totalVnd * split.google) / 100;
      const tiktokVnd = (totalVnd * split.tiktok) / 100;

      if (outRoas) outRoas.textContent = breakEvenRoas.toFixed(2) + "x";
      if (outCpa) outCpa.textContent = formatVND(maxCpa);

      if (segMeta) segMeta.style.width = split.meta + "%";
      if (segGoogle) segGoogle.style.width = split.google + "%";
      if (segTiktok) segTiktok.style.width = split.tiktok + "%";

      if (legendMeta) legendMeta.textContent = "Meta " + split.meta + "% (" + (metaVnd / 1e6).toFixed(1) + "M)";
      if (legendGoogle) legendGoogle.textContent = "Google " + split.google + "% (" + (googleVnd / 1e6).toFixed(1) + "M)";
      if (legendTiktok) legendTiktok.textContent = "TikTok " + split.tiktok + "% (" + (tiktokVnd / 1e6).toFixed(1) + "M)";

      saveState({
        budget: budgetMil,
        aov: aov,
        margin: marginPct,
        goal: goalKey
      });
    }

    if (budgetIn && aovIn && marginIn && goalIn) {
      const st = readState();
      budgetIn.value = String(st.budget || 60);
      aovIn.value = String(st.aov || 850000);
      marginIn.value = String(st.margin || 38);
      goalIn.value = st.goal || "ecom";

      [budgetIn, aovIn, marginIn].forEach(function (el) {
        el.addEventListener("input", function () { updateCalculator(false); });
        el.addEventListener("change", function () { updateCalculator(true); });
        el.addEventListener("blur", function () { updateCalculator(true); });
      });
      goalIn.addEventListener("change", function () { updateCalculator(true); });
      updateCalculator(false);
    }

    if (applyBtn) {
      const originalHtml = applyBtn.innerHTML;
      let feedbackTimer = 0;

      applyBtn.addEventListener("click", function () {
        updateCalculator(true);
        const st = readState();
        const tier = getBudgetTier(st.budget);
        const summaryBlock = buildWorkbenchSummary(st);

        saveState({
          applied: true,
          appliedBudgetTier: tier,
          appliedNotesBlock: summaryBlock
        });

        applyBriefToForm(tier, summaryBlock, true);

        const formEl = document.getElementById("ht-lead-form-el");
        if (formEl) {
          const boxes = Array.from(formEl.querySelectorAll('input[name="channels"]'));
          const anyChecked = boxes.some(function (box) { return box.checked; });
          if (!anyChecked) {
            boxes.forEach(function (box) { box.checked = true; });
          }
        }

        clearTimeout(feedbackTimer);
        applyBtn.textContent = "Configuration Applied to Audit Form ✓";
        feedbackTimer = setTimeout(function () {
          applyBtn.innerHTML = originalHtml;
        }, 2200);

        const scrollTarget =
          document.querySelector("#lead-form .ht-form-card") ||
          document.getElementById("lead-form");
        if (scrollTarget) {
          const nameField = document.getElementById("lead-name");
          const notesField = document.getElementById("lead-notes");
          const focusTarget = nameField && !nameField.value.trim() ? nameField : notesField;

          let focused = false;
          function focusAfterScroll() {
            if (focused || !focusTarget) return;
            focused = true;
            try {
              focusTarget.focus({ preventScroll: true });
            } catch (_) {}
          }

          if ("onscrollend" in window) {
            window.addEventListener("scrollend", focusAfterScroll, { once: true });
          }
          setTimeout(focusAfterScroll, 800);
          scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    renderChannel("meta", false);
  }

  /* ----------------------------------------- Lead Intake Form Validation -- */
  function initLeadForm() {
    const form = document.getElementById("ht-lead-form-el");
    if (!form) return;

    const statusBox = document.getElementById("ht-lead-status");

    const st = readState();
    if (st.applied && st.appliedNotesBlock) {
      applyBriefToForm(st.appliedBudgetTier, st.appliedNotesBlock, false);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = (document.getElementById("lead-name").value || "").trim();
      const contact = (document.getElementById("lead-contact").value || "").trim();
      const company = (document.getElementById("lead-company").value || "").trim();
      const website = (document.getElementById("lead-url").value || "").trim();
      const budget = document.getElementById("lead-budget").value;
      const notes = (document.getElementById("lead-notes").value || "").trim();
      const selectedChannels = Array.from(form.querySelectorAll('input[name="channels"]:checked')).map(function (c) {
        return c.value;
      });

      if (!name || !contact || selectedChannels.length === 0) {
        statusBox.className = "ht-form-status is-visible ht-form-status--err";
        statusBox.textContent = "Please enter your full name, contact phone/email, and select at least one advertising channel for the audit.";
        return;
      }

      const payload = {
        submittedAt: new Date().toISOString(),
        agency: "HTSOLUTIONLLC",
        clientName: name,
        contact: contact,
        company: company || "(Not provided)",
        websiteOrFanpage: website || "(Not provided)",
        channels: selectedChannels,
        monthlyBudgetTier: budget,
        notes: notes || "(No additional notes)"
      };

      try {
        localStorage.setItem("htsolution_last_brief", JSON.stringify(payload));
      } catch (_) {}

      statusBox.className = "ht-form-status is-visible ht-form-status--ok";
      statusBox.textContent =
        "Audit dossier recorded for " + name + " (" + selectedChannels.join(", ").toUpperCase() + "). " +
        "Note: This is a static site without a backend email dispatch server; your submission has been saved locally in your browser.";
    });
  }

  /* --------------------------------- Focus-in Rescue inside Pinned Acts -- */
  function initPinFocusHelper() {
    document.addEventListener("focusin", function (e) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const pinned = target.closest('[data-sc-act="pin"]');
      if (!pinned) return;
      const stage = pinned.querySelector("[data-sc-stage], .sc-stage");
      if (!stage || getComputedStyle(stage).position !== "sticky") return;
      const rect = pinned.getBoundingClientRect();
      if (rect.top > 0 || rect.bottom < window.innerHeight) {
        window.scrollTo({
          top: window.scrollY + rect.top + 40,
          behavior: "auto"
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initWorkbench();
    initLeadForm();
    initPinFocusHelper();
  });
})();
