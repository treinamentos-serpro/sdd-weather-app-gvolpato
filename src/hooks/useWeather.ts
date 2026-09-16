import { useRef, useState } from 'react';
import {
  getWeather,
  searchCities,
  WeatherRequestAborted,
  WeatherServiceError,
} from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherHookStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface UseWeatherResult {
  status: WeatherHookStatus;
  data: WeatherData | null;
  cities: City[];
  error: string;
  query: string;
  search: (name: string) => void;
  selectCity: (city: City) => void;
  retry: () => void;
}

type LastOperation = { type: 'search'; name: string } | { type: 'selectCity'; city: City } | null;

export function useWeather(): UseWeatherResult {
  const [status, setStatus] = useState<WeatherHookStatus>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const lastOperationRef = useRef<LastOperation>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const startRequest = () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    requestIdRef.current += 1;
    setError('');
    setData(null);
    setCities([]);

    return { controller, requestId: requestIdRef.current };
  };

  const isCurrentRequest = (requestId: number) => requestIdRef.current === requestId;

  const handleError = (error: unknown, requestId: number) => {
    if (!isCurrentRequest(requestId) || error instanceof WeatherRequestAborted) {
      return;
    }

    setError(
      error instanceof WeatherServiceError
        ? error.message
        : 'Nao foi possivel conectar ao servico.',
    );
    setStatus('error');
    controllerRef.current = null;
  };

  const loadWeather = async (city: City, requestId: number, signal: AbortSignal) => {
    try {
      const weatherData = await getWeather(city, signal);
      if (!isCurrentRequest(requestId)) {
        return;
      }

      setData(weatherData);
      setStatus('success');
      controllerRef.current = null;
    } catch (err) {
      handleError(err, requestId);
    }
  };

  const search = (name: string) => {
    setQuery(name);
    lastOperationRef.current = { type: 'search', name };
    const { controller, requestId } = startRequest();
    setStatus('loading');

    void (async () => {
      try {
        const results = await searchCities(name, controller.signal);
        if (!isCurrentRequest(requestId)) {
          return;
        }

        setCities(results);
        if (results.length === 0) {
          setStatus('empty');
          controllerRef.current = null;
          return;
        }

        controllerRef.current = null;
        setStatus('success');
      } catch (err) {
        handleError(err, requestId);
      }
    })();
  };

  const selectCity = (city: City) => {
    lastOperationRef.current = { type: 'selectCity', city };
    const { controller, requestId } = startRequest();
    setStatus('loading');
    void loadWeather(city, requestId, controller.signal);
  };

  const retry = () => {
    const lastOperation = lastOperationRef.current;

    if (!lastOperation) {
      return;
    }

    if (lastOperation.type === 'search') {
      search(lastOperation.name);
    } else {
      selectCity(lastOperation.city);
    }
  };

  return { status, data, cities, error, query, search, selectCity, retry };
}
