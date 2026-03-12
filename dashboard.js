const navAuth = document.getElementById("nav-auth");
const sections = document.querySelectorAll(".dash-section");
const navButtons = document.querySelectorAll(".sidebar-nav button");
const title = document.getElementById("dashboard-title");
const subtitle = document.getElementById("dashboard-subtitle");

const historyList = document.getElementById("history-list");
const insightList = document.getElementById("insight-list");
const metricTotal = document.getElementById("metric-total");
const metricGrade = document.getElementById("metric-grade");
const metricWeakness = document.getElementById("metric-weakness");
const rubricResults = document.getElementById("rubric-results");
const gradePredictor = document.getElementById("grade-predictor");

const assistantChat = document.getElementById("assistant-chat");
const assistantForm = document.getElementById("assistant-form");
const assistantInput = document.getElementById("assistant-input");

const assessmentForm = document.getElementById("assessment-form");
const analysisStatus = document.getElementById("analysis-status");
const analysisResult = document.getElementById("analysis-result");

let lastContext = null;

function setActive(sectionId) {
  sections.forEach((section) => section.classList.remove("active"));
  navButtons.forEach((btn) => btn.classList.remove("active"));
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.add("active");
  navButtons.forEach((btn) => {
    if (btn.dataset.section === sectionId) btn.classList.add("active");
  });
  if (sectionId === "overview") {
    title.textContent = "Dashboard";
    subtitle.textContent = "Overview of your assignments and insights.";
  } else {
    title.textContent = btnLabel(sectionId);
    subtitle.textContent = "";
  }
}

function btnLabel(key) {
  const map = {
    new: "New Assessment",
    assessments: "My Assessments",
    insights: "Insights",
    grades: "Grade Predictor",
    rubric: "Rubric Analysis",
    assistant: "AI Study Assistant",
    templates: "Templates"
  };
  return map[key] || "Dashboard";
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => setActive(btn.dataset.section));
});

function renderHistory(items) {
  if (!historyList) return;
  if (!items || !items.length) {
    historyList.innerHTML = "<p class=\"empty\">No assessments yet.</p>";
    return;
  }
  historyList.innerHTML = items
    .map((item) => {
      const date = new Date(item.created_at).toLocaleString();
      const score = item.result?.estimated_grade || item.result?.estimated_grade_range || "-";
      const summary = item.result?.summary || "No summary.";
      return `
        <div class="history-card">
          <div>
            <strong>${date}</strong>
            <p>${summary}</p>
          </div>
          <span class="history-score">${score}</span>
        </div>
      `;
    })
    .join("");
}

function renderInsights(items) {
  if (!insightList) return;
  if (!items.length) {
    insightList.innerHTML = "<p class=\"empty\">Upload assessments to see insights.</p>";
    return;
  }
  insightList.innerHTML = items
    .map((item) => `<div class="history-card"><p>${item}</p></div>`)
    .join("");
}

function updateMetrics(history) {
  if (metricTotal) metricTotal.textContent = history.length;
  const grades = history
    .map((h) => h.result?.estimated_grade || h.result?.estimated_grade_range)
    .filter(Boolean)
    .map((g) => parseInt(String(g).match(/\d+/)?.[0] || "0", 10))
    .filter((n) => !Number.isNaN(n));
  if (metricGrade) {
    if (!grades.length) metricGrade.textContent = "-";
    else metricGrade.textContent = `${Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)}%`;
  }
  const weakMap = new Map();
  history.forEach((h) => {
    const coverage = h.result?.question_coverage || [];
    coverage.forEach((c) => {
      if (String(c.status || "").toLowerCase().includes("weak") || String(c.status || "").toLowerCase().includes("missing")) {
        weakMap.set(c.component, (weakMap.get(c.component) || 0) + 1);
      }
    });
  });
  if (metricWeakness) {
    const items = [...weakMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    metricWeakness.innerHTML = items.length
      ? items.map(([k, v]) => `<li>${k} (${v})</li>`).join("")
      : "<li>No data yet</li>";
  }
}

function renderRubric(result) {
  if (!rubricResults) return;
  const scores = result?.rubric_scores || [];
  if (!scores.length) {
    rubricResults.innerHTML = "<p class=\"empty\">Upload a rubric to see scores.</p>";
    return;
  }
  rubricResults.innerHTML = scores
    .map((s) => `<div class="history-card"><p><strong>${s.criterion}</strong>: ${s.score}</p></div>`)
    .join("");
}

function renderReport(result) {
  if (!analysisResult) return;
  if (!result) {
    analysisResult.innerHTML = "";
    return;
  }
  const grade = result.estimated_grade_range || result.estimated_grade || "62–68%";
  const gradeScore = Number(String(grade).match(/\d+/)?.[0] || "65");
  const gradeClass = gradeScore >= 70 ? "good" : gradeScore >= 60 ? "mid" : "low";

  const coverage = (result.question_coverage || [
    { component: "Definition of key concepts", status: "Covered" },
    { component: "Explanation of theory", status: "Covered" },
    { component: "Critical evaluation", status: "Weak" },
    { component: "Real-world examples", status: "Missing" }
  ]).map((c) => {
    const status = String(c.status || "").toLowerCase();
    const icon = status.includes("missing") ? "❌" : status.includes("weak") ? "⚠" : "✔";
    return `<li><span class="icon">${icon}</span>${c.component}</li>`;
  });

  const metrics = [
    { label: "Critical Analysis", value: 60 },
    { label: "Evidence Quality", value: 70 },
    { label: "Structure & Flow", value: 80 },
    { label: "Clarity", value: 75 }
  ];

  const weakParagraphs = (result.weak_paragraphs || [
    "Paragraph 3 – Problem: lacks critical evaluation. Suggestion: compare two theories rather than describing one.",
    "Paragraph 5 – Problem: minimal evidence. Suggestion: add peer‑reviewed sources."
  ]).slice(0, 3).map((p) => {
    const parts = String(p).split("Suggestion:");
    const desc = parts[0] || p;
    const sug = parts[1] ? `Suggestion: ${parts[1].trim()}` : "";
    return `
      <div class="para-card">
        <p class="para-text">${desc}</p>
        ${sug ? `<p class="para-suggestion">${sug}</p>` : ""}
      </div>
    `;
  }).join("");

  const suggestions = (result.improvement_suggestions || [
    "Add comparison between academic authors",
    "Include more peer‑reviewed sources",
    "Strengthen the conclusion"
  ]).map((s) => `<li>• ${s}</li>`).join("");

  analysisResult.innerHTML = `
    <div class="report-grid">
      <div class="report-card grade-card ${gradeClass}">
        <div>
          <h3>Predicted Grade Range</h3>
          <p class="grade">${grade}</p>
          <p class="grade-note">Based on coverage, evidence quality, and argument strength.</p>
        </div>
        <div class="grade-indicator"></div>
      </div>

      <div class="report-card">
        <h3>Question Coverage Analysis</h3>
        <ul class="coverage-list">${coverage.join("")}</ul>
      </div>

      <div class="report-card">
        <h3>Argument Strength Metrics</h3>
        <div class="metric-list">
          ${metrics.map((m) => `
            <div class="metric-row">
              <span>${m.label}</span>
              <div class="metric-bar"><span style="width:${m.value}%"></span></div>
              <span class="metric-value">${m.value}%</span>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="report-card">
        <h3>Weak Paragraph Detection</h3>
        <div class="para-grid">${weakParagraphs}</div>
      </div>

      <div class="report-card">
        <h3>AI Suggestions</h3>
        <ul class="suggestion-list">${suggestions}</ul>
      </div>
    </div>
  `;
}

async function loadHistory() {
  const res = await fetch("/assess/history");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return data.history || [];
}

async function refreshDashboard() {
  const history = await loadHistory();
  renderHistory(history);
  updateMetrics(history);
  const insights = [];
  history.forEach((h) => {
    (h.result?.weak_paragraphs || []).forEach((w) => insights.push(w));
  });
  renderInsights(insights.slice(0, 6));
  if (history.length && gradePredictor) {
    const last = history[0].result?.estimated_grade_range || history[0].result?.estimated_grade;
    gradePredictor.textContent = last ? `Latest estimated grade: ${last}` : "Upload an assignment to see estimated grades.";
  }
}

async function refreshAuth() {
  const res = await fetch("/me");
  const data = await res.json().catch(() => ({}));
  if (!data.user) {
    navAuth.innerHTML = `<a class="btn ghost" href="./login.html">Log in</a>`;
    return;
  }
  navAuth.innerHTML = `
    <a class="btn ghost" href="/account.html">Account</a>
    <button id="dash-logout" class="btn ghost" type="button">Log out</button>
  `;
  const logoutBtn = document.getElementById("dash-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/auth/logout", { method: "POST" });
      window.location.href = "./landing.html";
    });
  }
}

assessmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  analysisStatus.textContent = "Analyzing...";
  analysisResult.innerHTML = "";

  const formData = new FormData();
  const qFile = document.getElementById("question-file").files[0];
  const aFile = document.getElementById("answer-file").files[0];
  const rFile = document.getElementById("rubric-file").files[0];
  const qText = document.getElementById("question-text").value.trim();
  const aText = document.getElementById("answer-text").value.trim();
  const rText = document.getElementById("rubric-text").value.trim();

  if (qFile) formData.append("question_file", qFile);
  if (aFile) formData.append("answer_file", aFile);
  if (rFile) formData.append("rubric_file", rFile);
  if (qText) formData.append("question_text", qText);
  if (aText) formData.append("answer_text", aText);
  if (rText) formData.append("rubric_text", rText);

  const res = await fetch("/assess", { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    analysisStatus.textContent = data.error || "Analysis failed.";
    return;
  }
  analysisStatus.textContent = "Analysis complete.";
  renderReport(data);
  renderRubric(data);
  lastContext = { question: qText, answer: aText, rubric: rText };
  await refreshDashboard();
  setActive("assessments");
});

assistantForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = assistantInput.value.trim();
  if (!message) return;
  assistantInput.value = "";
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.textContent = message;
  assistantChat.appendChild(userMsg);

  const res = await fetch("/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: message, context: lastContext })
  });
  const data = await res.json().catch(() => ({}));
  const botMsg = document.createElement("div");
  botMsg.className = "msg bot";
  botMsg.textContent = data.answer || "No response.";
  assistantChat.appendChild(botMsg);
  assistantChat.scrollTop = assistantChat.scrollHeight;
});

refreshAuth();
refreshDashboard();
setActive("overview");
