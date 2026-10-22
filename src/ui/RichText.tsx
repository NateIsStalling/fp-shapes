// Renders text where `backticked` spans are code: variables, constructors,
// and API names in captions and notes.
export function RichText({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/);
  return <>{parts.map((p, i) => (i % 2 === 1 ? <code key={i} className="tok">{p}</code> : p))}</>;
}
