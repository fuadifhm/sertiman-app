// ======================================================
// 🔹 Fungsi Toast (Bootstrap) - Global
// ======================================================
// ======================================================
// 🔹 Global showToast (dengan deduplikasi cepat)
// ======================================================
const _toastState = { lastMsg: null, lastTs: 0 };

function showToast(message, type = "info") {
  // dedupe: jika pesan sama muncul berulang dalam 800ms, abaikan
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
    const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
    toast.show();
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
  } catch (err) {
    // fallback: hapus setelah 2.5s kalau bootstrap tidak tersedia
    setTimeout(() => toastEl.remove(), 2500);
  }
}

// ======================================================
// 🔹 Konfirmasi Delete (safety check: single init)
// ======================================================
function initDeleteButton() {
  const deleteBtn = document.getElementById("deleteBtn");
  if (!deleteBtn) return;
  if (deleteBtn.dataset.init === "1") return;
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
      customClass: {
        confirmButton: "btn btn-sm btn-danger",
        cancelButton: "btn btn-sm btn-secondary",
        actions: "d-flex gap-2 justify-content-center",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Menghapus...",
          text: "Mohon tunggu sebentar",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        setTimeout(() => {
          Swal.close();
          showToast("Data berhasil dihapus!", "success");
        }, 1500);
      }
    });
  });
}

// ======================================================
// 🔹 Form Watcher (cek perubahan, logika save, navigasi)
// ======================================================
function initFormWatcher() {
  // pastikan ini hanya di-init sekali
  if (document.body.dataset.formWatcherInit === "1") return;
  document.body.dataset.formWatcherInit = "1";

  const saveBtn = document.getElementById("saveBtn");
  const imgInput = document.getElementById("imgInput");

  // Ambil semua input yang relevan; termasuk input di table
  function getInputs() {
    return Array.from(document.querySelectorAll("input.form-control, select.form-control, textarea.form-control, table input"));
  }

  let inputs = getInputs();
  if (!inputs.length && !saveBtn) return;

  // buat initialValues dengan kunci stabil di tiap element (data-init-key)
  const initialValues = {};
  function ensureInitKey(el) {
    if (!el.dataset.initKey) {
      el.dataset.initKey = "k" + Math.random().toString(36).slice(2, 9);
    }
    return el.dataset.initKey;
  }

  // capture awal
  inputs.forEach((input) => {
    const k = ensureInitKey(input);
    initialValues[k] = input.value ?? "";
  });

  // apakah halaman ini memiliki data awal (berarti kemungkinan update)
  const hasPrefilledData = Object.values(initialValues).some((v) => String(v).trim() !== "");

  // fungsi cek perubahan
  let isChanged = false;
  function checkChanges() {
    isChanged = false;
    // refresh input list (untuk menangani baris yang ditambahkan dinamis)
    inputs = getInputs();
    inputs.forEach((input) => {
      const k = ensureInitKey(input);
      if (initialValues.hasOwnProperty(k)) {
        if ((input.value ?? "") !== (initialValues[k] ?? "")) isChanged = true;
      } else {
        // input baru muncul (mis: tambah baris) -> jika ada nilai non-empty maka treat as change
        if ((input.value ?? "").toString().trim() !== "") isChanged = true;
      }
    });
    if (imgInput && imgInput.files && imgInput.files.length > 0) isChanged = true;
  }

  // pasang listener tiap input (delegasi ulang bila ada perubahan DOM sederhana)
  function attachInputWatchers() {
    inputs = getInputs();
    inputs.forEach((input) => {
      if (input.dataset.watchInit === "1") return;
      input.dataset.watchInit = "1";
      input.addEventListener("input", checkChanges);
      input.addEventListener("change", checkChanges);
    });
  }
  attachInputWatchers();

  // klik Simpan - pastikan listener hanya sekali
  if (saveBtn && saveBtn.dataset.saveInit !== "1") {
    saveBtn.dataset.saveInit = "1";
    saveBtn.addEventListener("click", function (e) {
      e.preventDefault();

      // refresh daftar input & watchers
      attachInputWatchers();
      checkChanges();

      // Jika tidak ada perubahan (update page) atau tidak ada data input sama sekali (create page)
      if (!isChanged) {
        if (hasPrefilledData) {
          // halaman update: ada data awal tetapi tidak ada perubahan
          showToast("Tidak ada perubahan data.", "info");
          return;
        } else {
          // halaman create: semua kosong
          // tambahan: cek apakah ada input berisi (kadang ada input yang bukan form-control)
          const anyNonEmpty = getInputs().some((i) => (i.value ?? "").toString().trim() !== "");
          if (!anyNonEmpty) {
            showToast("Tidak ada data yang diinput.", "warning");
            return;
          }
          // jika adaNonEmpty true tapi isChanged false (kemungkinan karena initial values sama),
          // lanjutkan ke konfirmasi simpan.
        }
      }

      // lanjut ke konfirmasi simpan
      Swal.fire({
        title: "Simpan Data?",
        text: "Apakah Anda yakin ingin menyimpan data ini?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Simpan",
        cancelButtonText: "Batal",
        reverseButtons: true,
        customClass: {
          confirmButton: "btn btn-sm btn-success",
          cancelButton: "btn btn-sm btn-secondary",
          actions: "d-flex gap-2 justify-content-center",
        },
        buttonsStyling: false,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Menyimpan...",
            text: "Mohon tunggu sebentar",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });

          setTimeout(() => {
            Swal.close();

            // update initialValues supaya dianggap saved
            inputs = getInputs();
            inputs.forEach((input) => {
              const k = ensureInitKey(input);
              initialValues[k] = input.value ?? "";
            });
            if (imgInput) imgInput.value = "";
            isChanged = false;

            showToast("Data berhasil disimpan!", "success");

            setTimeout(() => {
              window.location.href = "apps-master-data.html";
            }, 1200);
          }, 1400);
        }
      });
    });
  }

  // --- Fungsi utama untuk konfirmasi pindah halaman dengan 3 opsi ---
  function showUnsavedAlert(onLeave, onSave) {
    Swal.fire({
      title: "Perubahan Belum Disimpan!",
      text: "Anda memiliki perubahan yang belum disimpan. Apa yang ingin Anda lakukan?",
      icon: "warning",
      showCancelButton: true,
      showDenyButton: true, // tombol ketiga (Simpan)
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
        if (typeof onLeave === "function") onLeave();
      } else if (result.isDenied) {
        // Klik "Ya, Simpan"
        if (typeof onSave === "function") onSave();
      }
    });
  }

  // --- Pemantau navigasi link ---
  const navLinks = document.querySelectorAll("a, .nav-link");
  navLinks.forEach((link) => {
    if (link.dataset.navInit === "1") return;
    link.dataset.navInit = "1";

    link.addEventListener("click", function (e) {
      checkChanges(); // fungsi kamu sendiri untuk set isChanged
      if (isChanged) {
        e.preventDefault();
        showUnsavedAlert(
          () => (window.location.href = link.href), // aksi "Ya, Tinggalkan"
          () => saveDataAndRedirect(link.href) // aksi "Ya, Simpan"
        );
      }
    });
  });

  // --- Pemantau tombol Back browser ---
  if (!window._formWatcherPopstateAdded) {
    window._formWatcherPopstateAdded = true;
    window.addEventListener("popstate", function (e) {
      checkChanges();
      if (isChanged) {
        e.preventDefault();
        showUnsavedAlert(
          () => (window.location.href = "apps-master-data.html"),
          () => saveDataAndRedirect("apps-master-data.html")
        );
      } else {
        window.location.href = "apps-master-data.html";
      }
    });
  }

  // --- Fungsi Simpan (SweetAlert Loading + Toast Hasil) ---
  function saveDataAndRedirect(targetUrl) {
    Swal.fire({
      title: "Menyimpan...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // Simulasi proses simpan (ganti dengan AJAX sesungguhnya)
    saveFormData()
      .then(() => {
        Swal.close();
        showToast("Data berhasil disimpan!", "success");
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 1500);
      })
      .catch(() => {
        Swal.close();
        showToast("danger", "Gagal menyimpan data! Silakan coba lagi.");
      });
  }

  // --- Fungsi simulasi proses simpan ---
  function saveFormData() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = true; // ubah sesuai kondisi sebenarnya
        if (success) resolve();
        else reject();
      }, 2000);
    });
  }

  // push dummy state saat pertama load agar popstate dapat dikontrol
  history.pushState(null, null, window.location.href);
}

// ======================================================
// 🔹 Init setelah DOM siap
// ======================================================
document.addEventListener("DOMContentLoaded", function () {
  initDeleteButton();
  initFormWatcher();
  // kalau perlu: initPasswordToggle(), initDataTable(), dll
});

document.getElementById("customFile").addEventListener("change", function (e) {
  const fileName = e.target.files.length ? e.target.files[0].name : "No file chosen";
  document.getElementById("customFileName").textContent = fileName;
});
