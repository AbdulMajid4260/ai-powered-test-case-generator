import { AppError } from "./errors";

export const MIN_LENGTH = 10;
export const MAX_LENGTH = 3000;

/** Returns an error message, or "" when the input is valid. */
export function validateRequirement(text) {
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
  return "";
}

const toText = (v) => (v === undefined || v === null ? "" : String(v).trim());

function toList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

/**
 * Checks the response has a `test_cases` array with the agreed fields and
 * returns a clean copy. Throws AppError if the reply is unusable.
 */
export function parseTestCases(data) {
  if (!data || !Array.isArray(data.test_cases)) {
    throw new AppError(
      "Invalid AI response",
      "The response did not contain a test_cases list. Try generating again."
    );
  }
  return data.test_cases.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new AppError(
        "Invalid AI response",
        `Test case ${i + 1} is not in the expected format. Try generating again.`
      );
    }
    const tc = {
      test_case_id: toText(item.test_case_id) || `TC-${String(i + 1).padStart(3, "0")}`,
      title: toText(item.title),
      preconditions: toList(item.preconditions),
      test_steps: toList(item.test_steps),
      expected_result: toText(item.expected_result),
      priority: toText(item.priority),
      test_type: toText(item.test_type),
    };
    if (!tc.title || tc.test_steps.length === 0 || !tc.expected_result) {
      throw new AppError(
        "Invalid AI response",
        `Test case ${i + 1} is missing a title, steps, or expected result. Try generating again.`
      );
    }
    return tc;
  });
}
