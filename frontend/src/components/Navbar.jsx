import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/generate", label: "Generate" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact us" },
];

export default function Navbar({ theme, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container navbar">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark" aria-hidden="true">TC</span>
          TestCase AI
        </Link>

        <nav id="main-nav" aria-label="Main" className={`nav${open ? " open" : ""}`}>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={close}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            type="button"
            className="menu-btn"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
