(function () {
  "use strict";

  var DEFAULT_METADATA = {
    appName: "Hello Deploy",
    version: "1.0.0",
    buildId: "local",
    commitSha: "unknown",
    buildTimestamp: "unknown",
    environment: "production"
  };

  function sanitize(value, fallback) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    return fallback;
  }

  function parseMetadata(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return DEFAULT_METADATA;
    }
    return {
      appName: sanitize(data.appName, DEFAULT_METADATA.appName),
      version: sanitize(data.version, DEFAULT_METADATA.version),
      buildId: sanitize(data.buildId, DEFAULT_METADATA.buildId),
      commitSha: sanitize(data.commitSha, DEFAULT_METADATA.commitSha),
      buildTimestamp: sanitize(data.buildTimestamp, DEFAULT_METADATA.buildTimestamp),
      environment: sanitize(data.environment, DEFAULT_METADATA.environment)
    };
  }

  function detectBrowser(ua) {
    if (!ua) return "Unknown";
    if (ua.indexOf("Firefox/") !== -1) return "Mozilla Firefox";
    if (ua.indexOf("Edg/") !== -1) return "Microsoft Edge";
    if (ua.indexOf("Chrome/") !== -1) return "Google Chrome / Chromium";
    if (ua.indexOf("Safari/") !== -1 && ua.indexOf("Chrome/") === -1) return "Apple Safari";
    if (ua.indexOf("Trident/") !== -1) return "Internet Explorer";
    return "Unknown browser";
  }

  function detectPlatform(navigator) {
    if (!navigator) return "Unknown";
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      return navigator.userAgentData.platform;
    }
    if (navigator.platform) {
      return navigator.platform;
    }
    return "Unknown";
  }

  function renderMetadata(meta, isFallback) {
    var ids = {
      "info-app-name": meta.appName,
      "info-version": meta.version,
      "info-build-id": meta.buildId,
      "info-commit": meta.commitSha,
      "info-built-at": meta.buildTimestamp,
      "info-environment": meta.environment,
      "verify-version": meta.version,
      "verify-build-id": meta.buildId,
      "verify-commit": meta.commitSha,
      "verify-built-at": meta.buildTimestamp
    };

    Object.keys(ids).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = ids[id];
    });

    var footerVer = document.getElementById("footer-version");
    if (footerVer) {
      footerVer.textContent = meta.version !== "unknown" ? "v" + meta.version : "";
    }

    var noteEl = document.getElementById("metadata-note");
    if (noteEl) {
      if (isFallback) {
        noteEl.textContent = "Displaying default build metadata (build-info.json unavailable).";
        noteEl.classList.add("panel__note--warning");
      } else {
        noteEl.textContent = "Loaded from build-info.json in container static root.";
        noteEl.classList.remove("panel__note--warning");
      }
    }
  }

  function loadMetadata() {
    return fetch("build-info.json", { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        var meta = parseMetadata(data);
        renderMetadata(meta, false);
      })
      .catch(function () {
        renderMetadata(DEFAULT_METADATA, true);
      });
  }

  function getPageLoadTime() {
    var perf = window.performance;

    if (!perf) return 0;

    if (typeof perf.getEntriesByType === "function") {
      var entries = perf.getEntriesByType("navigation");
      if (entries && entries.length && entries[0].duration > 0) {
        return Math.round(entries[0].duration);
      }
      return 0;
    }

    if (perf.timing) {
      var legacy = perf.timing.loadEventEnd - perf.timing.navigationStart;
      return legacy > 0 ? legacy : 0;
    }

    return 0;
  }

  function renderRuntimeInfo() {
    var ua = navigator.userAgent || "";
    var browserEl = document.getElementById("runtime-browser");
    if (browserEl) browserEl.textContent = detectBrowser(ua);

    var platformEl = document.getElementById("runtime-platform");
    if (platformEl) platformEl.textContent = detectPlatform(navigator);

    var langEl = document.getElementById("runtime-language");
    if (langEl) langEl.textContent = navigator.language || (navigator.languages && navigator.languages[0]) || "Unknown";

    var urlEl = document.getElementById("runtime-url");
    if (urlEl) urlEl.textContent = window.location.href;

    var vpEl = document.getElementById("runtime-viewport");
    if (vpEl) vpEl.textContent = window.innerWidth + " \u00d7 " + window.innerHeight;

    var timeEl = document.getElementById("runtime-local-time");
    if (timeEl) {
      var now = new Date();
      timeEl.textContent = now.toLocaleTimeString() + " (" + Intl.DateTimeFormat().resolvedOptions().timeZone + ")";
    }

    var loadTimeEl = document.getElementById("runtime-load-time");
    if (loadTimeEl && window.performance) {
      window.addEventListener("load", function () {
        setTimeout(function () {
          var pageLoadTime = getPageLoadTime();
          loadTimeEl.textContent = pageLoadTime > 0 ? pageLoadTime + " ms" : "available after load";
        }, 0);
      });
    }

    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  var THEME_STORAGE_KEY = "hello-deploy-theme";

  function readStoredTheme() {
    try {
      var stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      return stored === "dark" || stored === "light" ? stored : null;
    } catch (err) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      // Storage can be blocked (private mode, stricter cookie policies); the
      // theme still applies to the current page view.
    }
  }

  function initTheme() {
    var toggleBtn = document.getElementById("theme-toggle");
    if (!toggleBtn) return;

    var stored = readStoredTheme();
    var isDark;

    if (stored) {
      document.documentElement.setAttribute("data-theme", stored);
      isDark = stored === "dark";
    } else {
      isDark = typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    toggleBtn.setAttribute("aria-pressed", isDark ? "true" : "false");

    toggleBtn.addEventListener("click", function () {
      isDark = !isDark;
      var next = isDark ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      storeTheme(next);
      toggleBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
    });
  }

  function initRefresh() {
    var btn = document.getElementById("refresh-button");
    if (!btn) return;
    btn.addEventListener("click", function () {
      window.location.reload();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    renderRuntimeInfo();
    loadMetadata();
    initRefresh();
  });
})();
