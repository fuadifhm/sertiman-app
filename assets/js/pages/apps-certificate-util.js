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
  } catch (err) {
    setTimeout(() => toastEl.remove(), 2500);
  }
}

/* ============================================================
      🔹 STATUS SELECT COLOR HELPER (Final)
      ============================================================ */
function updateStatusColor(select) {
  let val = (select.value || "").toLowerCase();
  select.classList.remove("bg-success-subtle", "bg-danger-subtle", "text-success", "text-danger", "text-white", "fw-bold");

  if (val === "digunakan") {
    select.classList.add("bg-danger-subtle", "text-danger", "fw-bold"); // merah
  } else if (val === "tersedia") {
    select.classList.add("bg-success-subtle", "text-success", "fw-bold"); // hijau
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

/* ============================================================
      🔹 MAIN INIT (apps-certificate-util.html)
      ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  if (window._certificateUtilInit) return;
  window._certificateUtilInit = true;

  // ---------- INIT WARNA STATUS ----------
  document.querySelectorAll(".status-select, #statusSelect").forEach((select) => {
    updateStatusColor(select);
    select.addEventListener("change", () => updateStatusColor(select));
  });

  // ---------- PAGE SNAPSHOT ----------
  const pageFields = Array.from(document.querySelectorAll(".card-body input, .card-body select, .card-body textarea")).filter(isRelevantField);
  window._pageInitialSnap = snapshotFromFields(pageFields);

  // ---------- SAVE BUTTON ----------
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn && !saveBtn.dataset.init) {
    saveBtn.dataset.init = "1";
    saveBtn.addEventListener("click", function (e) {
      e.preventDefault();

      const fields = pageFields;
      const currentSnap = snapshotFromFields(fields);

      const allEmpty = Object.values(currentSnap).every((v) => !v || v.trim() === "" || v === "Pilih sertifikat");
      const initialAllEmpty = Object.values(window._pageInitialSnap).every((v) => !v || v.trim() === "" || v === "Pilih sertifikat");
      const changed = !snapshotsEqual(window._pageInitialSnap, currentSnap);

      if (initialAllEmpty && allEmpty) {
        showToast("Tidak ada data yang diinput.", "warning");
        return;
      }
      if (!initialAllEmpty && !changed) {
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
        if (!result.isConfirmed) return;

        Swal.fire({ title: "Menyimpan...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        setTimeout(() => {
          Swal.close();
          showToast("Data berhasil disimpan!", "success");
          window._pageInitialSnap = snapshotFromFields(fields);
          setTimeout(() => (window.location.href = "apps-certificate-util.html"), 900);
        }, 900);
      });
    });
  }

  // ---------- STATUS SELECT (LOGIC UBAH STATUS) ----------
  const statusSelects = document.querySelectorAll(".status-select, #statusSelect");

  statusSelects.forEach((statusSelect) => {
    if (statusSelect.dataset.init) return;
    statusSelect.dataset.init = "1";

    let lastValue = statusSelect.value;

    updateStatusColor(statusSelect);

    statusSelect.addEventListener("change", function () {
      const newValue = this.value;

      Swal.fire({
        title: "Ubah Status?",
        text: `Apakah Anda yakin ingin mengubah status menjadi "${newValue === "digunakan" ? "Digunakan" : "Tersedia"}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Ubah",
        cancelButtonText: "Batal",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({ title: "Menyimpan...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

          setTimeout(() => {
            Swal.close();
            lastValue = newValue;
            updateStatusColor(statusSelect);

            if (newValue === "tersedia") {
              // 🔹 langsung hapus row dari tabel
              const row = statusSelect.closest("tr");
              if (row) row.remove();

              showToast("Status berhasil diubah menjadi 'Tersedia'. Data dihapus dari halaman.", "success");
            } else {
              showToast("Status berhasil diubah menjadi 'Digunakan'", "success");
            }
          }, 800);
        } else {
          statusSelect.value = lastValue;
          updateStatusColor(statusSelect);
        }
      });
    });
  });

  // ---------- CANCEL BUTTON ----------
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn && !cancelBtn.dataset.init) {
    cancelBtn.dataset.init = "1";
    cancelBtn.addEventListener("click", function () {
      if (statusSelect) {
        statusSelect.value = lastValue;
        updateStatusColor(statusSelect);
        showToast(`Perubahan dibatalkan. Status tetap di "${lastValue}".`, "info");
      }
    });
  }

  // ---------- CEK FORM CHANGE ----------
  function isFormChanged() {
    const currentSnap = snapshotFromFields(pageFields);
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
  $(document).ready(function () {
    $(".selectemployee").select2({
      templateResult: formatOption,
      templateSelection: formatOption,
      width: "100%",
    });

    function formatOption(option) {
      if (!option.id) return option.text;

      const status = $(option.element).data("status");
      const text = option.text;

      let icon = "";
      let colorClass = "";

      // Tentukan ikon & warna berdasarkan status
      switch (status) {
        case "available":
          icon = '<i class="ti ti-circle-check me-2 text-success"></i>';
          colorClass = "text-success fw-semibold";
          break;
        case "unavailable":
          icon = '<i class="ti ti-circle-x me-2 text-danger"></i>';
          colorClass = "text-danger fw-semibold";
          break;
      }

      // Render HTML option dengan ikon & warna
      return $(`<span class="${colorClass}">${icon}${text}</span>`);
    }
  });
});
