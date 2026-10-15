import { useMemo, useState } from "react";
import ResultsTable from "./ResultsTable";
import { priorityKind, typeKind } from "../utils/format";

function Skeleton() {
  return (
    <div className="skeleton" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  );
}

export default function ResultsPanel({ testCases, loading, exporting, onExport }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const stats = useMemo(
    () => ({
      total: testCases.length,
      positive: testCases.filter((t) => typeKind(t.test_type) === "positive").length,
      negative: testCases.filter((t) => typeKind(t.test_type) === "negative").length,
      high: testCases.filter((t) => priorityKind(t.priority) === "high").length,
    }),
    [testCases]
  );

  const visible = useMemo(
    () =>
      testCases.filter(
        (t) =>
          (typeFilter === "all" || typeKind(t.test_type) === typeFilter) &&
          (priorityFilter === "all" || priorityKind(t.priority) === priorityFilter)
      ),
    [testCases, typeFilter, priorityFilter]
  );

  const hasResults = testCases.length > 0;

  return (
    <section className="card results" aria-labelledby="results-heading">
      <div className="results-head">
        <h2 id="results-heading">Generated test cases</h2>
        <div className="export-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onExport("csv")}
            disabled={!hasResults || loading || exporting !== null}
          >
            {exporting === "csv" ? "Preparing..." : "Export CSV"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onExport("json")}
            disabled={!hasResults || loading || exporting !== null}
          >
            {exporting === "json" ? "Preparing..." : "Export JSON"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onExport("xlsx")}
            disabled={!hasResults || loading || exporting !== null}
          >
            {exporting === "xlsx" ? "Preparing..." : "Export Excel"}
          </button>
        </div>
      </div>

      {loading && <Skeleton />}

      {!loading && !hasResults && (
        <div className="empty">
          <p className="empty-title">No test cases yet</p>
          <p>Enter a requirement and select <em>Generate test cases</em>. Results appear here.</p>
        </div>
      )}

      {!loading && hasResults && (
        <>
          <dl className="stats">
            <div><dt>Total</dt><dd>{stats.total}</dd></div>
            <div><dt>Positive</dt><dd className="pos">{stats.positive}</dd></div>
            <div><dt>Negative</dt><dd className="neg">{stats.negative}</dd></div>
            <div><dt>High priority</dt><dd>{stats.high}</dd></div>
          </dl>

          <div className="filters">
            <div className="segmented" role="group" aria-label="Filter by type">
              {["all", "positive", "negative"].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={typeFilter === v ? "active" : ""}
                  aria-pressed={typeFilter === v}
                  onClick={() => setTypeFilter(v)}
                >
                  {v === "all" ? "All types" : v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <label className="select-label">
              Priority
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <span className="hint">
              Showing {visible.length} of {stats.total}. Exports include all {stats.total}.
            </span>
          </div>

          {visible.length > 0 ? (
            <ResultsTable testCases={visible} />
          ) : (
            <div className="empty">
              <p className="empty-title">No test cases match these filters</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setTypeFilter("all");
                  setPriorityFilter("all");
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
