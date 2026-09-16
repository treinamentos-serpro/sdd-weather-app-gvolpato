interface IncompleteStateProps {
  title: string;
  hint: string;
}

export default function IncompleteState({ title, hint }: IncompleteStateProps) {
  return (
    <section
      role="status"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur-md"
    >
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-white/70">{hint}</p>
    </section>
  );
}
