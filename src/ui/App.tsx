import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { operationsById, visibleGroups, type OperationId } from "../catalog/operations";
import { OperationPage } from "./OperationPage";
import { PreviewBanner, PreviewProvider, PreviewToggle, usePreview } from "./preview";
import { ThemeToggle } from "./ThemeToggle";

// On small screens the navigation collapses behind a menu button that names
// the current operation; it closes again after each navigation.
function Sidebar() {
  const preview = usePreview().on;
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  useEffect(() => setOpen(false), [pathname]);
  const current = operationsById.get(pathname.replace(/^\/op\//, "") as OperationId);
  return (
    <nav className={`sidebar${open ? " open" : ""}`} aria-label="Primary">
      <button type="button" className="menu-button" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" /></svg>
        <span>Operations</span>
        {current && <span className="menu-current">{current.name}</span>}
      </button>
      <div className="sidebar-menu" id={menuId}>
      <div className="nav-groups">
      {visibleGroups(preview).map((g) => (
        <div key={g.name} className="nav-group">
          <p className="eyebrow">{g.name}{g.preview && <span className="status-preview nav-tag">preview</span>}</p>
          {g.operations.map((o) => (
            <NavLink key={o.id} to={`/op/${o.id}`} className={({ isActive }) => `oplink${isActive ? " on" : ""}`}>{o.name}</NavLink>
          ))}
        </div>
      ))}
      </div>
      <div className="sidebar-foot">
        <a className="github-badge" href="https://github.com/NateIsStalling/fp-shapes" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span>GitHub</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <PreviewToggle />
        <ThemeToggle />
      </div>
      </div>
    </nav>
  );
}

function OperationRoute() {
  const { operationId } = useParams();
  const preview = usePreview().on;
  const op = operationsById.get(operationId as OperationId);
  // Unknown and hidden preview operations fall back to the default operation.
  if (!op || (op.preview && !preview)) return <Navigate to="/" replace />;
  return <OperationPage key={op.id} op={op} />;
}

function AppBar() {
  return (
    <header className="app-bar">
      <NavLink to="/" className="brand" aria-label="FP Shapes home">
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
          <rect x="2" y="2" width="11" height="11" rx="2.5" fill="#6f4bd8" opacity=".9" />
          <circle cx="20.5" cy="7.5" r="5.5" fill="#6f4bd8" opacity=".45" />
          <circle cx="7.5" cy="20.5" r="5.5" fill="#6f4bd8" opacity=".45" />
          <rect x="15" y="15" width="11" height="11" rx="2.5" fill="#6f4bd8" opacity=".9" />
        </svg>
        FP Shapes
      </NavLink>
      <p className="tagline">Interactive diagrams of functional programming operations</p>
    </header>
  );
}

// The app bar and Preview banner stay at the top on wide screens. Their
// height is published as --top-h so the sticky sidebar fits below them.
function useTopHeight() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const top = ref.current;
    const shell = top?.parentElement;
    if (!top || !shell) return;
    const update = () => shell.style.setProperty("--top-h", `${top.offsetHeight}px`);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(top);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function App() {
  const topRef = useTopHeight();
  return (
    <PreviewProvider>
    <div className="app-shell">
      <div className="app-top" ref={topRef}>
        <AppBar />
        <PreviewBanner />
      </div>
      <div className="app-body">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Navigate to="/op/traverse" replace />} />
          <Route path="/op/:operationId" element={<OperationRoute />} />
          <Route path="/explore" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
    </PreviewProvider>
  );
}
