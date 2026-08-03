/* divinci.app/files/ — dropzone, pre-auth staging upload, and handoff.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THE UPLOAD HAPPENS HERE, BEFORE LOGIN
 *
 * A browser cannot carry a File across an origin boundary. The first version
 * of this page passed filename metadata through the redirect and asked the
 * visitor to pick the same file again on chat.divinci.app — which is exactly
 * the sort of friction the funnel exists to remove, at the worst possible
 * moment (right after a signup).
 *
 * So the bytes go up from HERE, anonymously:
 *
 *   1. POST /api/v1/onboarding/upload-files/stage   (Turnstile-gated)
 *      → a presigned PUT per file, into a quarantined staging prefix,
 *        plus a signed claim token
 *   2. PUT each file straight to R2, with a real progress bar
 *   3. redirect to  chat.divinci.app/start/upload?claim=<token>
 *   4. after Auth0, that page exchanges the claim for a running job — the
 *      bytes are already uploaded, so ingestion starts immediately
 *
 * The claim token is HMAC-signed server-side and carries the object keys, the
 * consent timestamp, and an expiry. It is not a secret (object keys aren't),
 * but it cannot be forged, and promotion deletes the staged object so it
 * cannot be replayed.
 *
 * Consent is collected HERE rather than after login, because the upload starts
 * here — asking afterwards would mean we'd already taken the file.
 * ───────────────────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";

  var HANDOFF_PATH = "/start/upload";

  var isStaging = /(^|\.)workers\.dev$/.test(location.hostname) ||
                  /^stage\./.test(location.hostname);
  var APP_ORIGIN = isStaging
    ? "https://chat.stage.divinci.app"
    : "https://chat.divinci.app";
  var API_ORIGIN = isStaging
    ? "https://api.stage.divinci.app"
    : "https://api.divinci.app";

  // Same dedicated onboarding widget the app-side form uses.
  var TURNSTILE_SITEKEY = "0x4AAAAAAD4W4btdLNnpgg_9";

  // Kept in sync with ALLOWED_UPLOAD_TYPES on the server. Extension-based
  // rather than MIME-based on purpose: browsers report inconsistent (and
  // sometimes empty) MIME types for .epub, .md and .csv in particular.
  var ALLOWED = [
    "pdf", "epub",
    "docx", "doc", "rtf", "txt", "md", "html", "json",
    "xlsx", "xls", "csv",
    "pptx", "ppt"
  ];

  var ICONS = {
    pdf: "📕", epub: "📘",
    docx: "📄", doc: "📄", rtf: "📄", txt: "📄", md: "📄", html: "📄", json: "📄",
    xlsx: "📗", xls: "📗", csv: "📗",
    pptx: "📊", ppt: "📊"
  };

  // Anonymous staging caps — MUST match STAGING_MAX_* in the server's
  // staging.ts, or the visitor gets a confusing server-side rejection after
  // picking a file we already told them was fine.
  var MAX_BYTES = 25 * 1024 * 1024;
  var MAX_FILES = 5;

  function extOf(name) {
    var i = String(name).lastIndexOf(".");
    return i === -1 ? "" : name.slice(i + 1).toLowerCase();
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    var units = ["KB", "MB", "GB"];
    var v = bytes / 1024;
    var u = 0;
    while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
    return (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + " " + units[u];
  }

  /** null when acceptable, otherwise a reader-facing reason string. */
  function rejectionReason(file) {
    var ext = extOf(file.name);
    if (ALLOWED.indexOf(ext) === -1) {
      return ext
        ? "We can't read ." + ext + " files yet."
        : "We can't tell what kind of file this is.";
    }
    if (file.size > MAX_BYTES) {
      return "That's larger than " + formatSize(MAX_BYTES) + ". Sign in first to upload files this large.";
    }
    if (file.size === 0) return "That file is empty.";
    return null;
  }

  function wireForm(form) {
    var input = form.querySelector(".drop-input");
    var zone = form.querySelector(".drop-zone");
    var list = form.querySelector(".drop-list");
    var submit = form.querySelector(".drop-submit");
    var consent = form.querySelector(".drop-consent");
    var terms = form.querySelector(".drop-terms");
    var tsHost = form.querySelector(".drop-turnstile");
    if (!input || !zone || !list || !submit) return;

    var picked = [];
    var rejected = [];
    var turnstileToken = "";
    var turnstileId = null;
    var uploading = false;
    /** objectURL-free per-file progress, 0..1, parallel to `picked`. */
    var progress = [];

    function setError(message) {
      var existing = form.querySelector(".drop-error");
      if (!message) { if (existing) existing.remove(); return; }
      var el = existing || document.createElement("p");
      el.className = "drop-error";
      el.setAttribute("role", "alert");
      el.textContent = message;
      if (!existing) form.insertBefore(el, submit);
    }

    function refreshSubmit() {
      var ready = picked.length > 0 && !uploading &&
                  (!terms || terms.checked) && !!turnstileToken;
      submit.disabled = !ready;
      if (uploading) return; // label is managed by the upload loop
      submit.textContent = picked.length > 1
        ? "Build my AI from " + picked.length + " files →"
        : "Build my AI →";
    }

    /** Render Turnstile only once a file is picked — challenging a visitor
     *  who hasn't chosen anything is pure friction. */
    var turnstileWaits = 0;
    function ensureTurnstile() {
      if (!tsHost || turnstileId !== null) return;
      if (!window.turnstile) {
        // The API script is loaded `async`, so a visitor who picks a file
        // quickly can arrive before it exists. render() is only called on
        // pick/remove, so without this retry the widget would never appear
        // and the submit button would stay disabled forever.
        if (turnstileWaits++ > 60) {
          setError("Couldn't load the verification widget. Please refresh and try again.");
          return;
        }
        setTimeout(ensureTurnstile, 250);
        return;
      }
      tsHost.hidden = false;
      turnstileId = window.turnstile.render(tsHost, {
        sitekey: TURNSTILE_SITEKEY,
        callback: function (token) { turnstileToken = token; refreshSubmit(); },
        "expired-callback": function () { turnstileToken = ""; refreshSubmit(); },
        "error-callback": function () { turnstileToken = ""; refreshSubmit(); }
      });
    }

    function render() {
      list.textContent = "";
      var rows = picked.map(function (f, i) { return { file: f, error: null, index: i }; })
        .concat(rejected.map(function (r) { return { file: r.file, error: r.error, index: -1 }; }));

      rows.forEach(function (row) {
        var li = document.createElement("li");
        if (row.error) li.className = "is-rejected";

        var icon = document.createElement("span");
        icon.className = "drop-file-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = row.error ? "⚠️" : (ICONS[extOf(row.file.name)] || "📄");

        var name = document.createElement("span");
        name.className = "drop-file-name";
        // textContent, never innerHTML — the filename is untrusted input and
        // this is the render boundary.
        name.textContent = row.file.name;

        var size = document.createElement("span");
        size.className = "drop-file-size";
        size.textContent = formatSize(row.file.size);

        li.appendChild(icon);
        li.appendChild(name);
        li.appendChild(size);

        if (row.error) {
          var err = document.createElement("span");
          err.className = "drop-file-error";
          err.textContent = row.error;
          li.appendChild(err);
        } else if (uploading) {
          var pct = Math.round((progress[row.index] || 0) * 100);
          var bar = document.createElement("span");
          bar.className = "drop-file-bar";
          var fill = document.createElement("span");
          fill.className = "drop-file-bar-fill";
          fill.style.width = pct + "%";
          bar.appendChild(fill);
          size.textContent = pct + "%";
          li.appendChild(bar);
        }

        if (!uploading) {
          var remove = document.createElement("button");
          remove.type = "button";
          remove.className = "drop-file-remove";
          remove.setAttribute("aria-label", "Remove " + row.file.name);
          remove.textContent = "×";
          remove.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (row.error) rejected = rejected.filter(function (r) { return r.file !== row.file; });
            else picked = picked.filter(function (f) { return f !== row.file; });
            render();
          });
          li.appendChild(remove);
        }

        list.appendChild(li);
      });

      list.hidden = rows.length === 0;
      if (consent) consent.hidden = picked.length === 0;
      if (picked.length > 0) ensureTurnstile();
      refreshSubmit();
    }

    function add(fileList) {
      setError("");
      Array.prototype.slice.call(fileList).forEach(function (f) {
        if (picked.length >= MAX_FILES) {
          setError("You can upload up to " + MAX_FILES + " files here. Sign in to add more.");
          return;
        }
        var dupe = picked.some(function (p) { return p.name === f.name && p.size === f.size; });
        if (dupe) return;
        var reason = rejectionReason(f);
        if (reason) rejected.push({ file: f, error: reason });
        else { picked.push(f); progress.push(0); }
      });
      render();
    }

    input.addEventListener("change", function () {
      add(input.files);
      input.value = ""; // so re-picking the same file fires `change` again
    });
    if (terms) terms.addEventListener("change", refreshSubmit);

    ["dragenter", "dragover"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) {
        e.preventDefault();
        if (!uploading) zone.classList.add("is-dragging");
      });
    });
    ["dragleave", "dragend"].forEach(function (evt) {
      zone.addEventListener(evt, function () { zone.classList.remove("is-dragging"); });
    });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      zone.classList.remove("is-dragging");
      if (uploading) return;
      if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files);
    });

    /** PUT one file to its presigned URL, reporting byte-level progress. */
    function putToR2(uploadUrl, contentType, file, index) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", contentType);
        // THE point of using XHR over fetch: fetch still has no upload
        // progress event, and a silent multi-megabyte upload reads as a hang.
        xhr.upload.onprogress = function (e) {
          if (!e.lengthComputable) return;
          progress[index] = e.loaded / e.total;
          render();
        };
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            progress[index] = 1;
            render();
            resolve();
          } else {
            reject(new Error("Upload of " + file.name + " failed (" + xhr.status + ")"));
          }
        };
        xhr.onerror = function () {
          reject(new Error("Upload of " + file.name + " failed — check your connection."));
        };
        xhr.send(file);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submit.disabled || uploading) return;

      uploading = true;
      setError("");
      submit.disabled = true;
      submit.textContent = "Uploading…";
      render();

      fetch(API_ORIGIN + "/api/v1/onboarding/upload-files/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: picked.map(function (f) { return { fileName: f.name, sizeBytes: f.size }; }),
          turnstileToken: turnstileToken,
          acceptedTerms: true
        })
      }).then(function (res) {
        return res.text().then(function (text) {
          var data;
          try { data = JSON.parse(text); }
          catch (err) {
            throw new Error("Unexpected response (status " + res.status + "): " + text.substring(0, 160));
          }
          if (res.status !== 200 || !data.uploads || !data.claim) {
            throw new Error((data.error && data.error.message) || "We couldn't start your upload. Please try again.");
          }
          return data;
        });
      }).then(function (data) {
        // Presigned slots come back in the order we declared them.
        return data.uploads.reduce(function (chain, up, i) {
          return chain.then(function () {
            return putToR2(up.uploadUrl, up.mimeType, picked[i], i);
          });
        }, Promise.resolve()).then(function () { return data.claim; });
      }).then(function (claim) {
        submit.textContent = "Starting your AI…";
        location.href = APP_ORIGIN + HANDOFF_PATH + "?claim=" + encodeURIComponent(claim);
      }).catch(function (err) {
        uploading = false;
        progress = picked.map(function () { return 0; });
        setError(err && err.message ? err.message : String(err));
        // A consumed Turnstile token can't be reused.
        turnstileToken = "";
        if (window.turnstile && turnstileId !== null) window.turnstile.reset(turnstileId);
        render();
      });
    });

    render();
  }

  // [data-app-link] rewriting (the "Sign in" button) is already handled by
  // app.js, which this page also loads — no need to repeat it here.
  document.querySelectorAll("[data-drop-form]").forEach(wireForm);
})();
