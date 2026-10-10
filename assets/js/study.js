function getStudyRoleView(state) {
  const session = state.session;
  if (!session) return { role: "guest", canEdit: false, subject: null };
  if (session.role === "teacher") return { role: "teacher", canEdit: true, subject: session.subject };
  if (session.role === "student") return { role: "student", canEdit: false, subject: null };
  return { role: "guest", canEdit: false, subject: null };
}

function unitKey(unitNumber) {
  return `unit${unitNumber}`;
}

function getVisibleSubjects(state) {
  const roleView = getStudyRoleView(state);
  if (roleView.role === "teacher") return [roleView.subject];
  return ALL_SUBJECTS;
}

function renderSubjectCards(state, activeSubject) {
  const wrap = qs("#studySubjectGrid");
  const visibleSubjects = getVisibleSubjects(state);

  if (!visibleSubjects.includes(activeSubject)) {
    studyView.subject = visibleSubjects[0] || "awp";
    activeSubject = studyView.subject;
  }

  wrap.innerHTML = visibleSubjects.map(subject => `
    <button class="subject-card glass ${subject === activeSubject ? "active" : ""}" data-subject="${subject}" type="button">
      <span class="subject-card-title">${SUBJECT_NAMES[subject]}</span>
      <span class="small">${PRACTICAL_SUBJECTS.includes(subject) ? "Practical Subject" : "Theory Subject"}</span>
      <span class="small">Click to open 5 units</span>
    </button>
  `).join("");

  qsa(".subject-card", wrap).forEach(btn => {
    btn.addEventListener("click", () => {
      studyView.subject = btn.dataset.subject;
      studyView.unit = 1;
      studyView.section = "notes";
      renderStudyPage();
    });
  });
}

function renderUnitButtons(activeUnit) {
  const wrap = qs("#studyUnitGrid");
  wrap.innerHTML = Array.from({ length: 5 }, (_, i) => i + 1).map(unit => `
    <button class="unit-card glass ${unit === activeUnit ? "active" : ""}" data-unit="${unit}" type="button">
      <span class="unit-no">Unit ${unit}</span>
      <span class="small">Select unit</span>
    </button>
  `).join("");

  qsa(".unit-card", wrap).forEach(btn => {
    btn.addEventListener("click", () => {
      studyView.unit = Number(btn.dataset.unit);
      studyView.section = "notes";
      renderStudyPage();
    });
  });
}

function renderSectionCards(activeSection) {
  const wrap = qs("#studySectionGrid");
  const labels = { notes: "Notes", imp: "IMP", materials: "Material" };
  wrap.innerHTML = Object.entries(labels).map(([key, label]) => `
    <button class="section-card glass ${key === activeSection ? "active" : ""}" data-section="${key}" type="button">
      <span>${label}</span>
      <span class="small">${key === "materials" ? "Open / upload PDFs" : "Open section"}</span>
    </button>
  `).join("");

  qsa(".section-card", wrap).forEach(btn => {
    btn.addEventListener("click", () => {
      studyView.section = btn.dataset.section;
      renderStudyPage();
    });
  });
}

function renderContentPanel(state) {
  const unitData = state.studyContent[studyView.subject][unitKey(studyView.unit)];
  const currentValue = unitData[studyView.section];
  const roleView = getStudyRoleView(state);
  const canEditCurrentSubject = roleView.canEdit && roleView.subject === studyView.subject;

  qs("#studyBreadcrumb").textContent = `${SUBJECT_NAMES[studyView.subject]} / Unit ${studyView.unit} / ${studyView.section === "imp" ? "IMP" : studyView.section === "materials" ? "Material" : "Notes"}`;
  qs("#studyEditorBadge").textContent = canEditCurrentSubject ? "Teacher Upload Mode" : "Student View Mode";

  const contentWrap = qs("#studyContentArea");
  const editorWrap = qs("#studyEditorArea");

  if (studyView.section !== "materials") {
    contentWrap.innerHTML = `
      <div class="content-reader glass-soft">
        <div class="section-title"><h3>${studyView.section === "imp" ? "Important Questions / IMP" : "Unit Notes"}</h3></div>
        <div class="content-display">${escapeHtml(currentValue || "No content added yet.").replace(/\n/g, "<br>")}</div>
      </div>`;

    editorWrap.innerHTML = canEditCurrentSubject ? `
      <div class="editor-card glass-soft">
        <label>${studyView.section === "imp" ? "Upload / Edit IMP" : "Upload / Edit Notes"}</label>
        <textarea id="studyTextEditor" class="textarea editor-textarea" placeholder="Type content here..."></textarea>
        <button class="btn btn-primary" id="saveStudyTextBtn" type="button">Save ${studyView.section === "imp" ? "IMP" : "Notes"}</button>
      </div>` : `
      <div class="editor-card glass-soft readonly-box">
        <h4>View Only</h4>
        <p class="small">Student ya dusra teacher yahan edit nahi kar sakta. Sirf subject teacher hi notes aur IMP upload/edit kar sakta hai.</p>
      </div>`;

    const textarea = qs("#studyTextEditor");
    if (textarea) textarea.value = currentValue || "";
    const saveBtn = qs("#saveStudyTextBtn");
    if (saveBtn) saveBtn.addEventListener("click", () => saveStudyText(studyView.subject, studyView.unit, studyView.section));
    return;
  }

  const materials = Array.isArray(currentValue) ? currentValue : [];
  contentWrap.innerHTML = `
    <div class="content-reader glass-soft">
      <div class="section-title"><h3>PDF Materials</h3></div>
      <div class="material-list ${materials.length ? "" : "empty-materials"}">
        ${materials.length ? materials.map((item, index) => `
          <div class="material-card glass-soft">
            <div>
              <strong>${escapeHtml(item.title || `PDF ${index + 1}`)}</strong>
              <div class="small">${escapeHtml(item.filename || "Uploaded PDF")}</div>
            </div>
            <div class="material-actions">
              <a class="btn btn-secondary" href="${item.dataUrl || '#'}" target="_blank">Open PDF</a>
              ${canEditCurrentSubject ? `<button class="btn btn-danger remove-material-btn" data-index="${index}" type="button">Remove</button>` : ""}
            </div>
          </div>`).join("") : `
          <div class="empty-material-box">
            <p>No PDF added yet.</p>
            <p class="small">Teacher apne subject ke unit me PDF upload karega. Student sirf Open PDF se view karega.</p>
          </div>`}
      </div>
    </div>`;

  editorWrap.innerHTML = canEditCurrentSubject ? `
    <div class="editor-card glass-soft">
      <h4>Upload PDF Material</h4>
      <div class="form-grid compact-grid">
        <div>
          <label>PDF Title</label>
          <input id="materialTitle" class="input" type="text" placeholder="Example: Unit ${studyView.unit} Material PDF" />
        </div>
        <div>
          <label>Select PDF File</label>
          <input id="materialFile" class="input" type="file" accept="application/pdf" />
        </div>
      </div>
      <div class="notice upload-note">Ye upload website me se hoga. PDF open karne ke liye Material section me Open PDF button dikhega.</div>
      <button class="btn btn-primary" id="addMaterialBtn" type="button">Upload PDF</button>
    </div>` : `
    <div class="editor-card glass-soft readonly-box">
      <h4>View Only</h4>
      <p class="small">Student sirf material dekh sakta hai. Upload sirf subject teacher karega.</p>
    </div>`;

  const addBtn = qs("#addMaterialBtn");
  if (addBtn) addBtn.addEventListener("click", () => addMaterialFile(studyView.subject, studyView.unit));
  qsa(".remove-material-btn").forEach(btn => btn.addEventListener("click", () => removeMaterialLink(studyView.subject, studyView.unit, Number(btn.dataset.index))));
}

function saveStudyText(subject, unit, section) {
  const state = getState();
  const session = state.session;
  if (!session || session.role !== "teacher" || session.subject !== subject) {
    showToast("Sirf is subject ka teacher hi edit kar sakta hai.");
    return;
  }
  state.studyContent[subject][unitKey(unit)][section] = qs("#studyTextEditor").value.trim();
  saveState(state);
  showToast(`${section === "imp" ? "IMP" : "Notes"} saved successfully.`);
  renderStudyPage();
}

function addMaterialFile(subject, unit) {
  const state = getState();
  const session = state.session;
  if (!session || session.role !== "teacher" || session.subject !== subject) {
    showToast("Sirf is subject ka teacher hi PDF upload kar sakta hai.");
    return;
  }

  const title = qs("#materialTitle").value.trim();
  const fileInput = qs("#materialFile");
  const file = fileInput.files[0];

  if (!title || !file) {
    showToast("PDF title aur file dono select karo.");
    return;
  }
  if (file.type !== "application/pdf") {
    showToast("Sirf PDF file upload karo.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const latest = getState();
    latest.studyContent[subject][unitKey(unit)].materials.push({
      title,
      filename: file.name,
      type: file.type,
      dataUrl: reader.result
    });
    saveState(latest);
    showToast("PDF uploaded successfully.");
    renderStudyPage();
  };
  reader.onerror = () => showToast("PDF upload failed.");
  reader.readAsDataURL(file);
}

function removeMaterialLink(subject, unit, index) {
  const state = getState();
  const session = state.session;
  if (!session || session.role !== "teacher" || session.subject !== subject) {
    showToast("Sirf is subject ka teacher hi remove kar sakta hai.");
    return;
  }
  state.studyContent[subject][unitKey(unit)].materials.splice(index, 1);
  saveState(state);
  showToast("PDF material removed.");
  renderStudyPage();
}

function renderStudyLoginNote(state) {
  const roleView = getStudyRoleView(state);
  let text = "Protected study portal.";
  if (roleView.role === "teacher") {
    text = `You are logged in as ${SUBJECT_NAMES[roleView.subject]} teacher. Aap sirf apne subject ke 5 units me Notes, IMP aur Material upload kar sakte ho.`;
  } else if (roleView.role === "student") {
    text = "You are logged in as student. Aap subject, unit, notes, IMP aur PDF material dekh sakte ho, lekin upload ya edit nahi kar sakte.";
  }
  qs("#studyRoleNote").textContent = text;
}

function renderStudyPage() {
  const state = requireLogin();
  if (!state) return;

  const visibleSubjects = getVisibleSubjects(state);
  if (!visibleSubjects.includes(studyView.subject)) {
    studyView.subject = visibleSubjects[0] || "awp";
  }

  renderTopbarSession();
  renderStudyLoginNote(state);
  renderSubjectCards(state, studyView.subject);
  renderUnitButtons(studyView.unit);
  renderSectionCards(studyView.section);
  renderContentPanel(state);
}

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const studyView = { subject: "awp", unit: 1, section: "notes" };

document.addEventListener("DOMContentLoaded", () => {
  const state = requireLogin();
  if (!state) return;
  renderStudyPage();
  qs("#studyGoLoginBtn").addEventListener("click", () => {
    window.location.href = state.session.role === "teacher" ? "teacher.html" : "student.html";
  });
});
