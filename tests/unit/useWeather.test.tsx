import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherRequestAborted: class WeatherRequestAborted extends Error {},
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const mockedSearchCities = vi.mocked(searchCities);
const mockedGetWeather = vi.mocked(getWeather);

const city: City = {
  id: 1,
  name: 'Sao Paulo',
  country: 'Brasil',
  latitude: -23.55,
  longitude: -46.63,
  timezone: 'America/Sao_Paulo',
};

function WeatherHookProbe() {
  const { error, retry, search, status } = useWeather();

  return (
    <div>
      <output>{status}</output>
      <p>{error}</p>
      <button type="button" onClick={() => search('Sao Paulo')}>
        Buscar
      </button>
      <button type="button" onClick={retry}>
        Tentar novamente
      </button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWeather', () => {
  it('retries the last search after a network failure', async () => {
    mockedSearchCities
      .mockRejectedValueOnce(new WeatherServiceError('Nao foi possivel conectar ao servico.'))
      .mockResolvedValueOnce([city]);
    mockedGetWeather.mockRejectedValueOnce(
      new WeatherServiceError('Nao foi possivel conectar ao servico.'),
    );

    const user = userEvent.setup();
    render(<WeatherHookProbe />);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('Nao foi possivel conectar ao servico.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(mockedSearchCities).toHaveBeenCalledTimes(2);
    expect(mockedSearchCities).toHaveBeenLastCalledWith('Sao Paulo', expect.any(AbortSignal));
    expect(await screen.findByText('error')).toBeInTheDocument();
  });
});
