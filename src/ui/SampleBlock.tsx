import { useEffect, useRef, useState } from "react";

// A code sample with its language and a copy button.
export function SampleBlock({ code, language }: { code: string; language: string }) {
  const [state, setState] = useState<"idle" | "copied" | "select">("idle");
  const pre = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (state === "idle") return;
    const id = setTimeout(() => setState("idle"), 1500);
    return () => clearTimeout(id);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      // Clipboard refused: select the code so the viewer can copy it.
      const node = pre.current;
      const selection = window.getSelection();
      if (node && selection) {
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setState("select");
    }
  };

  return (
    <div className="sample-block">
      <div className="sample-head">
        <span className="lang-chip">{language}</span>
        <button type="button" className="copy-button" onClick={copy} aria-label={`Copy ${language} sample`}>
          {state === "copied" ? "Copied" : state === "select" ? "Selected" : "Copy"}
        </button>
        <span className="sr-only" aria-live="polite">{state === "copied" ? "Sample copied" : state === "select" ? "Sample selected; press Ctrl+C or ⌘C to copy" : ""}</span>
      </div>
      <pre ref={pre} className="sample"><code>{code}</code></pre>
    </div>
  );
}
