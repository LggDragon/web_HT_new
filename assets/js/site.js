/* ============================================================================
   HTSOLUTIONLLC Interactive Layer
   - Mobile drawer navigation
   - Signature Move: Scroll-driven Channel Attribution Trace + cross-page brief sync
   - Peak Workbench: Scroll/tab channel selector + Break-even ROAS & budget allocator
   - Validated Lead Intake Form with local brief export (no false network success)
   ============================================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "htsolution_audit_state_v1";

  const CHANNEL_DATA = {
    meta: {
      key: "meta",
      label: "Facebook / Meta Ads",
      role: "Tạo nhu cầu mới & Retargeting đa tầng",
      structure: "70% Broad / Advantage+ · 30% Dynamic Retargeting",
      tracking: "Meta Pixel + Conversions API (CAPI Server-Side)",
      cadence: "Test 4–6 góc creative mới mỗi tuần",
      summary: "Tối ưu CPA thông qua luồng creative liên tục và tín hiệu CAPI chống thất thoát đơn hàng iOS.",
      image: "assets/images/service-meta.jpg",
      imageAlt: "Điện thoại thông minh hiển thị các ứng dụng mạng xã hội và tin nhắn đặt trên bàn phím laptop"
    },
    google: {
      key: "google",
      label: "Google Ads (Search & PMax)",
      role: "Đón đầu nhu cầu tìm kiếm có ý định mua cao",
      structure: "Brand Search + Non-Brand Exact + Shopping / PMax",
      tracking: "Google Tag Manager + GA4 Enhanced Conversions",
      cadence: "Lọc Negative Keywords & tối ưu Feed hàng tuần",
      summary: "Bắt trọn khách hàng đang chủ động tìm dịch vụ/sản phẩm, đối soát chéo số liệu trung thực qua GA4.",
      image: "assets/images/service-google.jpg",
      imageAlt: "Laptop hiển thị biểu đồ đường, bản đồ nhiệt địa lý và biểu đồ tròn trên Google Analytics"
    },
    tiktok: {
      key: "tiktok",
      label: "TikTok Ads & Spark Ads",
      role: "Bùng nổ nhận diện & Chuyển đổi video ngắn",
      structure: "Spark Ads UGC + In-Feed Conversion + Retargeting",
      tracking: "TikTok Pixel + Events API + UTM chuẩn hóa",
      cadence: "Thay hook 3 giây đầu mỗi 7–10 ngày chống fatigue",
      summary: "Khai thác định dạng video tự nhiên giữ chân người xem 3 giây đầu để mở rộng tệp khách hàng mới.",
      image: "assets/images/service-tiktok.jpg",
      imageAlt: "Điện thoại đặt trên chân máy tripod đang ghi hình nhà sáng tạo nội dung trong studio sáng"
    }
  };

  const GOAL_SPLITS = {
    ecom:   { label: "Bán hàng E-commerce / Retail", meta: 40, google: 35, tiktok: 25 },
    lead:   { label: "Thu thập Lead B2B / Dịch vụ",  meta: 35, google: 50, tiktok: 15 },
    launch: { label: "Ra mắt sản phẩm / Scale mới",  meta: 35, google: 20, tiktok: 45 }
  };

  function readState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      channel: "all",
      budget: 60,
      aov: 850000,
      margin: 38,
      goal: "ecom"
    };
  }

  function saveState(patch) {
    const next = Object.assign(readState(), patch);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
    return next;
  }

  function formatVND(amount) {
    if (!Number.isFinite(amount)) return "0 đ";
    return Math.round(amount).toLocaleString("vi-VN") + " đ";
  }

  function resolveAssetPath(relPath) {
    const rootPrefix = document.documentElement.getAttribute("data-root") || ".";
    if (rootPrefix === ".") return relPath;
    return rootPrefix.replace(/\/$/, "") + "/" + relPath;
  }

  /* ------------------------------------------------ Mobile Nav Drawer -- */
  function initMobileNav() {
    const btn = document.querySelector(".ht-nav__toggle");
    const drawer = document.getElementById("ht-mobile-drawer");
    if (!btn || !drawer) return;

    function closeDrawer() {
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

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        closeDrawer();
        btn.focus();
      }
    });
  }

  /* ----------------------------------- Signature Move: Channel Trace -- */
  function initChannelTrace() {
    const trace = document.querySelector(".ht-trace");
    if (!trace) return;

    const buttons = trace.querySelectorAll("[data-trace-channel]");
    const statusEl = trace.querySelector("[data-trace-status]");
    const pathEl = trace.querySelector("[data-trace-path]");
    const dotEl = trace.querySelector("[data-trace-dot]");

    function applyChannelSelection(channelKey) {
      const st = saveState({ channel: channelKey });
      buttons.forEach(function (b) {
        const active = b.getAttribute("data-trace-channel") === channelKey;
        b.setAttribute("aria-pressed", String(active));
      });

      if (statusEl) {
        const map = {
          all: "Đang theo dõi: Hệ sinh thái 3 kênh (Meta + Google + TikTok)",
          meta: "Đang ưu tiên: Facebook / Meta Ads (CAPI + Creative Sprint)",
          google: "Đang ưu tiên: Google Ads (Search Intent + GA4 + PMax)",
          tiktok: "Đang ưu tiên: TikTok Ads (3s Hook + Spark Ads)"
        };
        statusEl.textContent = map[channelKey] || map.all;
      }

      syncLeadChannelCheckboxes(st.channel);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const ch = btn.getAttribute("data-trace-channel");
        applyChannelSelection(ch);
        if (ch !== "all" && window.htSelectWorkbenchChannel) {
          window.htSelectWorkbenchChannel(ch, true);
        }
      });
    });

    function updateScrollSignal() {
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      if (pathEl) {
        const totalLen = 120;
        pathEl.style.strokeDasharray = String(totalLen);
        pathEl.style.strokeDashoffset = String(Math.round(totalLen * (1 - p)));
      }
      if (dotEl) {
        dotEl.setAttribute("cx", String(8 + Math.round(p * 80)));
      }
    }

    const initial = readState();
    applyChannelSelection(initial.channel || "all");
    updateScrollSignal();

    let ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          updateScrollSignal();
          ticking = false;
        });
      }
    }, { passive: true });
  }

  function syncLeadChannelCheckboxes(channelKey) {
    const form = document.getElementById("ht-lead-form-el");
    if (!form) return;
    const boxes = form.querySelectorAll('input[name="channels"]');
    if (!boxes.length) return;
    boxes.forEach(function (box) {
      if (channelKey === "all") {
        box.checked = true;
      } else {
        box.checked = box.value === channelKey;
      }
    });
  }

  /* ----------------------- Peak Act Workbench & Break-Even Calculator -- */
  function initWorkbench() {
    const workbench = document.getElementById("channel-workbench");
    if (!workbench) return;

    const tabs = workbench.querySelectorAll("[data-wb-tab]");
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
        t.setAttribute("aria-selected", String(t.getAttribute("data-wb-tab") === data.key));
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

    window.htSelectWorkbenchChannel = function (key, manual) {
      renderChannel(key, Boolean(manual));
    };

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const key = tab.getAttribute("data-wb-tab");
        renderChannel(key, true);
        const traceBtn = document.querySelector('[data-trace-channel="' + key + '"]');
        if (traceBtn) traceBtn.click();
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
            meterPct.textContent = Math.round(clamped * 100) + "% hành trình phễu";
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

    function updateCalculator() {
      const budgetMil = Math.max(5, Math.min(5000, parseFloat(budgetIn.value) || 60));
      const aov = Math.max(50000, parseFloat(aovIn.value) || 850000);
      const marginPct = Math.max(5, Math.min(90, parseFloat(marginIn.value) || 38));
      const goalKey = goalIn.value || "ecom";
      const split = GOAL_SPLITS[goalKey] || GOAL_SPLITS.ecom;

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

      if (legendMeta) legendMeta.textContent = "Meta " + split.meta + "% (" + (metaVnd / 1e6).toFixed(1) + " tr)";
      if (legendGoogle) legendGoogle.textContent = "Google " + split.google + "% (" + (googleVnd / 1e6).toFixed(1) + " tr)";
      if (legendTiktok) legendTiktok.textContent = "TikTok " + split.tiktok + "% (" + (tiktokVnd / 1e6).toFixed(1) + " tr)";

      saveState({
        budget: budgetMil,
        aov: aov,
        margin: marginPct,
        goal: goalKey
      });
    }

    if (budgetIn && aovIn && marginIn && goalIn) {
      const st = readState();
      budgetIn.value = st.budget || 60;
      aovIn.value = st.aov || 850000;
      marginIn.value = st.margin || 38;
      goalIn.value = st.goal || "ecom";

      [budgetIn, aovIn, marginIn, goalIn].forEach(function (el) {
        el.addEventListener("input", updateCalculator);
        el.addEventListener("change", updateCalculator);
      });
      updateCalculator();
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        const st = readState();
        const split = GOAL_SPLITS[st.goal] || GOAL_SPLITS.ecom;
        const roas = (1 / (st.margin / 100)).toFixed(2);
        const maxCpa = formatVND(st.aov * (st.margin / 100));

        const budgetSelect = document.getElementById("lead-budget");
        const notesInput = document.getElementById("lead-notes");
        if (budgetSelect) {
          if (st.budget < 30) budgetSelect.value = "15-30";
          else if (st.budget < 80) budgetSelect.value = "30-80";
          else if (st.budget < 200) budgetSelect.value = "80-200";
          else budgetSelect.value = "200+";
        }
        if (notesInput) {
          notesInput.value =
            "Cấu hình ước tính từ Workbench HTSOLUTIONLLC:\n" +
            "- Mục tiêu: " + split.label + "\n" +
            "- Ngân sách dự kiến: " + st.budget + " triệu VNĐ/tháng (AOV " + formatVND(st.aov) + ", Biên gộp " + st.margin + "%)\n" +
            "- Break-even ROAS: " + roas + "x | CPA trần: " + maxCpa + "\n" +
            "- Phân bổ tham chiếu: Meta " + split.meta + "% / Google " + split.google + "% / TikTok " + split.tiktok + "%";
        }
        const leadSection = document.getElementById("lead-form");
        if (leadSection) {
          leadSection.scrollIntoView({ behavior: "smooth" });
          const nameField = document.getElementById("lead-name");
          if (nameField) {
            setTimeout(function () { nameField.focus(); }, 350);
          }
        }
      });
    }

    const st = readState();
    renderChannel(st.channel !== "all" ? st.channel : "meta", false);
  }

  /* ----------------------------------------- Lead Intake Form Validation -- */
  function initLeadForm() {
    const form = document.getElementById("ht-lead-form-el");
    if (!form) return;

    const statusBox = document.getElementById("ht-lead-status");
    const downloadBtn = document.getElementById("ht-download-brief");
    const copyBtn = document.getElementById("ht-copy-brief");
    let latestBriefText = "";

    const st = readState();
    syncLeadChannelCheckboxes(st.channel || "all");

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
        statusBox.textContent = "Vui lòng nhập họ tên, số điện thoại/email liên hệ và chọn ít nhất 1 nền tảng quảng cáo cần Audit.";
        return;
      }

      const payload = {
        submittedAt: new Date().toISOString(),
        agency: "HTSOLUTIONLLC",
        clientName: name,
        contact: contact,
        company: company || "(Chưa cung cấp)",
        websiteOrFanpage: website || "(Chưa cung cấp)",
        channels: selectedChannels,
        monthlyBudgetTier: budget,
        notes: notes || "(Không có ghi chú thêm)"
      };

      latestBriefText =
        "HỒ SƠ YÊU CẦU AUDIT ADS - HTSOLUTIONLLC\n" +
        "========================================\n" +
        "Thời gian tạo: " + new Date().toLocaleString("vi-VN") + "\n" +
        "Khách hàng: " + payload.clientName + "\n" +
        "Liên hệ (Zalo/Email): " + payload.contact + "\n" +
        "Doanh nghiệp: " + payload.company + "\n" +
        "Website / Fanpage: " + payload.websiteOrFanpage + "\n" +
        "Kênh ưu tiên: " + payload.channels.join(", ").toUpperCase() + "\n" +
        "Ngân sách dự kiến: " + payload.monthlyBudgetTier + " triệu VNĐ/tháng\n" +
        "Ghi chú chi tiết:\n" + payload.notes + "\n";

      try {
        localStorage.setItem("htsolution_last_brief", JSON.stringify(payload));
      } catch (_) {}

      statusBox.className = "ht-form-status is-visible ht-form-status--ok";
      statusBox.textContent =
        "Đã tạo và lưu hồ sơ Audit cho " + name + " (" + selectedChannels.join(", ").toUpperCase() + ") trên trình duyệt. " +
        "Lưu ý: đây là bản website tĩnh chưa nối API máy chủ email, vui lòng nhấn Tải Brief (.txt) hoặc Sao chép tóm tắt để gửi cho bộ phận Account của HTSOLUTIONLLC.";

      if (downloadBtn) downloadBtn.hidden = false;
      if (copyBtn) copyBtn.hidden = false;
    });

    if (downloadBtn) {
      downloadBtn.addEventListener("click", function () {
        if (!latestBriefText) return;
        const blob = new Blob([latestBriefText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "HTSOLUTIONLLC-Audit-Brief.txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        if (!latestBriefText || !navigator.clipboard) return;
        navigator.clipboard.writeText(latestBriefText).then(function () {
          copyBtn.textContent = "Đã sao chép Brief";
          setTimeout(function () {
            copyBtn.textContent = "Sao chép tóm tắt";
          }, 2200);
        });
      });
    }
  }

  /* --------------------------------- Focus-in Rescue inside Pinned Acts -- */
  function initPinFocusHelper() {
    document.addEventListener("focusin", function (e) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const pinned = target.closest('[data-sc-act="pin"]');
      if (!pinned) return;
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
    initChannelTrace();
    initWorkbench();
    initLeadForm();
    initPinFocusHelper();
  });
})();
