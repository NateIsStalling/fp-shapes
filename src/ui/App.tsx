import { NavLink, Navigate, Route, Routes, useParams } from "react-router-dom";
import { operationGroups, operationsById, type OperationId } from "../catalog/operations";
import { OperationPage } from "./OperationPage";

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
      <p className="tagline">Interactive diagrams of functional programming operations</p>
      {operationGroups.map((g) => (
        <div key={g.name} className="nav-group">
          <p className="eyebrow">{g.name}</p>
          {g.operations.map((o) => (
            <NavLink key={o.id} to={`/op/${o.id}`} className={({ isActive }) => `oplink${isActive ? " on" : ""}`}>{o.name}</NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

function OperationRoute() {
  const { operationId } = useParams();
  const op = operationsById.get(operationId as OperationId);
  if (!op) return <Navigate to="/" replace />;
  return <OperationPage key={op.id} op={op} />;
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
