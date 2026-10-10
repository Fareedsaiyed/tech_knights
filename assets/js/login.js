document.addEventListener("DOMContentLoaded", () => {
  getState();
  fillSubjectOptions(qs("#teacherSubject"));

  qsa(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      qsa(".tab-btn").forEach(x => x.classList.remove("active"));
      qsa(".tab-panel").forEach(x => x.classList.add("hidden"));
      btn.classList.add("active");
      qs(`#${btn.dataset.tab}`).classList.remove("hidden");
    });
  });

  qs("#teacherLoginBtn").addEventListener("click", () => {
    const res = loginTeacher(qs("#teacherSubject").value, qs("#teacherPassword").value.trim());
    if (!res.ok) return showToast(res.message);
    window.location.href = "teacher.html";
  });

  qs("#studentLoginBtn").addEventListener("click", () => {
    const res = loginStudent(qs("#studentEnrollment").value.trim(), qs("#studentPassword").value.trim());
    if (!res.ok) return showToast(res.message);
    window.location.href = "student.html";
  });

  qs("#adminLoginBtn").addEventListener("click", () => {
    const res = loginAdmin(qs("#adminId").value.trim(), qs("#adminPassword").value.trim());
    if (!res.ok) return showToast(res.message);
    window.location.href = "admin.html";
  });

  qs("#resetDemoBtn").addEventListener("click", () => {
    resetState();
    showToast("Demo data reset completed.");
  });
});
