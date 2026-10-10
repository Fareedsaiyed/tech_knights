const APP_KEY = "ganpatCollegeCMS";
const PRACTICAL_SUBJECTS = ["awp","ldp","da"];
const ALL_SUBJECTS = ["awp","ldp","da","ews","sep","sad","ss"];
const SUBJECT_NAMES = {
  awp: "AWP",
  ldp: "LDP",
  da: "DA",
  ews: "EWS",
  sep: "SEP",
  sad: "SAD",
  ss: "SS"
};

function getDefaultStudents() {
  const list = [];
  for (let i = 11001; i <= 11214; i++) {
    list.push({
      enrollment: `250322${i}`,
      password: "ampics",
      name: `Student ${i}`,
      semester: "Sem 2",
      course: "BCA",
      division: "A"
    });
  }
  return list;
}

function createDefaultStudyContent() {
  const content = {};
  ALL_SUBJECTS.forEach(subject => {
    content[subject] = {};
    for (let unit = 1; unit <= 5; unit++) {
      content[subject][`unit${unit}`] = {
        notes: `${SUBJECT_NAMES[subject]} Unit ${unit} notes yahan add honge. Teacher is section ko edit kar sakta hai.`,
        imp: `Important questions / IMP points for ${SUBJECT_NAMES[subject]} Unit ${unit} yahan add honge.`,
        materials: []
      };
    }
  });
  return content;
}

function createDefaultState() {
  const students = getDefaultStudents();
  const teachers = ALL_SUBJECTS.map((subject) => ({
    subject,
    password: "ampics",
    type: PRACTICAL_SUBJECTS.includes(subject) ? "Practical Teacher" : "Theory Teacher"
  }));

  const state = {
    students,
    teachers,
    attendance: {},
    submissions: {},
    marks: {},
    session: null,
    studyContent: createDefaultStudyContent(),
    universityInfo: {
      name: "Ganpat University",
      shortAbout: "A futuristic college management prototype with ERP and Study Portal, built using HTML, CSS, and JavaScript.",
      details: [
        "Separate ERP interface for teachers and students.",
        "Attendance tracking with 6 lectures per day.",
        "Practical journal submission for AWP, LDP, and DA.",
        "Subject-wise marks management with CSV export."
      ]
    },
    admin: {
      id: "admin",
      password: "admin123"
    },
    communication: {
      threads: {}
    }
  };

  students.forEach((student, index) => {
    ALL_SUBJECTS.forEach((subject) => {
      const key = `${student.enrollment}_${subject}`;
      state.marks[key] = {
        internal1: Math.floor((index % 10) + 11),
        internal2: Math.floor((index % 9) + 12),
        universityExam: Math.floor((index % 20) + 40),
        mcq: Math.floor((index % 8) + 6),
        viva: PRACTICAL_SUBJECTS.includes(subject) ? Math.floor((index % 10) + 8) : null,
        practical: PRACTICAL_SUBJECTS.includes(subject) ? Math.floor((index % 18) + 22) : null
      };
    });

    ["awp", "ldp", "da"].forEach((subject) => {
      const subKey = `${student.enrollment}_${subject}`;
      state.submissions[subKey] = {
        code: "",
        output: "",
        status: "Not Submitted",
        remarks: ""
      };
    });
  });

  return state;
}

function getState() {
  const raw = localStorage.getItem(APP_KEY);
  if (!raw) {
    const defaultState = createDefaultState();
    localStorage.setItem(APP_KEY, JSON.stringify(defaultState));
    return defaultState;
  }
  const state = JSON.parse(raw);
  if (!state.studyContent) state.studyContent = createDefaultStudyContent();
  if (!state.admin) state.admin = { id: "admin", password: "admin123" };
  if (!state.communication) state.communication = { threads: {} };
  if (!state.communication.threads) state.communication.threads = {};
  return state;
}

function saveState(state) {
  localStorage.setItem(APP_KEY, JSON.stringify(state));
}

function resetState() {
  const state = createDefaultState();
  saveState(state);
  return state;
}

function loginTeacher(subject, password) {
  const state = getState();
  const teacher = state.teachers.find(t => t.subject === subject && t.password === password);
  if (!teacher) return { ok: false, message: "Invalid teacher login" };
  state.session = { role: "teacher", subject: teacher.subject, type: teacher.type };
  saveState(state);
  return { ok: true, user: state.session };
}

function loginStudent(enrollment, password) {
  const state = getState();
  const student = state.students.find(s => s.enrollment === enrollment && s.password === password);
  if (!student) return { ok: false, message: "Invalid student login" };
  state.session = { role: "student", enrollment: student.enrollment, name: student.name };
  saveState(state);
  return { ok: true, user: state.session };
}

function loginAdmin(id, password) {
  const state = getState();
  if (state.admin.id !== id || state.admin.password !== password) {
    return { ok: false, message: "Invalid admin login" };
  }
  state.session = { role: "admin", id: state.admin.id };
  saveState(state);
  return { ok: true, user: state.session };
}

function logout() {
  const state = getState();
  state.session = null;
  saveState(state);
}

function requireRole(role) {
  const state = getState();
  if (!state.session || state.session.role !== role) {
    window.location.href = "login.html";
    return null;
  }
  return state;
}

function exportCSV(filename, rows) {
  const csv = rows.map(row => row.map(v => {
    const value = String(v ?? "").replace(/"/g, '""');
    return `"${value}"`;
  }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function getStudentByEnrollment(enrollment) {
  return getState().students.find(s => s.enrollment === enrollment);
}

function getTeacherBySubject(subject) {
  return getState().teachers.find(t => t.subject === subject);
}

function calculateAttendancePercent(state, enrollment) {
  let total = 0;
  let present = 0;
  Object.entries(state.attendance).forEach(([key, value]) => {
    if (key.startsWith(`${enrollment}_`)) {
      total++;
      if (value === "Present") present++;
    }
  });
  return total ? ((present / total) * 100).toFixed(1) : "0.0";
}

function getTotalMarks(markObj) {
  const values = [markObj.internal1, markObj.internal2, markObj.universityExam, markObj.mcq, markObj.viva, markObj.practical]
    .filter(v => typeof v === "number");
  return values.reduce((a, b) => a + b, 0);
}

function getCurrentSession() {
  return getState().session;
}

function getTeacherSubjectSession() {
  const session = getCurrentSession();
  return session && session.role === "teacher" ? session.subject : null;
}

function requireLogin() {
  const state = getState();
  if (!state.session) {
    window.location.href = "login.html";
    return null;
  }
  return state;
}

function getThreadId(studentEnrollment, teacherSubject) {
  return `thread__${studentEnrollment}__${teacherSubject}`;
}

function ensureThread(state, studentEnrollment, teacherSubject) {
  const id = getThreadId(studentEnrollment, teacherSubject);
  if (!state.communication.threads[id]) state.communication.threads[id] = [];
  return state.communication.threads[id];
}

function addThreadEntry(payload) {
  const state = getState();
  const entries = ensureThread(state, payload.studentEnrollment, payload.teacherSubject);
  entries.push({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...payload
  });
  saveState(state);
  return state;
}
