import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  onSelect: (city: City) => void;
}

export default function CityResults({ cities, onSelect }: CityResultsProps) {
  return (
    <section aria-live="polite" aria-labelledby="city-results-title">
      <h1 id="city-results-title" className="mb-3 text-xl font-semibold text-white">
        Selecione uma cidade
      </h1>
      <div role="listbox" aria-label="Resultados de cidades" className="grid gap-3">
        {cities.map((city) => (
          <button
            key={`${city.id}-${city.latitude}-${city.longitude}`}
            type="button"
            role="option"
            aria-label={`${city.name}, ${city.country}${city.admin1 ? `, ${city.admin1}` : ''}`}
            onClick={() => onSelect(city)}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            <span className="block font-semibold">{city.name}</span>
            <span className="block text-sm text-white/70">
              {city.country}
              {city.admin1 ? ` · ${city.admin1}` : ''}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
