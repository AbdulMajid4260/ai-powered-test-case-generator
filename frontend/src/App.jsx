import { useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import useTheme from "./hooks/useTheme";
import Home from "./pages/Home";
import Generate from "./pages/Generate";
import History from "./pages/History";
import About from "./pages/About";
import Contact from "./pages/Contact";

function NotFound() {
  return (
    <section className="page-head">
      <div className="container">
        <h1>Page not found</h1>
        <p>That page does not exist. <Link to="/">Go to the home page</Link>.</p>
      </div>
    </section>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="ambient" aria-hidden="true" />
      <Navbar theme={theme} onToggleTheme={toggle} />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/history" element={<History />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
