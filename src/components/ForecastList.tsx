import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  timezone: string;
  unit: Unit;
}

export default function ForecastList({ forecast, timezone, unit }: ForecastListProps) {
  return (
    <section aria-labelledby="forecast-title">
      <h2
        id="forecast-title"
        className="mb-3 text-sm font-medium uppercase tracking-wide text-white/60"
      >
        Previsão de 5 dias
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {forecast.map((day, index) => (
          <ForecastCard key={day.date} day={day} index={index} timezone={timezone} unit={unit} />
        ))}
      </div>
    </section>
  );
}
