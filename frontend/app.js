/* AI Test Case Generator - frontend logic (vanilla JS, Fetch API).
 *
 * Flow: validate input -> POST to backend -> validate response shape ->
 *       render table -> allow export of the currently displayed results.
 *
 * The LLM key lives only in the backend. Nothing secret is in this file.
 */

"use strict";

// ---------- Config (agreed API contract: do not change) ----------
const API_URL = "http://127.0.0.1:8000/api/generate-test-cases";
const REQUEST_TIMEOUT_MS = 90000; // LLM calls can be slow
const MIN_LENGTH = 10;
const MAX_LENGTH = 3000;

// ---------- DOM references ----------
const $ = (id) => document.getElementById(id);

const form = $("requirement-form");
const requirementInput = $("requirement");
const requirementError = $("requirement-error");
const charCount = $("char-count");
const generateBtn = $("generate-btn");
const btnLabel = generateBtn.querySelector(".btn-label");
const clearBtn = $("clear-btn");
const statusBox = $("status");
const errorBanner = $("error-banner");
const errorTitle = $("error-title");
const errorMessage = $("error-message");
const summary = $("summary");
const emptyState = $("empty-state");
const tableWrap = $("table-wrap");
const resultsBody = $("results-body");
const exportCsvBtn = $("export-csv");
const exportJsonBtn = $("export-json");

// The single source of truth for what is on screen (and what gets exported).
let currentTestCases = [];
let activeController = null;

// ---------- Custom error type for friendly messages ----------
class AppError extends Error {
  constructor(title, message) {
    super(message);
    this.title = title;
  }
}

// ---------- Input handling ----------
function updateCharCount() {
  charCount.textContent = `${requirementInput.value.length} / ${MAX_LENGTH}`;
}

function showFieldError(message) {
  requirementError.textContent = message;
  requirementError.hidden = false;
  requirementInput.classList.add("invalid");
  requirementInput.setAttribute("aria-invalid", "true");
}

function clearFieldError() {
  requirementError.hidden = true;
  requirementError.textContent = "";
  requirementInput.classList.remove("invalid");
  requirementInput.removeAttribute("aria-invalid");
}

/** Returns an error message string, or null if the input is valid. */
function validateRequirement(text) {
  if (!text) return "Enter a software requirement before generating test cases.";
  if (text.length < MIN_LENGTH) {
    return `The requirement is too short. Write at least ${MIN_LENGTH} characters so the AI has enough detail.`;
  }
  if (text.length > MAX_LENGTH) {
    return `The requirement is too long. Keep it under ${MAX_LENGTH} characters.`;
  }
  if (!/[a-zA-Z]{3,}/.test(text)) {
    return "The requirement should be written in plain English words.";
  }
  return null;
}

// ---------- UI state helpers ----------
function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  generateBtn.classList.toggle("is-loading", isLoading);
  generateBtn.setAttribute("aria-busy", String(isLoading));
  btnLabel.textContent = isLoading ? "Generating..." : "Generate test cases";
  statusBox.hidden = !isLoading;
  if (isLoading) {
    statusBox.textContent =
      "Generating test cases. This can take 10 to 30 seconds.";
  }
}

function showError(title, message) {
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  errorBanner.hidden = false;
}

function hideError() {
  errorBanner.hidden = true;
  errorTitle.textContent = "";
  errorMessage.textContent = "";
}

// ---------- API call ----------
async function requestTestCases(requirement) {
  // Cancel any request still in flight.
  if (activeController) activeController.abort();
  const controller = new AbortController();
  activeController = controller;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      if (timedOut) {
        throw new AppError(
          "The request timed out",
          "The server took too long to respond. Try again, or shorten the requirement."
        );
      }
      throw new AppError("Request cancelled", "The request was cancelled.");
    }
    throw new AppError(
      "Cannot reach the server",
      "Check that the backend is running at http://127.0.0.1:8000 and that CORS allows this page, then try again."
    );
  } finally {
    clearTimeout(timer);
    if (activeController === controller) activeController = null;
  }

  // Read the body as text first so a non-JSON reply does not crash us.
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (_) {
    data = null;
  }

  if (!response.ok) throw buildHttpError(response.status, data);

  if (data === null || typeof data !== "object") {
    throw new AppError(
      "Unexpected server response",
      "The server did not return valid JSON. Try again in a moment."
    );
  }
  return data;
}

/** Pull a readable message out of common backend error shapes (FastAPI, custom). */
function extractServerMessage(data) {
  if (!data) return "";
  const detail = data.detail ?? data.error ?? data.message;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors: [{ msg: "...", loc: [...] }]
    return detail
      .map((d) => (d && d.msg ? d.msg : typeof d === "string" ? d : ""))
      .filter(Boolean)
      .join(" ");
  }
  if (detail && typeof detail === "object" && detail.message) return String(detail.message);
  return "";
}

function buildHttpError(status, data) {
  const serverMsg = extractServerMessage(data);

  if (status === 400 || status === 422) {
    return new AppError(
      "Invalid requirement",
      serverMsg || "The server rejected the requirement. Check the text and try again."
    );
  }
  if (status === 429) {
    return new AppError(
      "Too many requests",
      serverMsg || "The AI service is rate limited right now. Wait a minute and try again."
    );
  }
  if (status === 502 || status === 503 || status === 504) {
    return new AppError(
      "AI service unavailable",
      serverMsg || "The AI service did not respond correctly. Try again in a moment."
    );
  }
  if (status >= 500) {
    return new AppError(
      "Server error",
      serverMsg || "Something went wrong on the server. Try again, and check the backend logs if it continues."
    );
  }
  return new AppError(`Request failed (${status})`, serverMsg || "The request could not be completed.");
}

// ---------- Response validation / normalisation ----------
function toStringList(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function toText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

/**
 * Confirms the response has a test_cases array of objects with the agreed
 * fields. Throws AppError when the AI/back-end reply is unusable.
 */
function parseTestCases(data) {
  if (!Array.isArray(data.test_cases)) {
    throw new AppError(
      "Invalid AI response",
      "The response did not contain a test_cases list. Try generating again."
    );
  }

  const cases = data.test_cases.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new AppError(
        "Invalid AI response",
        `Test case ${index + 1} is not in the expected format. Try generating again.`
      );
    }
    const tc = {
      test_case_id: toText(item.test_case_id) || `TC-${String(index + 1).padStart(3, "0")}`,
      title: toText(item.title),
      preconditions: toStringList(item.preconditions),
      test_steps: toStringList(item.test_steps),
      expected_result: toText(item.expected_result),
      priority: toText(item.priority),
      test_type: toText(item.test_type),
    };
    if (!tc.title || tc.test_steps.length === 0 || !tc.expected_result) {
      throw new AppError(
        "Invalid AI response",
        `Test case ${index + 1} is missing a title, steps, or expected result. Try generating again.`
      );
    }
    return tc;
  });

  return cases;
}

// ---------- Rendering ----------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent: never parses HTML
  return node;
}

function makeList(items, ordered) {
  if (items.length === 0) return el("span", "muted", "None");
  const list = el(ordered ? "ol" : "ul");
  items.forEach((text) => list.appendChild(el("li", "", text)));
  return list;
}

function badge(text, kind) {
  const label = text || "Not set";
  return el("span", `badge badge-${kind}`, label);
}

function priorityKind(p) {
  const v = p.toLowerCase();
  if (v === "high" || v === "critical" || v === "p1") return "high";
  if (v === "medium" || v === "p2") return "medium";
  if (v === "low" || v === "p3") return "low";
  return "other";
}

function typeKind(t) {
  const v = t.toLowerCase();
  if (v === "positive") return "positive";
  if (v === "negative") return "negative";
  return "other";
}

function addCell(row, label, content, className) {
  const td = el("td", className);
  td.dataset.label = label; // used for the stacked mobile layout
  if (typeof content === "string") td.textContent = content;
  else td.appendChild(content);
  row.appendChild(td);
}

function renderResults(testCases) {
  currentTestCases = testCases;
  resultsBody.replaceChildren();

  const hasResults = testCases.length > 0;
  tableWrap.hidden = !hasResults;
  emptyState.hidden = hasResults;
  exportCsvBtn.disabled = !hasResults;
  exportJsonBtn.disabled = !hasResults;

  if (!hasResults) {
    summary.textContent = "Nothing generated yet.";
    return;
  }

  testCases.forEach((tc) => {
    const row = el("tr", `row-${typeKind(tc.test_type)}`);
    addCell(row, "ID", tc.test_case_id, "cell-id");
    addCell(row, "Title", tc.title, "cell-title");
    addCell(row, "Preconditions", makeList(tc.preconditions, false));
    addCell(row, "Test steps", makeList(tc.test_steps, true));
    addCell(row, "Expected result", tc.expected_result);
    addCell(row, "Priority", badge(tc.priority, priorityKind(tc.priority)));
    addCell(row, "Type", badge(tc.test_type, typeKind(tc.test_type)));
    resultsBody.appendChild(row);
  });

  const positive = testCases.filter((t) => typeKind(t.test_type) === "positive").length;
  const negative = testCases.filter((t) => typeKind(t.test_type) === "negative").length;
  summary.textContent =
    `${testCases.length} test case${testCases.length === 1 ? "" : "s"} generated: ` +
    `${positive} positive, ${negative} negative.`;
}

// ---------- Export ----------
function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * Escape one CSV cell (RFC 4180): wrap in quotes, double any inner quotes.
 * Cells starting with = + - @ get a leading apostrophe so spreadsheet apps
 * do not run them as formulas (CSV injection protection).
 */
function csvCell(value) {
  let text = value === undefined || value === null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(testCases) {
  const header = [
    "Test Case ID",
    "Title",
    "Preconditions",
    "Test Steps",
    "Expected Result",
    "Priority",
    "Test Type",
  ];
  const rows = testCases.map((tc) => [
    tc.test_case_id,
    tc.title,
    tc.preconditions.map((p, i) => `${i + 1}. ${p}`).join("\n"),
    tc.test_steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    tc.expected_result,
    tc.priority,
    tc.test_type,
  ]);
  // CRLF line endings between records; embedded newlines stay inside quotes.
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCsv() {
  if (currentTestCases.length === 0) return;
  // "\uFEFF" (BOM) makes Excel read the file as UTF-8.
  downloadFile(
    `test-cases-${timestamp()}.csv`,
    "\uFEFF" + buildCsv(currentTestCases),
    "text/csv;charset=utf-8"
  );
}

function exportJson() {
  if (currentTestCases.length === 0) return;
  const payload = JSON.stringify({ test_cases: currentTestCases }, null, 2);
  downloadFile(`test-cases-${timestamp()}.json`, payload, "application/json");
}

// ---------- Main submit handler ----------
async function handleSubmit(event) {
  event.preventDefault();
  if (generateBtn.disabled) return; // blocks double submits

  hideError();
  clearFieldError();

  const requirement = requirementInput.value.trim();
  const problem = validateRequirement(requirement);
  if (problem) {
    showFieldError(problem);
    requirementInput.focus();
    return;
  }

  setLoading(true);
  try {
    const data = await requestTestCases(requirement);
    const testCases = parseTestCases(data);

    if (testCases.length === 0) {
      renderResults([]);
      showError(
        "No test cases returned",
        "The AI did not return any test cases. Add more detail to the requirement and try again."
      );
      return;
    }
    renderResults(testCases);
    $("results-heading").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    // Keep the previous results on screen if a new request fails.
    if (err instanceof AppError) {
      showError(err.title, err.message);
    } else {
      console.error(err);
      showError("Unexpected error", "Something unexpected happened. Please try again.");
    }
  } finally {
    setLoading(false);
  }
}

// ---------- Event wiring ----------
form.addEventListener("submit", handleSubmit);

requirementInput.addEventListener("input", () => {
  updateCharCount();
  if (!requirementError.hidden) clearFieldError();
});

requirementInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    form.requestSubmit();
  }
});

clearBtn.addEventListener("click", () => {
  requirementInput.value = "";
  updateCharCount();
  clearFieldError();
  hideError();
  renderResults([]);
  requirementInput.focus();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    requirementInput.value = chip.dataset.example;
    updateCharCount();
    clearFieldError();
    requirementInput.focus();
  });
});

exportCsvBtn.addEventListener("click", exportCsv);
exportJsonBtn.addEventListener("click", exportJson);

// Initial state
updateCharCount();
renderResults([]);
