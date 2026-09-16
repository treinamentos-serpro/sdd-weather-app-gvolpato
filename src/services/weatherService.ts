import { getWeatherCodeInfo } from '../lib/weatherCodes';
import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 5;
const TIMEOUT_MS = 10_000;

export type WeatherServiceErrorCode = 'network' | 'timeout' | 'rate-limit' | 'invalid-response';

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly code: WeatherServiceErrorCode = 'network',
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

export class WeatherRequestAborted extends Error {
  constructor() {
    super('Requisicao cancelada.');
    this.name = 'WeatherRequestAborted';
  }
}

async function fetchWithTimeout(url: string, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const abortRequest = () => controller.abort();
  signal?.addEventListener('abort', abortRequest, { once: true });
  if (signal?.aborted) {
    abortRequest();
  }

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (timedOut) {
        throw new WeatherServiceError('Nao foi possivel conectar ao servico.', 'timeout');
      }

      if (signal?.aborted) {
        throw new WeatherRequestAborted();
      }
    }

    throw new WeatherServiceError('Nao foi possivel conectar ao servico.', 'network');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortRequest);
  }
}

function getHttpError(response: Response): WeatherServiceError {
  if (response.status === 429) {
    return new WeatherServiceError(
      'O servico esta temporariamente indisponivel. Tente novamente.',
      'rate-limit',
    );
  }

  return new WeatherServiceError('Nao foi possivel carregar os dados.', 'invalid-response');
}

interface GeocodingResult {
  id?: number | null;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  country?: string | null;
  admin1?: string | null;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

type ValidGeocodingResult = GeocodingResult & {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

function mapCity(result: ValidGeocodingResult): City {
  return {
    id: result.id,
    name: result.name,
    country: result.country ?? '—',
    admin1: result.admin1 ?? undefined,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  };
}

function isValidCityResult(result: GeocodingResult): result is ValidGeocodingResult {
  return (
    isFiniteNumber(result.id) &&
    typeof result.name === 'string' &&
    result.name.trim().length > 0 &&
    isFiniteNumber(result.latitude) &&
    isFiniteNumber(result.longitude) &&
    typeof result.timezone === 'string' &&
    result.timezone.trim().length > 0
  );
}

export async function searchCities(name: string, signal?: AbortSignal): Promise<City[]> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return [];
  }

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(trimmedName)}&count=10&language=pt&format=json`;

  const response = await fetchWithTimeout(url, signal);

  if (!response.ok) {
    throw getHttpError(response);
  }

  let data: GeocodingResponse;
  try {
    data = (await response.json()) as GeocodingResponse;
  } catch {
    throw new WeatherServiceError('Nao foi possivel carregar os dados.', 'invalid-response');
  }

  if (!data || !Array.isArray(data.results)) {
    throw new WeatherServiceError('Nao foi possivel carregar os dados.', 'invalid-response');
  }

  return data.results.filter(isValidCityResult).map(mapCity);
}

interface ForecastCurrentResponse {
  time?: string | null;
  temperature_2m?: number | null;
  apparent_temperature?: number | null;
  weather_code?: number | null;
  is_day?: number | null;
  relative_humidity_2m?: number | null;
  wind_speed_10m?: number | null;
  precipitation?: number | null;
  surface_pressure?: number | null;
}

interface ForecastDailyResponse {
  time?: Array<string | null> | null;
  weather_code?: Array<number | null> | null;
  temperature_2m_max?: Array<number | null> | null;
  temperature_2m_min?: Array<number | null> | null;
  precipitation_probability?: Array<number | null> | null;
}

interface ForecastResponse {
  current?: ForecastCurrentResponse;
  daily?: ForecastDailyResponse;
  timezone?: string | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function finiteOrUndefined(value: unknown): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

type ValidCurrentResponse = ForecastCurrentResponse & {
  time: string;
  temperature_2m: number;
  weather_code: number;
};

function isValidCurrent(current: ForecastCurrentResponse): current is ValidCurrentResponse {
  return (
    typeof current.time === 'string' &&
    isValidIsoTimestamp(current.time) &&
    isFiniteNumber(current.temperature_2m) &&
    isFiniteNumber(current.weather_code)
  );
}

function isValidIsoTimestamp(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsedDate = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() + 1 === month &&
    parsedDate.getUTCDate() === day
  );
}

type ValidDailyResponse = ForecastDailyResponse & {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
};

function isValidDaily(daily: ForecastDailyResponse): daily is ValidDailyResponse {
  const { time, weather_code, temperature_2m_max, temperature_2m_min } = daily;

  if (
    !Array.isArray(time) ||
    !Array.isArray(weather_code) ||
    !Array.isArray(temperature_2m_max) ||
    !Array.isArray(temperature_2m_min)
  ) {
    return false;
  }

  if (
    time.length !== FORECAST_DAYS ||
    weather_code.length !== FORECAST_DAYS ||
    temperature_2m_max.length !== FORECAST_DAYS ||
    temperature_2m_min.length !== FORECAST_DAYS
  ) {
    return false;
  }

  if (
    !time.every((date): date is string => typeof date === 'string') ||
    !weather_code.every(isFiniteNumber) ||
    !temperature_2m_max.every(isFiniteNumber) ||
    !temperature_2m_min.every(isFiniteNumber)
  ) {
    return false;
  }

  return time.every(
    (date, index) =>
      isValidIsoDate(date) &&
      (index === 0 ||
        Date.parse(`${date}T00:00:00Z`) - Date.parse(`${time[index - 1]}T00:00:00Z`) ===
          86_400_000) &&
      Number.isFinite(weather_code[index]) &&
      Number.isFinite(temperature_2m_max[index]) &&
      Number.isFinite(temperature_2m_min[index]),
  );
}

function mapCurrent(current: ValidCurrentResponse): CurrentWeather {
  return {
    temperatureCelsius: current.temperature_2m,
    apparentTemperatureCelsius: finiteOrUndefined(current.apparent_temperature),
    weatherCode: current.weather_code,
    condition: getWeatherCodeInfo(current.weather_code).condition,
    measuredAt: current.time,
    isDay: isFiniteNumber(current.is_day) ? current.is_day === 1 : undefined,
    humidity: finiteOrUndefined(current.relative_humidity_2m),
    windSpeed: finiteOrUndefined(current.wind_speed_10m),
    precipitation: finiteOrUndefined(current.precipitation),
    pressure: finiteOrUndefined(current.surface_pressure),
  };
}

function mapForecast(daily: ValidDailyResponse): ForecastDay[] {
  const dates = daily.time as string[];

  return dates.map((date, index) => ({
    date,
    weatherCode: daily.weather_code[index],
    condition: getWeatherCodeInfo(daily.weather_code[index]).condition,
    minCelsius: daily.temperature_2m_min[index],
    maxCelsius: daily.temperature_2m_max[index],
    precipitationProbability: finiteOrUndefined(daily.precipitation_probability?.[index]) ?? 0,
  }));
}

export async function getWeather(city: City, signal?: AbortSignal): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: 'auto',
    forecast_days: String(FORECAST_DAYS),
    temperature_unit: 'celsius',
    current:
      'temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
  });

  const response = await fetchWithTimeout(`${FORECAST_URL}?${params.toString()}`, signal);

  if (!response.ok) {
    throw getHttpError(response);
  }

  let data: ForecastResponse;
  try {
    data = (await response.json()) as ForecastResponse;
  } catch {
    throw new WeatherServiceError('Nao foi possivel carregar os dados.', 'invalid-response');
  }

  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.timezone !== 'string' ||
    data.timezone.trim().length === 0
  ) {
    throw new WeatherServiceError('Nao foi possivel carregar os dados.', 'invalid-response');
  }

  const validCurrent = data.current && isValidCurrent(data.current) ? data.current : null;
  const validForecast = data.daily && isValidDaily(data.daily) ? data.daily : null;

  if (!validCurrent && !validForecast) {
    throw new WeatherServiceError('Nao foi possivel carregar os dados.', 'invalid-response');
  }

  return {
    city: { ...city, timezone: data.timezone },
    current: validCurrent ? mapCurrent(validCurrent) : null,
    forecast: validForecast ? mapForecast(validForecast) : [],
    currentStatus: validCurrent ? 'success' : 'incomplete',
    forecastStatus: validForecast ? 'success' : 'incomplete',
  };
}
