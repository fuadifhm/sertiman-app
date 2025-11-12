/* ============================================================
   🔹 GLOBAL TOAST (Reusable)
   ============================================================ */
const _toastState = { lastMsg: null, lastTs: 0 };

function showToast(message, type = "info") {
  const nowTs = Date.now();
  if (message === _toastState.lastMsg && nowTs - _toastState.lastTs < 800) return;

  _toastState.lastMsg = message;
  _toastState.lastTs = nowTs;

  const toastContainer = document.getElementById("toastContainer");

  if (!toastContainer) {
    if (typeof Swal !== "undefined") {
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
      });
      Toast.fire({ icon: type, title: message });
    } else {
      console.log(`[${type}] ${message}`);
    }
    return;
  }

  const now = new Date();
  const timeStr = now.getHours() + ":" + now.getMinutes().toString().padStart(2, "0");

  const toastHTML = `
       <div class="toast align-items-start custom-toast ${type}" role="alert" aria-live="assertive" aria-atomic="true">
         <div class="toast-header custom-toast-header">
           <img src="assets/images/logo-sm.png" class="toast-logo rounded me-2" alt="logo">
           <strong class="me-auto">Admin</strong>
           <small class="toast-time">${timeStr}</small>
           <button type="button" class="btn-close ms-2 mb-1" data-bs-dismiss="toast" aria-label="Close"></button>
         </div>
         <div class="custom-toast-body">${message}</div>
       </div>
     `;

  toastContainer.insertAdjacentHTML("beforeend", toastHTML);
  const toastEl = toastContainer.lastElementChild;

  try {
    const toast = new bootstrap.Toast(toastEl, { delay: 2200 });
    toast.show();
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
  } catch {
    setTimeout(() => toastEl.remove(), 2500);
  }
}

/* ============================================================
      🔹 HELPER WARNA STATUS SELECT
      ============================================================ */
function updateStatusColor(select) {
  let val = (select.value || "").toLowerCase();
  select.classList.remove("bg-success-subtle", "bg-danger-subtle", "text-success", "text-danger", "fw-bold");

  if (val === "digunakan") {
    select.classList.add("bg-danger-subtle", "text-danger", "fw-bold");
  } else if (val === "tersedia") {
    select.classList.add("bg-success-subtle", "text-success", "fw-bold");
  }
}

/* ============================================================
      🔹 FIELD SNAPSHOT HELPER
      ============================================================ */
function isRelevantField(el) {
  if (!el) return false;
  if (el.disabled) return false;
  if (el.type === "hidden" || el.tagName === "BUTTON") return false;
  return true;
}

function fieldKey(el) {
  return el.name || el.id || el.dataset.initKey || (el.dataset.initKey = "k" + Math.random().toString(36).slice(2, 9));
}

function fieldValue(el) {
  if (!isRelevantField(el)) return "";
  if (el.type === "checkbox" || el.type === "radio") return el.checked ? "1" : "";
  return (el.value ?? "").trim();
}

function snapshotFromFields(fields) {
  const snap = {};
  fields.forEach((f) => (snap[fieldKey(f)] = fieldValue(f)));
  return snap;
}

function snapshotsEqual(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if ((a[k] ?? "") !== (b[k] ?? "")) return false;
  }
  return true;
}

/* ============================================================
      🔹 GLOBAL NAV ACTIVE DETECTION
      ============================================================ */
function activateMenuByURL() {
  const current = window.location.pathname.split("/").pop().toLowerCase();
  const links = document.querySelectorAll(".side-nav-link");

  links.forEach((link) => {
    const href = link.getAttribute("href")?.toLowerCase();
    if (!href) return;

    if (current === href || current.includes(href.replace(".html", ""))) {
      link.classList.add("active");
      const parentItem = link.closest(".side-nav-item");
      if (parentItem) parentItem.classList.add("menu-open");

      // buka submenu jika ada
      const subMenu = link.closest(".side-nav-item")?.querySelector(".collapse");
      if (subMenu && !subMenu.classList.contains("show")) {
        subMenu.classList.add("show");
      }
    } else {
      link.classList.remove("active");
    }
  });
}

/* ============================================================
      🔹 PAGE INITIALIZATION
      ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  // Menu aktif otomatis
  activateMenuByURL();

  // Warna status select
  document.querySelectorAll(".status-select, #statusSelect").forEach((select) => {
    updateStatusColor(select);
    select.addEventListener("change", () => updateStatusColor(select));
  });

  // Snapshot form
  const pageFields = Array.from(document.querySelectorAll(".card-body input, .card-body select, .card-body textarea")).filter(isRelevantField);
  window._pageInitialSnap = snapshotFromFields(pageFields);

  // Simpan button (universal)
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn && !saveBtn.dataset.init) {
    saveBtn.dataset.init = "1";
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const currentSnap = snapshotFromFields(pageFields);
      const changed = !snapshotsEqual(window._pageInitialSnap, currentSnap);

      if (!changed) {
        showToast("Tidak ada perubahan data.", "info");
        return;
      }

      Swal.fire({
        title: "Simpan Data?",
        text: "Apakah Anda yakin ingin menyimpan perubahan ini?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Simpan",
        cancelButtonText: "Batal",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({ title: "Menyimpan...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          setTimeout(() => {
            Swal.close();
            showToast("Data berhasil disimpan!", "success");
            window._pageInitialSnap = snapshotFromFields(pageFields);
          }, 900);
        }
      });
    });
  }

  // Cegah pindah halaman jika form berubah
  document.querySelectorAll("a, .nav-link").forEach((link) => {
    if (link.dataset.navInit === "1") return;
    link.dataset.navInit = "1";

    link.addEventListener("click", (e) => {
      const currentSnap = snapshotFromFields(pageFields);
      const changed = !snapshotsEqual(window._pageInitialSnap, currentSnap);

      if (changed) {
        e.preventDefault();
        Swal.fire({
          title: "Perubahan Belum Disimpan!",
          text: "Anda memiliki perubahan yang belum disimpan. Apa yang ingin Anda lakukan?",
          icon: "warning",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Tinggalkan",
          denyButtonText: "Simpan",
          cancelButtonText: "Batal",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) window.location.href = link.href;
          else if (result.isDenied) {
            Swal.fire({ title: "Menyimpan...", didOpen: () => Swal.showLoading() });
            setTimeout(() => {
              Swal.close();
              showToast("Data berhasil disimpan!", "success");
              setTimeout(() => (window.location.href = link.href), 800);
            }, 1000);
          }
        });
      }
    });
  });
});
