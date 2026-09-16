import { useState } from 'react';
import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import IncompleteState from './components/states/IncompleteState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, cities, error, search, selectCity, retry } = useWeather();

  return (
    <div className="min-h-screen bg-night-900 px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xl font-semibold tracking-tight text-white">
            🌤️ <span className="text-accent-400">SDD</span> Weather
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar onSearch={search} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </header>

        <main aria-busy={status === 'loading'}>
          {status === 'idle' && (
            <EmptyState
              title="Busque uma cidade"
              hint="Digite o nome de uma cidade para ver a previsão do tempo."
            />
          )}
          {status === 'loading' && <LoadingState />}
          {status === 'empty' && (
            <EmptyState
              title="Nenhuma cidade encontrada"
              hint="Não encontramos informações de clima para essa cidade."
            />
          )}
          {status === 'error' && <ErrorState message={error} onRetry={retry} />}
          {status === 'success' && !data && cities.length > 0 && (
            <CityResults cities={cities} onSelect={selectCity} />
          )}
          {status === 'success' && data && (
            <div className="flex flex-col gap-8">
              {data.currentStatus === 'success' && data.current ? (
                <CurrentWeather city={data.city} current={data.current} unit={unit} />
              ) : (
                <IncompleteState
                  title="Dados atuais indisponíveis"
                  hint="Não foi possível carregar as condições atuais desta cidade."
                />
              )}
              {data.forecastStatus === 'success' ? (
                <ForecastList forecast={data.forecast} timezone={data.city.timezone} unit={unit} />
              ) : (
                <IncompleteState
                  title="Previsão indisponível"
                  hint="Não foi possível carregar os cinco dias desta cidade."
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
