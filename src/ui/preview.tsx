import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

// Preview content: catalog entries still under review. Hidden by default; the
// viewer opts in after confirming a warning. The choice is stored per browser.

const KEY = "fp-shapes-preview";

function stored(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function store(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, "on");
    else localStorage.removeItem(KEY);
  } catch {
    // Storage can be unavailable (private mode); the choice still applies now.
  }
}

interface PreviewState {
  readonly on: boolean;
  readonly set: (on: boolean) => void;
}

const PreviewContext = createContext<PreviewState>({ on: false, set: () => {} });

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(stored);
  const set = (next: boolean) => { store(next); setOn(next); };
  return <PreviewContext.Provider value={{ on, set }}>{children}</PreviewContext.Provider>;
}

export const usePreview = () => useContext(PreviewContext);

const WARNING = "Preview content is under review and may not be accurate.";

export function PreviewToggle() {
  const { on, set } = usePreview();
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <button type="button" role="switch" aria-checked={on} className={`preview-switch${on ? " on" : ""}`}
        onClick={() => (on ? set(false) : setConfirming(true))}>
        <span className="preview-track" aria-hidden="true"><span className="preview-thumb" /></span>
        <span>Preview</span>
      </button>
      {confirming && (
        <ConfirmPreview onCancel={() => setConfirming(false)} onConfirm={() => { set(true); setConfirming(false); }} />
      )}
    </>
  );
}

function ConfirmPreview({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => opener?.focus();
  }, []);
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId} className="modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key !== "Tab") return;
          // Keep focus inside the dialog.
          const buttons = [...e.currentTarget.querySelectorAll("button")];
          const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const next = buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length];
          e.preventDefault();
          next?.focus();
        }}>
        <h2 id={titleId} className="modal-title">Show preview content?</h2>
        <p id={bodyId} className="modal-body">{WARNING} Check it against each library's own docs before relying on it.</p>
        <div className="modal-actions">
          <button ref={cancelRef} type="button" className="modal-button" onClick={onCancel}>Cancel</button>
          <button type="button" className="modal-button primary" onClick={onConfirm}>Show preview</button>
        </div>
      </div>
    </div>
  );
}

export function PreviewBanner() {
  const { on, set } = usePreview();
  if (!on) return null;
  return (
    <div className="preview-banner" role="status">
      <span><strong>Preview on.</strong> {WARNING}</span>
      <button type="button" className="link-button" onClick={() => set(false)}>Turn off</button>
    </div>
  );
}
