import type { FormEvent } from 'react';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const [city, setCity] = useState('');
  const trimmedCity = city.trim();
  const characterCount = [...trimmedCity].length;
  const isValidCity =
    characterCount >= 2 && characterCount <= 80 && /[\p{L}\p{N}]/u.test(trimmedCity);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidCity) {
      return;
    }
    onSearch(trimmedCity);
  };

  return (
    <form
      role="search"
      aria-busy={disabled}
      onSubmit={handleSubmit}
      className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md"
    >
      <label htmlFor="city-search" className="sr-only">
        Nome da cidade
      </label>
      <input
        id="city-search"
        type="text"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        disabled={disabled}
        aria-invalid={city.length > 0 && !isValidCity}
        aria-describedby={city.length > 0 && !isValidCity ? 'city-search-hint' : undefined}
        placeholder="Buscar cidade..."
        className="w-full rounded-xl bg-transparent px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !isValidCity}
        className="shrink-0 rounded-xl bg-accent-500 px-4 py-2 font-medium text-white transition hover:bg-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent-500"
      >
        Buscar
      </button>
      {city.length > 0 && !isValidCity && (
        <p id="city-search-hint" role="status" className="sr-only">
          Informe pelo menos 2 caracteres, contendo uma letra ou número.
        </p>
      )}
    </form>
  );
}
