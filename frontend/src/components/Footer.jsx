import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="brand-line">TestCase AI</p>
          <p className="hint">Turn plain-English requirements into structured test cases.</p>
        </div>
        <nav aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/generate">Generate</Link>
          <Link to="/history">History</Link>
          <Link to="/about">About us</Link>
          <Link to="/contact">Contact us</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <p>AI-generated output can contain mistakes. Review every test case before using it.</p>
        <p>&copy; {new Date().getFullYear()} TestCase AI. Built by a team of three.</p>
      </div>
    </footer>
  );
}
