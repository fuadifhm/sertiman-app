// ======================================================
// 🔹 FIXED: NO PAGE LOCKUP, NO RELOAD VERSION
// ======================================================

// -----------------------------
// Toast (dedupe)
// -----------------------------
const _toastState = { lastMsg: null, lastTs: 0 };
function showToast(message, type = "info") {
  const nowTs = Date.now();
  if (message === _toastState.lastMsg && nowTs - _toastState.lastTs < 800) return;
  _toastState.lastMsg = message;
  _toastState.lastTs = nowTs;

  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

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
    const toast = new bootstrap.Toast(toastEl, { delay: 2300 });
    toast.show();
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
  } catch {
    setTimeout(() => toastEl.remove(), 2500);
  }
}

// -----------------------------
// Universal cleanup
// -----------------------------
function cleanupOverlays() {
  document.querySelectorAll(".modal-backdrop, .swal2-container").forEach((el) => el.remove());
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "auto";
}

// -----------------------------
// Add-row utility
// -----------------------------
function addRow(tableId, dataArr) {
  const tbody = document.querySelector(`#${tableId}`);
  if (!tbody) return;
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td class="text-center">${tbody.rows.length + 1}</td>
    ${dataArr.map((d) => `<td>${d}</td>`).join("")}
    <td class="text-center">
      <button class="btn btn-soft-danger btn-sm" data-action="delete"><i class="ti ti-trash"></i></button>
    </td>`;
  tbody.appendChild(newRow);
}

// -----------------------------
// Delete handler
// -----------------------------
document.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-action='delete']");
  if (!btn) return;
  confirmDelete(btn);
});

function confirmDelete(btn) {
  Swal.fire({
    title: "Apakah Anda Yakin?",
    text: "Data yang dihapus tidak dapat dikembalikan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
    reverseButtons: true,
    customClass: {
      confirmButton: "btn btn-sm btn-danger",
      cancelButton: "btn btn-sm btn-secondary",
      actions: "d-flex gap-2 justify-content-center",
    },
    buttonsStyling: false,
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: "Menghapus...", text: "Mohon tunggu sebentar", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      setTimeout(() => {
        Swal.close();
        btn.closest("tr")?.remove();
        cleanupOverlays();
        showToast("Data berhasil dihapus!", "success");
      }, 900);
    }
  });
}

// -----------------------------
// Form handler (NO reload)
// -----------------------------
function handleFormSubmit(formId, inputSelectors, tableId, modalId, successLabel) {
  const form = document.getElementById(formId);
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const values = inputSelectors.map((s) => document.querySelector(s)?.value.trim() || "");
    if (values.some((v) => !v)) return showToast("Lengkapi semua field terlebih dahulu.", "warning");

    Swal.fire({
      title: "Konfirmasi Data",
      text: `Apakah Anda ingin menyimpan data ${successLabel}?`,
      icon: "question",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      denyButtonText: "Edit Lagi",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn btn-sm btn-success",
        denyButton: "btn btn-sm btn-warning",
        cancelButton: "btn btn-sm btn-secondary",
        actions: "d-flex gap-2 justify-content-center",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: "Menyimpan...", text: "Mohon tunggu sebentar", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        setTimeout(() => {
          addRow(tableId, values);
          inputSelectors.forEach((s) => (document.querySelector(s).value = ""));
          Swal.close();
          try {
            bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
          } catch {}
          cleanupOverlays();
          showToast(`${successLabel} berhasil disimpan!`, "success");
        }, 1000);
      } else if (result.isDenied) {
        showToast("Silakan periksa kembali data Anda.", "info");
      } else {
        showToast("Aksi dibatalkan.", "info");
      }
    });
  });
}

// -----------------------------
// Inisialisasi
// -----------------------------
document.addEventListener("DOMContentLoaded", function () {
  // Bind semua form referensi sertifikat
  handleFormSubmit("formJenis", ["#inputJenis"], "tableJenis", "modalJenis", "Jenis Sertifikat");
  handleFormSubmit("formBidang", ["#inputBidang"], "tableBidang", "modalBidang", "Bidang");
  handleFormSubmit("formSubBidang", ["#inputSubBidang", "#selectBidang"], "tableSubBidang", "modalSubBidang", "Sub Bidang");

  // Form Proyek
  const formProyek = document.getElementById("formAddProyek");
  if (formProyek && !formProyek.dataset.bound) {
    formProyek.dataset.bound = "1";
    formProyek.addEventListener("submit", (e) => {
      e.preventDefault();
      const nama = formProyek.querySelector('[name="nama_proyek"]')?.value.trim() || "";
      const lokasi = formProyek.querySelector('[name="lokasi"]')?.value.trim() || "";
      if (!nama || !lokasi) return showToast("Nama proyek & lokasi wajib diisi.", "warning");

      Swal.fire({
        title: "Konfirmasi Data",
        text: `Simpan data proyek "${nama}"?`,
        icon: "question",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Simpan",
        denyButtonText: "Edit Lagi",
        cancelButtonText: "Batal",
        reverseButtons: true,
        customClass: {
          confirmButton: "btn btn-sm btn-success",
          denyButton: "btn btn-sm btn-warning",
          cancelButton: "btn btn-sm btn-secondary",
          actions: "d-flex gap-2 justify-content-center",
        },
        buttonsStyling: false,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({ title: "Menyimpan...", text: "Mohon tunggu sebentar", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

          setTimeout(() => {
            addRow("proyekTableBody", [nama, lokasi]);
            formProyek.reset();
            try {
              bootstrap.Modal.getInstance(document.getElementById("modalAddProyek")).hide();
            } catch {}
            Swal.close();
            cleanupOverlays();
            showToast("Proyek berhasil disimpan!", "success");
          }, 1000);
        } else if (result.isDenied) {
          showToast("Silakan edit data proyek.", "info");
        }
      });
    });
  }
});
