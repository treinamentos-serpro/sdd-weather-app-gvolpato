import type { RefObject } from 'react';
import { memo } from 'react';
import { formatLocalDateTime } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCodeInfo } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
  titleRef?: RefObject<HTMLHeadingElement | null>;
}

interface Metric {
  label: string;
  value: number | undefined;
  unit: string;
}

function CurrentWeather({ city, current, unit, titleRef }: CurrentWeatherProps) {
  const weatherInfo = getWeatherCodeInfo(current.weatherCode);
  const metrics: Metric[] = [
    { label: 'Umidade', value: current.humidity, unit: '%' },
    { label: 'Vento', value: current.windSpeed, unit: 'km/h' },
    { label: 'Precipitação', value: current.precipitation, unit: 'mm' },
    { label: 'Pressão', value: current.pressure, unit: 'hPa' },
  ];
  const temperature = Number.isFinite(current.temperatureCelsius)
    ? formatTemperature(current.temperatureCelsius, unit)
    : '—';
  const apparentTemperature = Number.isFinite(current.apparentTemperatureCelsius)
    ? formatTemperature(current.apparentTemperatureCelsius as number, unit)
    : null;

  return (
    <section
      aria-labelledby="current-weather-title"
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur-md sm:p-8"
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-white/60">Agora em</p>
          <h1
            ref={titleRef}
            id="current-weather-title"
            tabIndex={-1}
            className="mt-1 text-2xl font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            {city.name}
          </h1>
          <p className="mt-2 text-white/70">{current.condition}</p>
          <p className="mt-1 text-sm text-white/60">
            Medido em {formatLocalDateTime(current.measuredAt, city.timezone)}
          </p>
          {apparentTemperature && (
            <p className="mt-1 text-sm text-white/70">Sensação térmica: {apparentTemperature}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-6xl" role="img" aria-label={weatherInfo.condition}>
            {weatherInfo.icon}
          </span>
          <p className="text-6xl font-semibold tracking-tight text-white">{temperature}</p>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-white/5 p-3">
            <dt className="text-sm text-white/60">{metric.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-white">
              {!Number.isFinite(metric.value) ? '—' : `${metric.value} ${metric.unit}`}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default memo(CurrentWeather);
