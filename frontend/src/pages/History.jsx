import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ResultsTable from "../components/ResultsTable";
import ErrorBanner from "../components/ErrorBanner";
import { getHistory, getHistoryItem, deleteHistoryItem } from "../api";
import { parseTestCases } from "../utils/validate";
import { toDisplayError } from "../utils/errors";

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState({}); // id -> test cases
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getHistory()
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((err) => {
        if (!cancelled) setError(toDisplayError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(id) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (details[id]) return;
    setBusyId(id);
    setError(null);
    try {
      const data = await getHistoryItem(id);
      setDetails((d) => ({ ...d, [id]: parseTestCases(data) }));
    } catch (err) {
      setError(toDisplayError(err));
      setOpenId(null);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this entry from history?")) return;
    setError(null);
    try {
      await deleteHistoryItem(id);
      setItems((list) => list.filter((i) => i.id !== id));
      if (openId === id) setOpenId(null);
    } catch (err) {
      setError(toDisplayError(err));
    }
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>History</h1>
          <p>Past requirements and the test cases generated for them.</p>
        </div>
      </section>

      <div className="container history">
        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        {loading && <p className="hint" role="status">Loading history...</p>}

        {!loading && !error && items.length === 0 && (
          <div className="empty">
            <p className="empty-title">No history yet</p>
            <p>Requirements you generate test cases for will appear here.</p>
            <Link to="/generate" className="btn btn-primary" style={{ marginTop: 12 }}>
              Generate test cases
            </Link>
          </div>
        )}

        <ul className="history-list">
          {items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <li key={item.id} className="card history-item">
                <div className="history-top">
                  <time dateTime={item.created_at} className="mono">
                    {formatDate(item.created_at)}
                  </time>
                  <div className="history-badges">
                    <span className="badge badge-other">{item.test_case_count} test cases</span>
                    <span className="badge badge-positive">{item.positive_count} positive</span>
                    <span className="badge badge-negative">{item.negative_count} negative</span>
                  </div>
                </div>

                <p className={`history-req${isOpen ? " open" : ""}`}>{item.requirement}</p>

                <div className="history-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    aria-expanded={isOpen}
                    onClick={() => toggle(item.id)}
                  >
                    {isOpen ? "Hide test cases" : "View test cases"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate("/generate", { state: { requirement: item.requirement } })}
                  >
                    Use again
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() => remove(item.id)}
                  >
                    Delete
                  </button>
                </div>

                {isOpen && busyId === item.id && <p className="hint" role="status">Loading test cases...</p>}
                {isOpen && details[item.id] && <ResultsTable testCases={details[item.id]} />}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
