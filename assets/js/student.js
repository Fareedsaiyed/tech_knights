function bindStudentTabs() {
  qsa(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      qsa(".tab-btn").forEach(x => x.classList.remove("active"));
      qsa(".tab-panel").forEach(x => x.classList.add("hidden"));
      btn.classList.add("active");
      qs(`#${btn.dataset.tab}`).classList.remove("hidden");
    });
  });
}

function getStudentAttendanceRecords(state, enrollment) {
  return Object.entries(state.attendance)
    .filter(([key]) => key.startsWith(`${enrollment}_`))
    .map(([key, status]) => {
      const parts = key.split("_");
      return { date: parts[1], lecture: Number(parts[2]), status };
    })
    .sort((a, b) => {
      if (a.date === b.date) return a.lecture - b.lecture;
      return a.date.localeCompare(b.date);
    });
}

function renderQuickDateChips(records) {
  const target = qs("#attendanceQuickDates");
  const dates = [...new Set(records.map(r => r.date))].reverse();
  if (!dates.length) {
    target.innerHTML = `<span class="small">No attendance dates available yet.</span>`;
    return;
  }
  target.innerHTML = dates.slice(0, 10).map(date => `<button class="chip-btn" type="button" data-date="${date}">${date}</button>`).join("");
  qsa(".chip-btn", target).forEach(btn => {
    btn.addEventListener("click", () => {
      qs("#studentAttendanceDate").value = btn.dataset.date;
      renderStudentAttendance(getState(), getState().session.enrollment, btn.dataset.date);
    });
  });
}

function renderStudentAttendance(state, enrollment, selectedDate = "") {
  const records = getStudentAttendanceRecords(state, enrollment);
  const note = qs("#attendanceViewNote");
  let filtered = records;

  if (selectedDate) {
    filtered = records.filter(r => r.date === selectedDate);
    note.textContent = filtered.length
      ? `Showing attendance for ${selectedDate}.`
      : `No attendance found for ${selectedDate}.`;
  } else {
    note.textContent = "Showing complete attendance record.";
  }

  const rows = filtered.length
    ? filtered.map(r => `<tr><td>${r.date}</td><td>Lecture ${r.lecture}</td><td><span class="status ${r.status === "Present" ? "present" : "absent"}">${r.status}</span></td></tr>`).join("")
    : `<tr><td colspan="3">No attendance records yet.</td></tr>`;

  qs("#studentAttendanceTable").innerHTML = `<thead><tr><th>Date</th><th>Lecture</th><th>Status</th></tr></thead><tbody>${rows}</tbody>`;
  renderQuickDateChips(records);

  qsa(".chip-btn").forEach(btn => {
    btn.classList.toggle("active", !!selectedDate && btn.dataset.date === selectedDate);
  });
}

function loadSubmission(state, enrollment, subject) {
  const key = `${enrollment}_${subject}`;
  const item = state.submissions[key];
  qs("#studentCode").value = item.code || "";
  qs("#studentOutput").value = item.output || "";
  qs("#submissionStatusView").value = item.status || "Not Submitted";
  qs("#studentRemarks").textContent = item.remarks || "No remarks yet.";
}

function saveSubmission() {
  const state = getState();
  const enrollment = state.session.enrollment;
  const subject = qs("#studentPracticalSubject").value;
  const key = `${enrollment}_${subject}`;
  state.submissions[key].code = qs("#studentCode").value.trim();
  state.submissions[key].output = qs("#studentOutput").value.trim();
  state.submissions[key].status = state.submissions[key].code || state.submissions[key].output ? "Submitted" : "Not Submitted";
  saveState(state);
  loadSubmission(state, enrollment, subject);
  showToast("Journal submission saved.");
}

function renderStudentMarks(state, enrollment) {
  const rows = ALL_SUBJECTS.map(subject => {
    const key = `${enrollment}_${subject}`;
    const m = state.marks[key];
    return `<tr>
      <td>${SUBJECT_NAMES[subject]}</td>
      <td>${m.internal1}</td>
      <td>${m.internal2}</td>
      <td>${m.universityExam}</td>
      <td>${m.mcq}</td>
      <td>${m.viva ?? "-"}</td>
      <td>${m.practical ?? "-"}</td>
      <td>${getTotalMarks(m)}</td>
    </tr>`;
  }).join("");

  qs("#studentMarksTable").innerHTML = `<thead><tr><th>Subject</th><th>Internal 1</th><th>Internal 2</th><th>University Exam</th><th>MCQ</th><th>Viva</th><th>Practical</th><th>Total</th></tr></thead><tbody>${rows}</tbody>`;
}

function bindAttendanceDateTools(studentEnrollment) {
  const dateInput = qs("#studentAttendanceDate");
  qs("#studentCalendarBtn").addEventListener("click", () => {
    if (typeof dateInput.showPicker === "function") {
      dateInput.showPicker();
    } else {
      dateInput.focus();
      dateInput.click();
    }
  });

  qs("#viewSelectedDayBtn").addEventListener("click", () => {
    renderStudentAttendance(getState(), studentEnrollment, dateInput.value);
  });

  qs("#showAllAttendanceBtn").addEventListener("click", () => {
    dateInput.value = "";
    renderStudentAttendance(getState(), studentEnrollment);
  });

  dateInput.addEventListener("change", () => {
    renderStudentAttendance(getState(), studentEnrollment, dateInput.value);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const state = requireRole("student");
  if (!state) return;
  renderTopbarSession();
  bindStudentTabs();
  fillSubjectOptions(qs("#studentPracticalSubject"), false);

  const student = getStudentByEnrollment(state.session.enrollment);
  qs("#studentNameLabel").textContent = student.name;
  qs("#studentEnrollmentLabel").textContent = student.enrollment;
  qs("#attendancePercentLabel").textContent = `${calculateAttendancePercent(state, student.enrollment)}%`;

  renderStudentAttendance(state, student.enrollment);
  renderStudentMarks(state, student.enrollment);
  loadSubmission(state, student.enrollment, qs("#studentPracticalSubject").value);
  bindAttendanceDateTools(student.enrollment);

  qs("#studentPracticalSubject").addEventListener("change", () => loadSubmission(getState(), student.enrollment, qs("#studentPracticalSubject").value));
  qs("#saveSubmissionBtn").addEventListener("click", saveSubmission);
  renderChatInterface();
  qs("#logoutBtn").addEventListener("click", () => { logout(); window.location.href = "login.html"; });
});
