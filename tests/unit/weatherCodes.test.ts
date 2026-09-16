import { getWeatherCodeInfo } from '../../src/lib/weatherCodes';

describe('getWeatherCodeInfo', () => {
  it('returns the condition and icon for a known weather code', () => {
    expect(getWeatherCodeInfo(0)).toEqual({
      condition: 'Céu limpo',
      icon: '☀️',
    });
  });

  it('returns fallback values for an unknown weather code', () => {
    expect(getWeatherCodeInfo(999)).toEqual({
      condition: 'Condição indisponível',
      icon: '🌡️',
    });
  });
});
