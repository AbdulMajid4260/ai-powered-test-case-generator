import { useState } from "react";
import { useLocation } from "react-router-dom";
import RequirementForm from "../components/RequirementForm";
import ErrorBanner from "../components/ErrorBanner";
import ResultsPanel from "../components/ResultsPanel";
import { generateTestCases, exportTestCases, saveBlob } from "../api";
import { validateRequirement, parseTestCases } from "../utils/validate";
import { AppError, toDisplayError } from "../utils/errors";

export default function Generate() {
  const location = useLocation();
  const [requirement, setRequirement] = useState(location.state?.requirement ?? "");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null); // "csv" | "json" | null
  const [error, setError] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [generationId, setGenerationId] = useState(null);

  async function handleGenerate() {
    if (loading) return; // blocks double submits
    setError(null);
    setFieldError("");

    const text = requirement.trim();
    const problem = validateRequirement(text);
    if (problem) {
      setFieldError(problem);
      return;
    }

    setLoading(true);
    try {
      const data = await generateTestCases(text);
      const cases = parseTestCases(data);

      if (!data.generation_id) {
        throw new AppError(
          "Missing generation ID",
          "The server did not return a generation ID. Please try again."
        );
      }

      setGenerationId(data.generation_id);
      if (cases.length === 0) {
        throw new AppError(
          "No test cases returned",
          "The AI did not return any test cases. Add more detail to the requirement and try again."
        );
      }
      setTestCases(cases);
    } catch (err) {
      // Previous results stay on screen if a new request fails.
      setError(toDisplayError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format) {
    if (exporting || testCases.length === 0) return;
    setError(null);
    setExporting(format);
    try {
      if (!generationId) {
  throw new AppError(
    "Nothing to export",
    "Generate test cases again before exporting."
  );
}

const { blob, filename } = await exportTestCases(generationId, format);
      saveBlob(blob, filename);
    } catch (err) {
      setError(toDisplayError(err));
    } finally {
      setExporting(null);
    }
  }

  function handleClear() {
    setRequirement("");
    setFieldError("");
    setError(null);
    setTestCases([]);
    setGenerationId(null);
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Generate test cases</h1>
          <p>Describe a requirement in plain English, then review, filter and export the results.</p>
        </div>
      </section>

      <div className="container workspace">
        <aside className="sidebar">
          <RequirementForm
            value={requirement}
            onChange={(v) => {
              setRequirement(v);
              if (fieldError) setFieldError("");
            }}
            onSubmit={handleGenerate}
            onClear={handleClear}
            loading={loading}
            fieldError={fieldError}
          />
          <ErrorBanner error={error} onDismiss={() => setError(null)} />
        </aside>

        <ResultsPanel
          testCases={testCases}
          loading={loading}
          exporting={exporting}
          onExport={handleExport}
        />
      </div>
    </>
  );
}
