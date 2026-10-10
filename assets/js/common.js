function qs(sel, scope = document) { return scope.querySelector(sel); }
function qsa(sel, scope = document) { return [...scope.querySelectorAll(sel)]; }

function setTopbar(title, subtitle) {
  const titleEl = qs("#pageTitle");
  const subEl = qs("#pageSubtitle");
  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;
}

function showToast(message) {
  const toast = qs("#toast");
  if (!toast) return alert(message);
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function fillSubjectOptions(select, includeAll = true) {
  const items = includeAll ? ALL_SUBJECTS : PRACTICAL_SUBJECTS;
  select.innerHTML = items.map(sub => `<option value="${sub}">${SUBJECT_NAMES[sub]}</option>`).join("");
}

function renderTopbarSession() {
  const state = getState();
  const target = qs("#sessionBadge");
  if (!target || !state.session) return;
  if (state.session.role === "teacher") {
    target.textContent = `Teacher • ${SUBJECT_NAMES[state.session.subject]}`;
  } else if (state.session.role === "student") {
    target.textContent = `Student • ${state.session.enrollment}`;
  } else {
    target.textContent = `Admin • ${state.session.id}`;
  }
}

function escapeHtml(text) {
  return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
