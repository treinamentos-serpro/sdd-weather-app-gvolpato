interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-10 text-center shadow-glass backdrop-blur-md"
    >
      <p className="text-lg font-semibold text-white">Algo deu errado</p>
      <p className="text-white/70">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl bg-accent-500 px-4 py-2 font-medium text-white transition hover:bg-accent-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
      >
        Tentar novamente
      </button>
    </div>
  );
}
