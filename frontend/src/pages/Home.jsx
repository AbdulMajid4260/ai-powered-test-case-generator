import { Link } from "react-router-dom";

const STEPS = [
  { title: "Describe the requirement", text: "Write what the software should do, in plain English." },
  { title: "Let the AI generate", text: "The backend sends it to an LLM and checks the reply before returning it." },
  { title: "Review and export", text: "Filter the table by type and priority, then download CSV or JSON." },
];

const FIELDS = [
  "Test case ID", "Title", "Preconditions", "Test steps",
  "Expected result", "Priority", "Test type",
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="pill">Powered by an LLM</p>
          <h1>Turn requirements into test cases.</h1>
          <p className="hero-copy">
            Describe a feature in plain English. Get structured, prioritised test cases you can
            review, filter and export.
          </p>
          <div className="hero-actions">
            <Link to="/generate" className="btn btn-primary">Start generating</Link>
            <Link to="/history" className="btn btn-ghost">View history</Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>How it works</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container section">
        <h2>Every test case includes</h2>
        <ul className="field-list">
          {FIELDS.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </section>
    </>
  );
}
