function renderAdminSummary(state) {
  qs("#adminTeachersCount").textContent = state.teachers.length;
  qs("#adminStudentsCount").textContent = state.students.length;
}

function renderAccountOptions() {
  const state = getState();
  const select = qs("#adminAccountSelect");
  const teacherOptions = state.teachers.map(t => `<option value="teacher:${t.subject}">Teacher • ${SUBJECT_NAMES[t.subject]}</option>`).join("");
  const studentOptions = state.students.map(s => `<option value="student:${s.enrollment}">Student • ${s.name} (${s.enrollment})</option>`).join("");
  select.innerHTML = `${teacherOptions}${studentOptions}`;
}

function renderSelectedProfile() {
  const state = getState();
  const [role, id] = qs("#adminAccountSelect").value.split(":");
  const studentRow = qs("#adminStudentNameRow");
  if (role === "teacher") {
    const teacher = getTeacherBySubject(id);
    qs("#adminRoleLabel").textContent = `Teacher • ${SUBJECT_NAMES[id]}`;
    qs("#adminIdentityLabel").textContent = id;
    qs("#adminStudentName").value = "";
    studentRow.classList.add("hidden");
    qs("#adminPassword").value = teacher.password;
  } else {
    const student = getStudentByEnrollment(id);
    qs("#adminRoleLabel").textContent = `Student • ${student.enrollment}`;
    qs("#adminIdentityLabel").textContent = student.enrollment;
    qs("#adminStudentName").value = student.name;
    studentRow.classList.remove("hidden");
    qs("#adminPassword").value = student.password;
  }
}

function saveAdminProfile() {
  const state = getState();
  const [role, id] = qs("#adminAccountSelect").value.split(":");
  const newPassword = qs("#adminPassword").value.trim();
  if (!newPassword) return showToast("Password required.");

  if (role === "teacher") {
    const teacher = state.teachers.find(t => t.subject === id);
    teacher.password = newPassword;
  } else {
    const student = state.students.find(s => s.enrollment === id);
    student.password = newPassword;
    student.name = qs("#adminStudentName").value.trim() || student.name;
    if (state.session?.role === "student" && state.session.enrollment === id) {
      state.session.name = student.name;
    }
  }
  saveState(state);
  renderAccountOptions();
  qs("#adminAccountSelect").value = `${role}:${id}`;
  renderSelectedProfile();
  showToast("Profile updated by admin.");
}

document.addEventListener("DOMContentLoaded", () => {
  const state = requireRole("admin");
  if (!state) return;
  renderTopbarSession();
  renderAdminSummary(state);
  renderAccountOptions();
  renderSelectedProfile();
  qs("#adminAccountSelect").addEventListener("change", renderSelectedProfile);
  qs("#adminSaveBtn").addEventListener("click", saveAdminProfile);
  qs("#logoutBtn").addEventListener("click", () => { logout(); window.location.href = "login.html"; });
});
