import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getWeather,
  searchCities,
  WeatherRequestAborted,
  WeatherServiceError,
} from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'Sao Paulo',
  country: 'Brasil',
  admin1: 'Sao Paulo',
  latitude: -23.55,
  longitude: -46.63,
  timezone: 'America/Sao_Paulo',
};

const current = {
  time: '2026-09-16T14:00',
  temperature_2m: 24,
  apparent_temperature: 25,
  weather_code: 2,
  is_day: 1,
  relative_humidity_2m: 68,
  wind_speed_10m: 14.4,
  precipitation: 0.2,
  surface_pressure: 1012.8,
};

const daily = {
  time: ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'],
  weather_code: [2, 61, 3, 0, 80],
  temperature_2m_max: [25, 22, 23, 26, 24],
  temperature_2m_min: [17, 16, 15, 14, 18],
  precipitation_probability: [null, 90, 60, 0, 70],
};

const timezone = 'America/Sao_Paulo';

function stubFetchJson(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('searchCities', () => {
  it('returns an empty list without calling fetch for empty input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('trims a search containing only spaces without calling fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('\t  \n')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps geocoding results to cities', async () => {
    stubFetchJson({
      results: [
        {
          id: 1,
          name: 'Sao Paulo',
          country: 'Brasil',
          admin1: 'Sao Paulo',
          latitude: -23.55,
          longitude: -46.63,
          timezone: 'America/Sao_Paulo',
        },
      ],
    });

    await expect(searchCities(' Sao Paulo ')).resolves.toEqual([city]);
  });

  it('encodes special characters in the geocoding query', async () => {
    const fetchMock = stubFetchJson({ results: [] });

    await searchCities('São-Paulo, SP 😀');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('name=S%C3%A3o-Paulo%2C%20SP%20%F0%9F%98%80'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('returns an empty list when the response has no results', async () => {
    stubFetchJson({ results: [] });

    await expect(searchCities('Sao Paulo')).resolves.toEqual([]);
  });

  it('discards results without valid coordinates', async () => {
    stubFetchJson({
      results: [
        {
          id: 2,
          name: 'Cidade inválida',
          latitude: Number.NaN,
          longitude: -46.63,
          timezone: 'America/Sao_Paulo',
        },
      ],
    });

    await expect(searchCities('Sao Paulo')).resolves.toEqual([]);
  });

  it('throws WeatherServiceError when the response is not ok', async () => {
    stubFetchJson({}, false);

    await expect(searchCities('Sao Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('throws WeatherServiceError when the network request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failure')));

    await expect(searchCities('Sao Paulo')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'network',
      message: 'Nao foi possivel conectar ao servico.',
    });
  });

  it('returns a friendly message when the service is rate limited', async () => {
    stubFetchJson({}, false).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: vi.fn(),
    });

    await expect(searchCities('Sao Paulo')).rejects.toMatchObject({
      code: 'rate-limit',
      message: 'O servico esta temporariamente indisponivel. Tente novamente.',
    });
  });

  it('throws WeatherServiceError when the response contains invalid JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError('invalid JSON')),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('Sao Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
  });
});

describe('getWeather', () => {
  it('maps current weather and five forecast days', async () => {
    stubFetchJson({ timezone, current, daily });

    const weather = await getWeather(city);

    expect(weather.current).toMatchObject({
      temperatureCelsius: 24,
      apparentTemperatureCelsius: 25,
      weatherCode: 2,
      condition: 'Parcialmente nublado',
      measuredAt: '2026-09-16T14:00',
      isDay: true,
      humidity: 68,
      windSpeed: 14.4,
      precipitation: 0.2,
      pressure: 1012.8,
    });
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast[1]).toMatchObject({
      date: '2026-09-17',
      weatherCode: 61,
      minCelsius: 16,
      maxCelsius: 22,
      precipitationProbability: 90,
    });
  });

  it('maps null precipitation probability to zero', async () => {
    stubFetchJson({ timezone, current, daily });

    const weather = await getWeather(city);

    expect(weather.forecast[0].precipitationProbability).toBe(0);
  });

  it('uses safe defaults when optional response fields are absent or null', async () => {
    const currentWithoutOptionalFields = {
      ...current,
      apparent_temperature: null,
      is_day: null,
    };
    const dailyWithoutPrecipitation = { ...daily, precipitation_probability: null };
    stubFetchJson({
      timezone,
      current: currentWithoutOptionalFields,
      daily: dailyWithoutPrecipitation,
    });

    const weather = await getWeather(city);

    expect(weather.current).toMatchObject({
      apparentTemperatureCelsius: undefined,
      isDay: undefined,
    });
    expect(weather.forecast.every((day) => day.precipitationProbability === 0)).toBe(true);
  });

  it('throws WeatherServiceError when the forecast response is not ok', async () => {
    stubFetchJson({}, false);

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('throws WeatherServiceError when the forecast request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failure')));

    await expect(getWeather(city)).rejects.toMatchObject({
      code: 'network',
      message: 'Nao foi possivel conectar ao servico.',
    });
  });

  it('throws WeatherServiceError when the forecast JSON is invalid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError('invalid JSON')),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('throws WeatherServiceError when the forecast request times out', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );

    const weatherPromise = getWeather(city);
    const timeoutError = expect(weatherPromise).rejects.toMatchObject({
      code: 'timeout',
      message: 'Nao foi possivel conectar ao servico.',
    });
    await vi.advanceTimersByTimeAsync(10_000);

    await timeoutError;
  });

  it('does not turn an intentional abort into a user-facing error', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));

    await expect(searchCities('Sao Paulo', controller.signal)).rejects.toBeInstanceOf(
      WeatherRequestAborted,
    );
  });

  it('marks current weather incomplete when a required field is missing', async () => {
    const incompleteCurrent = { ...current };
    delete (incompleteCurrent as Partial<typeof current>).time;
    stubFetchJson({ timezone, current: incompleteCurrent, daily });

    await expect(getWeather(city)).resolves.toMatchObject({
      current: null,
      currentStatus: 'incomplete',
      forecastStatus: 'success',
    });
  });

  it('marks the forecast incomplete when a daily array has fewer than five entries', async () => {
    stubFetchJson({
      timezone,
      current,
      daily: { ...daily, temperature_2m_min: daily.temperature_2m_min.slice(0, 4) },
    });

    await expect(getWeather(city)).resolves.toMatchObject({
      currentStatus: 'success',
      forecast: [],
      forecastStatus: 'incomplete',
    });
  });

  it('marks the forecast incomplete when a daily date is not consecutive', async () => {
    stubFetchJson({
      timezone,
      current,
      daily: {
        ...daily,
        time: ['2026-09-16', '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21'],
      },
    });

    await expect(getWeather(city)).resolves.toMatchObject({ forecastStatus: 'incomplete' });
  });

  it('marks current weather incomplete when a temperature is not finite', async () => {
    stubFetchJson({ timezone, current: { ...current, temperature_2m: Number.NaN }, daily });

    await expect(getWeather(city)).resolves.toMatchObject({
      current: null,
      currentStatus: 'incomplete',
    });
  });

  it.each([
    ['current', { daily }],
    ['daily', { current }],
  ])('throws WeatherServiceError when %s is absent', async (_missing, body) => {
    stubFetchJson(body);

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });
});
