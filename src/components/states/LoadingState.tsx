export default function LoadingState() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-10 text-center shadow-glass backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-accent-400"
      />
      <p className="text-white/70">Carregando previsão do tempo…</p>
    </div>
  );
}
