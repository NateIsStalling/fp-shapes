import { NavLink, Navigate, Route, Routes, useParams } from "react-router-dom";
import { operationGroups, operationsById, type OperationId } from "../catalog/operations";
import { TraversePage } from "./TraversePage";

function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Primary">
      <NavLink to="/" className="brand" aria-label="FP Shapes home">
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
          <rect x="6" y="6" width="14" height="14" rx="3" transform="rotate(45 13 13)" fill="#6f4bd8" opacity=".9" />
          <rect x="12" y="6" width="14" height="14" rx="3" transform="rotate(45 19 13)" fill="#6f4bd8" opacity=".45" />
        </svg>
        FP Shapes
      </NavLink>
      <p className="tagline">Types define possibilities.<br />Shapes make them visible.</p>
      {operationGroups.map((g) => (
        <div key={g.name} className="nav-group">
          <p className="eyebrow">{g.name}</p>
          {g.operations.map((o) => (
            <NavLink key={o.id} to={`/op/${o.id}`} className={({ isActive }) => `oplink${isActive ? " on" : ""}`}>{o.name}</NavLink>
          ))}
        </div>
      ))}
      <p className="sidebar-foot">Diagrams are computed by running the operation on your inputs.</p>
    </nav>
  );
}

function OperationRoute() {
  const { operationId } = useParams();
  const op = operationsById.get(operationId as OperationId);
  if (!op) return <Navigate to="/" replace />;
  if (op.id === "traverse") return <TraversePage />;
  return (
    <main className="main">
      <header className="op-header">
        <p className="eyebrow">{op.group}</p>
        <div className="op-title"><h1>{op.name}</h1><span className="abstraction-tag"><span>abstraction</span>{op.abstraction}</span></div>
        <p className="mono op-signature">{op.signature}</p>
      </header>
      <p className="muted">The semantics for {op.name} are implemented and tested. Its page is next: shape ribbon, behavior lane, and ecosystem names.</p>
    </main>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Navigate to="/op/traverse" replace />} />
        <Route path="/op/:operationId" element={<OperationRoute />} />
        <Route path="/explore" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
