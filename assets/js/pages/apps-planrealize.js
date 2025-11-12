/* ============================================================
   🔹 GLOBAL TOAST (Reusable untuk semua halaman)
   ============================================================ */
const _toastState = { lastMsg: null, lastTs: 0 };

function showToast(message, type = "info") {
  const nowTs = Date.now();
  if (message === _toastState.lastMsg && nowTs - _toastState.lastTs < 800) return;

  _toastState.lastMsg = message;
  _toastState.lastTs = nowTs;

  const toastContainer = document.getElementById("toastContainer");

  // Custom Bootstrap Toast
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
  } catch (err) {
    setTimeout(() => toastEl.remove(), 2500);
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
  return (el.value ?? "").toString().trim();
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

// ---------- FUNGSI WARNA STATUS ----------
function updateStatusColor(select) {
  let val = select.value;
  select.classList.remove("bg-secondary-subtle", "text-secondary", "bg-primary-subtle", "text-primary", "bg-warning-subtle", "text-warning", "bg-success-subtle", "text-success");

  if (val === "P. Berkasan") {
    select.classList.add("bg-secondary-subtle", "text-secondary");
  } else if (val === "Proses LSP") {
    select.classList.add("bg-primary-subtle", "text-primary");
  } else if (val === "Assesmen") {
    select.classList.add("bg-warning-subtle", "text-warning");
  } else if (val === "Terbit") {
    select.classList.add("bg-success-subtle", "text-success");
  }
}

/* ============================================================
         🔹 MAIN INIT
         ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  if (window._planRealizeInit) return;
  window._planRealizeInit = true;

  // ---------- INIT WARNA STATUS ----------
  document.querySelectorAll(".status-select").forEach((select) => {
    updateStatusColor(select);
    select.addEventListener("change", () => updateStatusColor(select));
  });

  // ---------- PAGE SNAPSHOT ----------
  const pageFields = Array.from(document.querySelectorAll(".card-body input, .card-body select, .card-body textarea")).filter(isRelevantField);

  window._pageInitialSnap = snapshotFromFields(pageFields);

  // ---------- DELETE BUTTON ----------
  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn && !deleteBtn.dataset.init) {
    deleteBtn.dataset.init = "1";
    deleteBtn.addEventListener("click", function () {
      Swal.fire({
        title: "Apakah Anda Yakin?",
        text: "Data yang dihapus tidak dapat dikembalikan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Hapus",
        cancelButtonText: "Batal",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Menghapus...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });
          setTimeout(() => {
            Swal.close();
            showToast("Data berhasil dihapus!", "success");
            setTimeout(() => (window.location.href = "apps-planrealize.html"), 800);
          }, 1000);
        }
      });
    });
  }

  // ---------- MODAL SNAPSHOT ----------
  const modalEl = document.getElementById("terbitModal");
  let modalInitial = {};
  if (modalEl) {
    modalEl.addEventListener("show.bs.modal", () => {
      const fields = Array.from(modalEl.querySelectorAll("input, select, textarea")).filter(isRelevantField);
      modalInitial = snapshotFromFields(fields);
    });
    modalEl.addEventListener("hidden.bs.modal", () => (modalInitial = {}));
  }

  // ---------- SAVE BUTTON(S) ----------
  document.querySelectorAll("#saveBtn").forEach((btn) => {
    if (btn.dataset.init) return;
    btn.dataset.init = "1";
    const inModal = modalEl && modalEl.contains(btn);

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const scopeEl = inModal ? modalEl : document.querySelector(".card-body, .card") || document.body;
      const fields = Array.from(scopeEl.querySelectorAll("input, select, textarea")).filter(isRelevantField);

      const currentSnap = snapshotFromFields(fields);
      const anyFilled = Object.values(currentSnap).some((v) => v !== "");
      const initialSnap = inModal ? modalInitial : window._pageInitialSnap || snapshotFromFields(fields);
      const changed = !snapshotsEqual(initialSnap, currentSnap);

      if (!anyFilled) return showToast("Tidak ada data yang diinput.", "warning");
      if (!changed) return showToast("Tidak ada perubahan data.", "info");

      Swal.fire({
        title: "Simpan Data?",
        text: "Apakah Anda yakin ingin menyimpan perubahan ini?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Simpan",
        cancelButtonText: "Batal",
        reverseButtons: true,
      }).then((result) => {
        if (!result.isConfirmed) return;
        Swal.fire({ title: "Menyimpan...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        setTimeout(() => {
          Swal.close();
          showToast("Data berhasil disimpan!", "success");
          if (inModal) modalInitial = snapshotFromFields(fields);
          else window._pageInitialSnap = snapshotFromFields(fields);
          setTimeout(() => (window.location.href = "apps-planrealize.html#realisasiSertif"), 900);
        }, 900);
      });
    });
  });

  // ---------- LOGIKA UBAH STATUS ----------
  const statusSelect = document.getElementById("statusSelect");
  const modalTerbitEl = document.getElementById("terbitModal");
  const terbitModal = modalTerbitEl ? new bootstrap.Modal(modalTerbitEl) : null;

  if (statusSelect && !statusSelect.dataset.statusInit) {
    statusSelect.dataset.statusInit = "1";

    // Inisialisasi warna awal
    updateStatusColor(statusSelect);
    let lastValue = statusSelect.value;

    // Aturan transisi yang diperbolehkan
    const allowedTransitions = {
      "P. Berkasan": ["Proses LSP"],
      "Proses LSP": ["Assesmen", "P. Berkasan"],
      Assesmen: ["Proses LSP", "Terbit"],
      Terbit: [],
    };

    statusSelect.addEventListener("change", function () {
      const newValue = this.value;

      // Validasi transisi status
      if (!allowedTransitions[lastValue]?.includes(newValue)) {
        showToast(`Tidak bisa pindah dari "${lastValue}" ke "${newValue}"`, "error");
        this.value = lastValue;
        updateStatusColor(this); // warna balik
        return;
      }

      Swal.fire({
        title: "Ubah Status?",
        text: `Apakah Anda yakin ingin mengubah status menjadi "${newValue}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, ubah",
        cancelButtonText: "Batal",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Menyimpan...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });

          // Simulasi proses simpan
          setTimeout(() => {
            Swal.close();

            // Update lastValue dan warna untuk semua kasus
            lastValue = newValue;
            updateStatusColor(statusSelect);

            if (newValue === "Terbit") {
              // Jika status Terbit, tampilkan modal
              if (terbitModal) terbitModal.show();
            } else {
              // Jika bukan Terbit, tampilkan toast sukses
              showToast(`Status berhasil diubah menjadi "${newValue}"`, "success");
              // Refresh ke tab realisasi setelah delay
              setTimeout(() => {
                window.location.href = "apps-planrealize.html#realisasiSertif";
              }, 900);
            }
          }, 1000);
        } else {
          // Jika batal, kembalikan nilai & warna ke sebelumnya
          statusSelect.value = lastValue;
          updateStatusColor(statusSelect);
        }
      });
    });
  }

  // ---------- CANCEL BUTTON ----------
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn && !cancelBtn.dataset.init) {
    cancelBtn.dataset.init = "1";
    cancelBtn.addEventListener("click", function () {
      const statusSelect = document.getElementById("statusSelect");
      if (statusSelect) {
        const lastValue = statusSelect.value;
        showToast(`Perubahan dibatalkan. Status tetap di "${lastValue}".`, "info");
      }
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }
    });
  }

  // ---------- AUTO TAB ----------
  if (window.location.hash === "#realisasiSertif") {
    const tabTriggerEl = document.querySelector('[data-bs-target="#realisasiSertif"]');
    if (tabTriggerEl) new bootstrap.Tab(tabTriggerEl).show();
  }

  // ---------- CEK FORM CHANGE ----------
  function isFormChanged() {
    const fields = Array.from(document.querySelectorAll(".card-body input, .card-body select, .card-body textarea")).filter(isRelevantField);
    const currentSnap = snapshotFromFields(fields);
    return !snapshotsEqual(window._pageInitialSnap, currentSnap);
  }

  // ---------- CEK PERUBAHAN SEBELUM PINDAH LINK (Versi 3 Opsi) ----------
  document.querySelectorAll("a, .nav-link").forEach((link) => {
    if (link.dataset.navInit === "1") return;
    link.dataset.navInit = "1";

    link.addEventListener("click", function (e) {
      if (isFormChanged()) {
        e.preventDefault();
        Swal.fire({
          title: "Perubahan Belum Disimpan!",
          text: "Anda memiliki perubahan yang belum disimpan. Apa yang ingin Anda lakukan?",
          icon: "warning",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Ya, Tinggalkan",
          denyButtonText: "Ya, Simpan",
          cancelButtonText: "Batal",
          reverseButtons: true,
          customClass: {
            confirmButton: "btn btn-sm btn-danger",
            denyButton: "btn btn-sm btn-success",
            cancelButton: "btn btn-sm btn-secondary",
            actions: "d-flex gap-2 justify-content-center",
          },
          buttonsStyling: false,
        }).then((result) => {
          if (result.isConfirmed) {
            // Klik "Ya, Tinggalkan"
            window.location.href = link.href;
          } else if (result.isDenied) {
            // Klik "Ya, Simpan"
            Swal.fire({
              title: "Menyimpan...",
              text: "Mohon tunggu sebentar",
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading(),
            });

            // simulasi proses simpan (ganti dengan AJAX real)
            setTimeout(() => {
              Swal.close();
              showToast("Data berhasil disimpan!", "success");
              setTimeout(() => {
                window.location.href = link.href;
              }, 1000);
            }, 1200);
          }
        });
      }
    });
  });
});
