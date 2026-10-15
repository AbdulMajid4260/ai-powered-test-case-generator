import { MAX_LENGTH } from "../utils/validate";

const EXAMPLES = [
  {
    label: "Login",
    text: "Users can log in with a registered email and password. After 5 consecutive failed attempts, the account is locked for 15 minutes.",
  },
  {
    label: "Shopping cart",
    text: "Customers can add products to a shopping cart, change quantities from 1 to 10, remove items, and see the updated total price including tax.",
  },
  {
    label: "Password reset",
    text: "A user can reset their password by requesting an email link. The link expires after 30 minutes and can be used only once.",
  },
];

export default function RequirementForm({ value, onChange, onSubmit, onClear, loading, fieldError }) {
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <section className="card" aria-labelledby="req-heading">
      <h2 id="req-heading">Requirement</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="requirement" className="sr-only">
          Software requirement
        </label>
        <textarea
          id="requirement"
          rows={8}
          maxLength={MAX_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Example: Users can log in with a registered email and password."
          className={fieldError ? "invalid" : ""}
          aria-invalid={fieldError ? "true" : undefined}
          aria-describedby="req-error"
        />
        <div className="field-meta">
          <span className="hint">Press Ctrl + Enter to generate.</span>
          <span className="hint" aria-live="polite">
            {value.length} / {MAX_LENGTH}
          </span>
        </div>

        <p id="req-error" className="field-error" role="alert">
          {fieldError}
        </p>

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
            {loading && <span className="spinner" aria-hidden="true" />}
            {loading ? "Generating..." : "Generate test cases"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClear} disabled={loading}>
            Clear
          </button>
        </div>

        <div className="examples">
          <span className="hint">Fill in an example:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              className="chip"
              disabled={loading}
              onClick={() => onChange(ex.text)}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </form>

      {loading && (
        <p className="status" role="status">
          Generating test cases. This can take 10 to 30 seconds.
        </p>
      )}
    </section>
  );
}
