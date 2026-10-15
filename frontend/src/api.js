import { AppError } from "./utils/errors";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const TIMEOUT_MS = 90000; // LLM calls can be slow

/** Pull a readable message out of common backend error bodies (FastAPI or custom). */
function serverMessage(data) {
  if (!data) return "";
  const detail = data.detail ?? data.error ?? data.message;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d && d.msg ? d.msg : typeof d === "string" ? d : ""))
      .filter(Boolean)
      .join(" ");
  }
  if (detail && typeof detail === "object" && detail.message) return String(detail.message);
  return "";
}

function httpError(status, data) {
  const msg = serverMessage(data);
  if (status === 400 || status === 422) {
    return new AppError("Invalid request", msg || "The server rejected the request. Check the input and try again.");
  }
  if (status === 429) {
    return new AppError("Too many requests", msg || "The AI service is rate limited right now. Wait a minute and try again.");
  }
  if (status === 502 || status === 503 || status === 504) {
    return new AppError("AI service unavailable", msg || "The AI service did not respond correctly. Try again in a moment.");
  }
  if (status >= 500) {
    return new AppError("Server error", msg || "Something went wrong on the server. Try again, and check the backend logs if it continues.");
  }
  return new AppError(`Request failed (${status})`, msg || "The request could not be completed.");
}

/** POST JSON to the backend. Returns the raw Response when it is OK. */
async function send(method, path, body) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError" && timedOut) {
      throw new AppError("The request timed out", "The server took too long to respond. Try again, or shorten the requirement.");
    }
    throw new AppError(
      "Cannot reach the server",
      `Check that the backend is running at ${API_BASE} and that CORS allows this page, then try again.`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      /* body was not JSON */
    }
    throw httpError(response.status, data);
  }
  return response;
}

const post = (path, body) => send("POST", path, body);

/** POST /api/generate-test-cases */
export async function generateTestCases(requirement) {
  const response = await post("/api/generate-test-cases", { requirement });
  try {
    return await response.json();
  } catch (_) {
    throw new AppError("Unexpected server response", "The server did not return valid JSON. Try again in a moment.");
  }
}

/** POST /api/export/{csv|json} - the backend builds the file; we just download it. */
export async function exportTestCases(generationId, format) {
  const response = await send(
    "GET",
    `/api/export/${encodeURIComponent(generationId)}?format=${encodeURIComponent(format)}`
  );

  const blob = await response.blob();
  const header = response.headers.get("Content-Disposition") || "";
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = match
    ? decodeURIComponent(match[1])
    : `test_cases.${format}`;

  return { blob, filename };
}

/** Save a Blob the backend returned as a file in the browser. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (_) {
    throw new AppError("Unexpected server response", "The server did not return valid JSON. Try again in a moment.");
  }
}

/** GET /api/history -> { items: [...] } */
export async function getHistory() {
  return readJson(await send("GET", "/api/history"));
}

/** GET /api/history/{id} -> full record including test_cases */
export async function getHistoryItem(id) {
  return readJson(await send("GET", `/api/history/${encodeURIComponent(id)}`));
}

/** DELETE /api/history/{id} -> 204 */
export async function deleteHistoryItem(id) {
  await send("DELETE", `/api/history/${encodeURIComponent(id)}`);
}
