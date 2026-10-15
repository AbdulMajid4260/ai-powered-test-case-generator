import { useState } from "react";

const TEAM_EMAIL = "team@example.com"; // TODO: change this
const REPO_URL = "https://github.com/your-team/your-repo"; // TODO: change this

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setError("Fill in your name, email and message.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    const subject = encodeURIComponent(`Message from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} (${email})`);
    window.location.href = `mailto:${TEAM_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Contact us</h1>
          <p>Questions, feedback or a bug to report? Send us a message.</p>
        </div>
      </section>

      <div className="container section grid-2">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="c-name">Name</label>
            <input id="c-name" value={form.name} onChange={update("name")} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="c-email">Email</label>
            <input id="c-email" type="email" value={form.email} onChange={update("email")} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="c-message">Message</label>
            <textarea id="c-message" rows={6} value={form.message} onChange={update("message")} />
          </div>
          <p className="field-error" role="alert">{error}</p>
          <button type="submit" className="btn btn-primary">Open in email app</button>
          <p className="hint" style={{ marginTop: 12 }}>This opens your email app with the message filled in.</p>
        </form>

        <div className="card info-card">
          <h3>Reach the team</h3>
          <p>Email: <a href={`mailto:${TEAM_EMAIL}`}>{TEAM_EMAIL}</a></p>
          <p>Source code: <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub repository</a></p>
        </div>
      </div>
    </>
  );
}
