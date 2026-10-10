const CHAT_NOTICE_TEMPLATES = {
  lowAttendance: ({ studentName, teacherLabel, subjectName }) => ({
    title: "Low Attendance Notice",
    subjectLine: `Notice regarding low attendance in ${subjectName}`,
    body: `Dear ${studentName},\n\nYour attendance in ${subjectName} is below the required percentage. You are instructed to attend all upcoming lectures regularly and meet ${teacherLabel} immediately for guidance. Continued shortage may lead to academic action as per university rules.\n\nPlease treat this matter as urgent.\n\nRegards,\n${teacherLabel}`
  }),
  failSubject: ({ studentName, teacherLabel, subjectName }) => ({
    title: "Fail in Subject Notice",
    subjectLine: `Academic notice for ${subjectName}`,
    body: `Dear ${studentName},\n\nThis is to inform you that your performance in ${subjectName} is unsatisfactory / at risk of failure. You should complete pending work, revise the syllabus, and contact ${teacherLabel} for improvement guidance at the earliest.\n\nPlease take corrective action immediately.\n\nRegards,\n${teacherLabel}`
  }),
  assignmentReminder: ({ studentName, teacherLabel, subjectName }) => ({
    title: "Assignment / Journal Reminder",
    subjectLine: `Pending assignment / journal for ${subjectName}`,
    body: `Dear ${studentName},\n\nYou have pending assignment / journal work in ${subjectName}. Submit the required work on time and ensure that all records are completed. Contact ${teacherLabel} if you need clarification.\n\nRegards,\n${teacherLabel}`
  }),
  general: ({ studentName, teacherLabel }) => ({
    title: "General Academic Notice",
    subjectLine: "General academic communication",
    body: `Dear ${studentName},\n\nThis is an important academic communication from ${teacherLabel}. Please read the message carefully and respond / comply wherever required.\n\nRegards,\n${teacherLabel}`
  })
};

function getActiveChatPartner(state) {
  const session = state.session;
  if (session.role === "student") {
    return qs("#chatTeacherSelect")?.value || ALL_SUBJECTS[0];
  }
  return qs("#chatStudentSelect")?.value || state.students[0]?.enrollment || "";
}

function getStudentDraftTemplate() {
  const state = getState();
  const session = state.session;
  const student = getStudentByEnrollment(session.enrollment);
  const teacherSubject = getActiveChatPartner(state);
  const teacherLabel = `${SUBJECT_NAMES[teacherSubject]} Teacher`;
  const title = qs("#appTitle")?.value?.trim() || "Leave Application";
  const subjectLine = qs("#appSubject")?.value?.trim() || "Application for Leave";
  const reason = qs("#appReason")?.value?.trim() || "medical / personal reason";
  const days = qs("#appDays")?.value?.trim() || "1 day";
  const body = `Respected Sir/Madam,\n\nI am ${student.name} (${student.enrollment}). I request leave for ${days} due to ${reason}. Kindly grant me leave for the above period. I will complete the missed academic work after returning.\n\nThank you.`;
  return {
    typeLabel: "Leave Application",
    title,
    subjectLine,
    toLine: `${teacherLabel}`,
    fromLine: `${student.name} (${student.enrollment})`,
    body,
    signature: student.name
  };
}

function getTeacherDraftTemplate(forceTemplate = false) {
  const state = getState();
  const session = state.session;
  const student = getStudentByEnrollment(getActiveChatPartner(state));
  const templateKey = qs("#teacherNoticeType")?.value || "general";
  const teacherLabel = `${SUBJECT_NAMES[session.subject]} Teacher`;
  const subjectName = SUBJECT_NAMES[session.subject];
  const template = CHAT_NOTICE_TEMPLATES[templateKey]({ studentName: student.name, teacherLabel, subjectName });

  const title = forceTemplate ? template.title : (qs("#appTitle")?.value?.trim() || template.title);
  const subjectLine = forceTemplate ? template.subjectLine : (qs("#appSubject")?.value?.trim() || template.subjectLine);
  const body = forceTemplate ? template.body : (qs("#appBody")?.value?.trim() || template.body);

  return {
    typeLabel: "Notice / Application",
    title,
    subjectLine,
    toLine: `${student.name} (${student.enrollment})`,
    fromLine: `${teacherLabel}`,
    body,
    signature: teacherLabel
  };
}

function composePaperHtml(draft) {
  return `
    <div class="a4-paper full-doc-card">
      <div class="a4-paper-header">
        <div class="doc-mini-head">Ganpat University</div>
        <h3>${escapeHtml(draft.title)}</h3>
        <div class="doc-mini-sub">Official ${escapeHtml(draft.typeLabel || "Document")}</div>
      </div>
      <div class="a4-paper-body">
        <div class="doc-meta-row"><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
        <div class="doc-meta-row"><strong>To:</strong> ${escapeHtml(draft.toLine || "")}</div>
        <div class="doc-meta-row"><strong>From:</strong> ${escapeHtml(draft.fromLine || "")}</div>
        <div class="doc-meta-row"><strong>Subject:</strong> ${escapeHtml(draft.subjectLine || "")}</div>
        <div class="a4-text">${escapeHtml(draft.body || "").replace(/\n/g, "<br>")}</div>
        <div class="doc-signoff">
          <div>Yours faithfully,</div>
          <div><strong>${escapeHtml(draft.signature || "")}</strong></div>
        </div>
      </div>
    </div>`;
}

function renderDocumentEntry(entry) {
  const doc = entry.document || {
    typeLabel: entry.documentType || "Document",
    title: entry.title,
    subjectLine: entry.subjectLine,
    toLine: entry.toLine || "",
    fromLine: entry.fromLine || entry.senderName || entry.senderId,
    body: entry.body,
    signature: entry.signature || entry.senderName || entry.senderId
  };
  return composePaperHtml(doc);
}

function renderChatInterface() {
  const state = getState();
  const session = state.session;
  const isStudent = session.role === "student";
  const recipientOptions = isStudent
    ? state.teachers.map(t => `<option value="${t.subject}">${SUBJECT_NAMES[t.subject]} Teacher</option>`).join("")
    : state.students.map(s => `<option value="${s.enrollment}">${s.name} (${s.enrollment})</option>`).join("");

  const chatPanel = qs("#chatPanel");
  if (!chatPanel) return;
  chatPanel.innerHTML = `
    <div class="chat-shell">
      <div class="chat-column glass-soft">
        <div class="section-title">
          <h2>${isStudent ? "Teacher Chat" : "Student Chat"}</h2>
          <span class="small">Messages + applications / notices</span>
        </div>
        <div class="form-grid compact-grid">
          <div>
            <label>${isStudent ? "Select Teacher" : "Select Student"}</label>
            <select class="select" id="${isStudent ? "chatTeacherSelect" : "chatStudentSelect"}">${recipientOptions}</select>
          </div>
        </div>
        <div class="chat-thread glass-soft" id="chatThread"></div>
        <div class="chat-send-box">
          <label>Message</label>
          <textarea class="textarea chat-textarea" id="chatMessageBox" placeholder="Type your message here..."></textarea>
          <button class="btn btn-primary" id="sendChatMessageBtn" type="button">Send Message</button>
        </div>
      </div>

      <div class="application-column glass-soft">
        <div class="section-title app-title-wrap">
          <h2><span class="app-icon">📄</span> ${isStudent ? "Leave Application" : "Notices / Applications"}</h2>
          <span class="small">Full A4 page preview</span>
        </div>

        ${isStudent ? `
          <div class="form-grid compact-grid">
            <div><label>Application Title</label><input class="input" id="appTitle" type="text" value="Leave Application" /></div>
            <div><label>Subject</label><input class="input" id="appSubject" type="text" value="Application for Leave" /></div>
            <div><label>Reason</label><input class="input" id="appReason" type="text" value="medical / personal reason" /></div>
            <div><label>No. of Days</label><input class="input" id="appDays" type="text" value="1 day" /></div>
          </div>
          <div style="margin-top:14px">
            <label>Editable Body</label>
            <textarea class="textarea" id="appBody"></textarea>
          </div>
          <div class="a4-preview" id="applicationPreview"></div>
          <button class="btn btn-primary" id="sendApplicationBtn" type="button">Send Full Application Page</button>
        ` : `
          <div class="form-grid compact-grid">
            <div>
              <label>Format</label>
              <select class="select" id="teacherNoticeType">
                <option value="lowAttendance">Low Attendance Notice</option>
                <option value="failSubject">Fail in Subject Notice</option>
                <option value="assignmentReminder">Assignment / Journal Reminder</option>
                <option value="general">General Notice</option>
              </select>
            </div>
            <div><label>Title</label><input class="input" id="appTitle" type="text" /></div>
            <div><label>Subject Line</label><input class="input" id="appSubject" type="text" /></div>
          </div>
          <div style="margin-top:14px">
            <label>Editable Body</label>
            <textarea class="textarea" id="appBody"></textarea>
          </div>
          <div class="a4-preview" id="applicationPreview"></div>
          <button class="btn btn-primary" id="sendApplicationBtn" type="button">Send Full Notice Page</button>
        `}
      </div>
    </div>`;

  const select = qs(isStudent ? "#chatTeacherSelect" : "#chatStudentSelect");
  select?.addEventListener("change", () => {
    renderChatThread();
    renderApplicationComposer(true);
  });

  qs("#sendChatMessageBtn")?.addEventListener("click", sendChatMessage);
  qs("#sendApplicationBtn")?.addEventListener("click", sendApplicationDocument);
  qs("#teacherNoticeType")?.addEventListener("change", () => renderApplicationComposer(true));

  ["#appTitle", "#appSubject", "#appReason", "#appDays"].forEach(id => {
    qs(id)?.addEventListener("input", () => renderApplicationComposer(true));
  });
  qs("#appBody")?.addEventListener("input", () => { const b = qs("#appBody"); if (b) b.dataset.manualEdit = '1'; renderApplicationPreview(); });

  renderApplicationComposer(true);
  renderChatThread();
}

function renderChatThread() {
  const state = getState();
  const session = state.session;
  const studentEnrollment = session.role === "student" ? session.enrollment : getActiveChatPartner(state);
  const teacherSubject = session.role === "teacher" ? session.subject : getActiveChatPartner(state);
  const thread = ensureThread(state, studentEnrollment, teacherSubject);
  const target = qs("#chatThread");
  if (!target) return;

  if (!thread.length) {
    target.innerHTML = `<div class="empty-thread">No messages or applications yet. Start the conversation from here.</div>`;
    return;
  }

  target.innerHTML = thread.map(entry => {
    const mine = (session.role === entry.senderRole) && ((session.role === "student" && entry.senderId === session.enrollment) || (session.role === "teacher" && entry.senderId === session.subject));
    const who = entry.senderRole === "teacher" ? `${SUBJECT_NAMES[entry.senderId]} Teacher` : `${entry.senderName || entry.senderId}`;
    if (entry.entryType === "document") {
      return `<article class="thread-item ${mine ? "mine" : "theirs"}">
        <div class="thread-meta">${who} • ${formatDateTime(entry.timestamp)}</div>
        <div class="thread-doc-card thread-fullpage-wrap">${renderDocumentEntry(entry)}</div>
      </article>`;
    }
    return `<article class="thread-item ${mine ? "mine" : "theirs"}">
      <div class="thread-meta">${who} • ${formatDateTime(entry.timestamp)}</div>
      <div class="thread-bubble">${escapeHtml(entry.body).replace(/\n/g, "<br>")}</div>
    </article>`;
  }).join("");
  target.scrollTop = target.scrollHeight;
}

function sendChatMessage() {
  const state = getState();
  const session = state.session;
  const box = qs("#chatMessageBox");
  const body = box.value.trim();
  if (!body) return showToast("Message type karo.");

  const payload = session.role === "student"
    ? {
        studentEnrollment: session.enrollment,
        teacherSubject: getActiveChatPartner(state),
        senderRole: "student",
        senderId: session.enrollment,
        senderName: session.name,
        entryType: "message",
        body
      }
    : {
        studentEnrollment: getActiveChatPartner(state),
        teacherSubject: session.subject,
        senderRole: "teacher",
        senderId: session.subject,
        senderName: `${SUBJECT_NAMES[session.subject]} Teacher`,
        entryType: "message",
        body
      };

  addThreadEntry(payload);
  box.value = "";
  renderChatThread();
  showToast("Message sent.");
}

function buildStudentApplicationBody() {
  const manualBody = qs("#appBody")?.value?.trim();
  const draft = getStudentDraftTemplate();
  if (manualBody) draft.body = manualBody;
  return draft;
}

function buildTeacherNoticeBody(forceTemplate = false) {
  return getTeacherDraftTemplate(forceTemplate);
}

function renderApplicationComposer(resetBody = false) {
  const session = getState().session;
  if (session.role === "student") {
    const draft = getStudentDraftTemplate();
    if (resetBody || !qs("#appBody")?.value?.trim()) qs("#appBody").value = draft.body;
  } else {
    const draft = getTeacherDraftTemplate(true);
    qs("#appTitle").value = draft.title;
    qs("#appSubject").value = draft.subjectLine;
    if (resetBody || !qs("#appBody")?.dataset?.manualEdit) qs("#appBody").value = draft.body;
  }
  renderApplicationPreview();
}

function renderApplicationPreview() {
  const state = getState();
  const session = state.session;
  const preview = qs("#applicationPreview");
  if (!preview) return;
  const draft = session.role === "student" ? buildStudentApplicationBody() : buildTeacherNoticeBody(false);
  preview.innerHTML = composePaperHtml(draft);
}

function sendApplicationDocument() {
  const state = getState();
  const session = state.session;
  const draft = session.role === "student" ? buildStudentApplicationBody() : buildTeacherNoticeBody(false);
  const payload = session.role === "student"
    ? {
        studentEnrollment: session.enrollment,
        teacherSubject: getActiveChatPartner(state),
        senderRole: "student",
        senderId: session.enrollment,
        senderName: session.name,
        entryType: "document",
        title: draft.title,
        subjectLine: draft.subjectLine,
        body: draft.body,
        documentType: draft.typeLabel,
        toLine: draft.toLine,
        fromLine: draft.fromLine,
        signature: draft.signature,
        document: draft
      }
    : {
        studentEnrollment: getActiveChatPartner(state),
        teacherSubject: session.subject,
        senderRole: "teacher",
        senderId: session.subject,
        senderName: `${SUBJECT_NAMES[session.subject]} Teacher`,
        entryType: "document",
        title: draft.title,
        subjectLine: draft.subjectLine,
        body: draft.body,
        documentType: draft.typeLabel,
        toLine: draft.toLine,
        fromLine: draft.fromLine,
        signature: draft.signature,
        document: draft
      };

  addThreadEntry(payload);
  renderChatThread();
  showToast(session.role === "student" ? "Full application page sent to teacher." : "Full notice page sent to student.");
}
