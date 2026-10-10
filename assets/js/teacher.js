function bindTeacherTabs() {
  qsa(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      qsa(".tab-btn").forEach(x => x.classList.remove("active"));
      qsa(".tab-panel").forEach(x => x.classList.add("hidden"));
      btn.classList.add("active");
      qs(`#${btn.dataset.tab}`).classList.remove("hidden");
    });
  });
}

function renderAttendanceTable(state, date, lecture) {
  const table = qs("#attendanceTable");
  const rows = state.students.map(student => {
    const key = `${student.enrollment}_${date}_${lecture}`;
    const value = state.attendance[key] || "Present";
    return `<tr>
      <td>${student.enrollment}</td>
      <td>${student.name}</td>
      <td>
        <select class="select attendance-select" data-key="${key}">
          <option ${value === "Present" ? "selected" : ""}>Present</option>
          <option ${value === "Absent" ? "selected" : ""}>Absent</option>
        </select>
      </td>
    </tr>`;
  }).join("");

  table.innerHTML = `<thead><tr><th>Enrollment</th><th>Name</th><th>Status</th></tr></thead><tbody>${rows}</tbody>`;
}

function saveAttendanceData() {
  const state = getState();
  qsa(".attendance-select").forEach(select => {
    state.attendance[select.dataset.key] = select.value;
  });
  saveState(state);
  showToast("Attendance saved successfully.");
}

function renderSubmissionTable(state, subject) {
  const info = qs("#submissionInfo");
  const table = qs("#submissionTable");
  if (!PRACTICAL_SUBJECTS.includes(subject)) {
    info.textContent = "Only practical subject teachers can use submission panel.";
    table.innerHTML = `<tbody><tr><td>This subject does not have practical journal checking.</td></tr></tbody>`;
    return;
  }
  info.textContent = `Showing ${SUBJECT_NAMES[subject]} journal submissions.`;
  const rows = state.students.map(student => {
    const key = `${student.enrollment}_${subject}`;
    const sub = state.submissions[key];
    return `<tr>
      <td>${student.enrollment}</td>
      <td>${student.name}</td>
      <td><span class="status ${sub.status === "Checked" ? "checked" : "pending"}">${sub.status}</span></td>
      <td><div class="code-box">${sub.code || "No code submitted."}</div></td>
      <td><div class="code-box">${sub.output || "No output submitted."}</div></td>
      <td>
        <select class="select submission-status" data-key="${key}">
          <option ${sub.status === "Not Submitted" ? "selected" : ""}>Not Submitted</option>
          <option ${sub.status === "Submitted" ? "selected" : ""}>Submitted</option>
          <option ${sub.status === "Checked" ? "selected" : ""}>Checked</option>
        </select>
        <textarea class="textarea submission-remarks" data-key="${key}" style="min-height:84px;margin-top:8px" placeholder="Teacher remarks...">${sub.remarks || ""}</textarea>
      </td>
    </tr>`;
  }).join("");
  table.innerHTML = `<thead><tr><th>Enrollment</th><th>Name</th><th>Status</th><th>Code</th><th>Output</th><th>Review</th></tr></thead><tbody>${rows}</tbody>`;

  qsa(".submission-status, .submission-remarks").forEach(el => {
    el.addEventListener("change", () => {
      const latest = getState();
      const key = el.dataset.key;
      latest.submissions[key].status = qs(`.submission-status[data-key="${key}"]`).value;
      latest.submissions[key].remarks = qs(`.submission-remarks[data-key="${key}"]`).value;
      saveState(latest);
      showToast("Submission review saved.");
    });
  });
}

function renderMarksTable(state, subject) {
  const practical = PRACTICAL_SUBJECTS.includes(subject);
  const headers = `
    <tr>
      <th>Enrollment</th><th>Name</th><th>Internal 1</th><th>Internal 2</th><th>University Exam</th><th>MCQ</th>
      ${practical ? "<th>Viva</th><th>Practical</th>" : ""}
      <th>Total</th>
    </tr>`;
  const rows = state.students.map(student => {
    const key = `${student.enrollment}_${subject}`;
    const m = state.marks[key];
    return `<tr>
      <td>${student.enrollment}</td>
      <td>${student.name}</td>
      <td><input class="input mark-field" data-field="internal1" data-key="${key}" type="number" min="0" value="${m.internal1}" /></td>
      <td><input class="input mark-field" data-field="internal2" data-key="${key}" type="number" min="0" value="${m.internal2}" /></td>
      <td><input class="input mark-field" data-field="universityExam" data-key="${key}" type="number" min="0" value="${m.universityExam}" /></td>
      <td><input class="input mark-field" data-field="mcq" data-key="${key}" type="number" min="0" value="${m.mcq}" /></td>
      ${practical ? `<td><input class="input mark-field" data-field="viva" data-key="${key}" type="number" min="0" value="${m.viva}" /></td>
      <td><input class="input mark-field" data-field="practical" data-key="${key}" type="number" min="0" value="${m.practical}" /></td>` : ""}
      <td>${getTotalMarks(m)}</td>
    </tr>`;
  }).join("");
  qs("#marksTable").innerHTML = `<thead>${headers}</thead><tbody>${rows}</tbody>`;
}

function saveMarksData() {
  const state = getState();
  qsa(".mark-field").forEach(input => {
    state.marks[input.dataset.key][input.dataset.field] = Number(input.value || 0);
  });
  saveState(state);
  renderMarksTable(state, state.session.subject);
  showToast("Marks saved successfully.");
}

function exportAttendance() {
  const state = getState();
  const date = qs("#attendanceDate").value;
  const lecture = qs("#attendanceLecture").value;
  const rows = [["Enrollment", "Name", "Date", "Lecture", "Status"]];
  state.students.forEach(student => {
    const key = `${student.enrollment}_${date}_${lecture}`;
    rows.push([student.enrollment, student.name, date, lecture, state.attendance[key] || "Present"]);
  });
  exportCSV(`attendance_${date}_lecture${lecture}.csv`, rows);
}

function exportMarks() {
  const state = getState();
  const subject = state.session.subject;
  const practical = PRACTICAL_SUBJECTS.includes(subject);
  const rows = [["Enrollment", "Name", "Subject", "Internal1", "Internal2", "UniversityExam", "MCQ", "Viva", "Practical", "Total"]];
  state.students.forEach(student => {
    const key = `${student.enrollment}_${subject}`;
    const m = state.marks[key];
    rows.push([
      student.enrollment,
      student.name,
      SUBJECT_NAMES[subject],
      m.internal1,
      m.internal2,
      m.universityExam,
      m.mcq,
      practical ? m.viva : "",
      practical ? m.practical : "",
      getTotalMarks(m)
    ]);
  });
  exportCSV(`${subject}_marks.csv`, rows);
}

document.addEventListener("DOMContentLoaded", () => {
  const state = requireRole("teacher");
  if (!state) return;
  renderTopbarSession();
  bindTeacherTabs();
  const subject = state.session.subject;
  qs("#teacherSubjectLabel").textContent = SUBJECT_NAMES[subject];
  qs("#teacherTypeLabel").textContent = state.session.type;
  qs("#totalStudentsLabel").textContent = state.students.length;
  const today = new Date().toISOString().split("T")[0];
  qs("#attendanceDate").value = today;

  const rerenderAttendance = () => renderAttendanceTable(getState(), qs("#attendanceDate").value, qs("#attendanceLecture").value);
  rerenderAttendance();
  renderSubmissionTable(state, subject);
  renderMarksTable(state, subject);
  if (!PRACTICAL_SUBJECTS.includes(subject)) {
    qsa(".tab-btn")[1].classList.add("hidden");
    qs("#submissionPanel").classList.add("hidden");
  }

  qs("#attendanceDate").addEventListener("change", rerenderAttendance);
  qs("#attendanceLecture").addEventListener("change", rerenderAttendance);
  qs("#saveAttendanceBtn").addEventListener("click", saveAttendanceData);
  qs("#saveMarksBtn").addEventListener("click", saveMarksData);
  qs("#exportAttendanceBtn").addEventListener("click", exportAttendance);
  qs("#exportMarksBtn").addEventListener("click", exportMarks);
  renderChatInterface();
  qs("#logoutBtn").addEventListener("click", () => { logout(); window.location.href = "login.html"; });
});
