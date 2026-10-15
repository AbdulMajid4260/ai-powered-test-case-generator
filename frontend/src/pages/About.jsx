const TEAM = [
  { name: "Member 1", role: "Frontend", text: "React interface, input validation, error handling and the history page." },
  { name: "Member 2", role: "Backend and AI", text: "REST API, LLM integration, response validation, export and history storage." },
  { name: "Member 3", role: "Testing and docs", text: "Automated API tests, response checks and the README." },
];

const DECISIONS = [
  "The LLM API key lives only in the backend environment, never in frontend code.",
  "The frontend validates input and checks every AI response before showing it.",
  "Export files are built by the backend, so the format logic lives in one place.",
  "Every generation is saved, so past requirements can be reviewed and reused.",
];

export default function About() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>About us</h1>
          <p>We are a team of three building an AI-assisted tool for writing test cases faster.</p>
        </div>
      </section>

      <section className="container section">
        <h2>What this project does</h2>
        <div className="prose">
          <p>
            Writing test cases by hand is slow and easy to get wrong. This app takes a software
            requirement in plain English, asks a large language model to analyse it, and returns
            structured test cases with preconditions, steps, expected results, priority and type.
          </p>
          <p>Add your project's goal or the course context here.</p>
        </div>
      </section>

      <section className="container section">
        <h2>The team</h2>
        <div className="grid-3">
          {TEAM.map((m) => (
            <article key={m.name} className="card info-card">
              <p className="role">{m.role}</p>
              <h3>{m.name}</h3>
              <p>{m.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container section">
        <h2>Key technical decisions</h2>
        <ul className="plain-list">
          {DECISIONS.map((d) => <li key={d}>{d}</li>)}
        </ul>
      </section>
    </>
  );
}
