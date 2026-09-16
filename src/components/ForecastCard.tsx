import { memo } from 'react';
import { formatDayLabel, getShortDate } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCodeInfo } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  index: number;
  timezone: string;
  unit: Unit;
}

function ForecastCard({ day, index, timezone, unit }: ForecastCardProps) {
  const weatherInfo = getWeatherCodeInfo(day.weatherCode);
  const dayLabel = formatDayLabel(index, day.date, timezone);
  const maximum = Number.isFinite(day.maxCelsius) ? formatTemperature(day.maxCelsius, unit) : '—';
  const minimum = Number.isFinite(day.minCelsius) ? formatTemperature(day.minCelsius, unit) : '—';
  const precipitation = Number.isFinite(day.precipitationProbability)
    ? `${day.precipitationProbability}%`
    : '—';

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
      <p className="text-sm font-medium uppercase tracking-wide text-white/60">
        {dayLabel} · {getShortDate(day.date, timezone)}
      </p>
      <span className="text-4xl" role="img" aria-label={weatherInfo.condition}>
        {weatherInfo.icon}
      </span>
      <p className="text-sm font-semibold text-white">
        {maximum} <span className="font-normal text-white/60">{minimum}</span>
      </p>
      <p className="text-xs text-white/60">💧 {precipitation}</p>
    </div>
  );
}

export default memo(ForecastCard);
