interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-10 text-center shadow-glass backdrop-blur-md">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="text-white/70">{hint}</p>
    </div>
  );
}
