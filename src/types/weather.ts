export type Unit = 'celsius' | 'fahrenheit';

export type WeatherBlockStatus = 'idle' | 'loading' | 'success' | 'incomplete' | 'error';

export interface City {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperatureCelsius: number;
  apparentTemperatureCelsius?: number;
  weatherCode: number;
  condition: string;
  measuredAt: string;
  isDay?: boolean;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  pressure?: number;
}

export interface ForecastDay {
  date: string;
  weatherCode: number;
  condition: string;
  minCelsius: number;
  maxCelsius: number;
  precipitationProbability?: number;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather | null;
  forecast: ForecastDay[];
  currentStatus: WeatherBlockStatus;
  forecastStatus: WeatherBlockStatus;
}

export const mockWeatherData: WeatherData = {
  city: {
    id: 3451190,
    name: 'Sao Paulo',
    country: 'Brasil',
    admin1: 'Sao Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    timezone: 'America/Sao_Paulo',
  },
  current: {
    temperatureCelsius: 24,
    apparentTemperatureCelsius: 25.2,
    weatherCode: 2,
    condition: 'Parcialmente nublado',
    measuredAt: '2026-09-16T14:00',
    isDay: true,
  },
  forecast: [
    {
      date: '2026-09-16',
      weatherCode: 2,
      condition: 'Parcialmente nublado',
      minCelsius: 17,
      maxCelsius: 25,
      precipitationProbability: 20,
    },
    {
      date: '2026-09-17',
      weatherCode: 61,
      condition: 'Chuva',
      minCelsius: 16,
      maxCelsius: 22,
      precipitationProbability: 90,
    },
    {
      date: '2026-09-18',
      weatherCode: 3,
      condition: 'Nublado',
      minCelsius: 15,
      maxCelsius: 23,
      precipitationProbability: 60,
    },
    {
      date: '2026-09-19',
      weatherCode: 0,
      condition: 'Ceu limpo',
      minCelsius: 14,
      maxCelsius: 26,
      precipitationProbability: 0,
    },
    {
      date: '2026-09-20',
      weatherCode: 80,
      condition: 'Pancadas de chuva',
      minCelsius: 18,
      maxCelsius: 24,
      precipitationProbability: 70,
    },
  ],
  currentStatus: 'success',
  forecastStatus: 'success',
};
