import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import ForecastCard from '../../src/components/ForecastCard';
import SearchBar from '../../src/components/SearchBar';
import UnitToggle from '../../src/components/UnitToggle';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'Sao Paulo',
  country: 'Brasil',
  latitude: -23.55,
  longitude: -46.63,
  timezone: 'America/Sao_Paulo',
};

const current: CurrentWeatherData = {
  temperatureCelsius: 0,
  weatherCode: 0,
  condition: 'Céu limpo',
  measuredAt: '2026-09-16T14:00',
};

describe('SearchBar', () => {
  it('keeps the search disabled for an empty input', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
  });

  it('keeps the search disabled for an input containing only spaces', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Nome da cidade'), '   ');

    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('calls onSearch with the trimmed city value', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Nome da cidade'), ' Sao Paulo ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledWith('Sao Paulo');
  });

  it('accepts accents, punctuation, hyphens and emoji in a valid search', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Nome da cidade'), ' São-Paulo, SP 😀 ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledWith('São-Paulo, SP 😀');
  });
});

function WeatherWithUnitToggle() {
  const [unit, setUnit] = useState<Unit>('celsius');

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={city} current={current} unit={unit} />
    </>
  );
}

describe('unit conversion in weather components', () => {
  it('shows 32°F after clicking the Fahrenheit unit', async () => {
    const user = userEvent.setup();
    render(<WeatherWithUnitToggle />);

    expect(screen.getByText('0°C')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(screen.getByText('32°F')).toBeInTheDocument();
  });
});

describe('safe rendering of incomplete weather values', () => {
  it('shows a dash instead of NaN for invalid current metrics', () => {
    render(
      <CurrentWeather
        city={city}
        current={{ ...current, temperatureCelsius: Number.NaN, humidity: Number.NaN }}
        unit="celsius"
      />,
    );

    expect(screen.getAllByText('—')).toHaveLength(5);
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
  });

  it('shows dashes instead of undefined values in a forecast card', () => {
    render(
      <ForecastCard
        index={0}
        timezone="America/Sao_Paulo"
        day={{
          date: '2026-09-16',
          weatherCode: 0,
          condition: 'Ceu limpo',
          minCelsius: Number.NaN,
          maxCelsius: Number.NaN,
          precipitationProbability: undefined,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
  });
});
