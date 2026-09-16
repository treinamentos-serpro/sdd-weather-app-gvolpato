import {
  convertTemperature,
  formatTemperature,
  toFahrenheit,
  unitLabel,
} from '../../src/lib/temperature';

describe('temperature utilities', () => {
  describe('toFahrenheit', () => {
    it.each([
      [0, 32],
      [100, 212],
      [-40, -40],
    ])('converts %d°C to %d°F', (celsius, fahrenheit) => {
      expect(toFahrenheit(celsius)).toBe(fahrenheit);
    });

    it.each([
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ])('rejects non-finite values: %s', (celsius) => {
      expect(() => toFahrenheit(celsius)).toThrow(RangeError);
    });
  });

  describe('convertTemperature', () => {
    it('keeps Celsius values when Celsius is selected', () => {
      expect(convertTemperature(25, 'celsius')).toBe(25);
    });

    it('converts Celsius values to Fahrenheit when Fahrenheit is selected', () => {
      expect(convertTemperature(25, 'fahrenheit')).toBe(77);
    });
  });

  describe('formatTemperature', () => {
    it('rounds the value and adds the Celsius symbol', () => {
      expect(formatTemperature(21.6, 'celsius')).toBe('22°C');
    });

    it('rounds the converted value and adds the Fahrenheit symbol', () => {
      expect(formatTemperature(21.6, 'fahrenheit')).toBe('71°F');
    });

    it('rounds negative Fahrenheit values consistently', () => {
      expect(formatTemperature(-18, 'fahrenheit')).toBe('0°F');
    });
  });

  describe('unitLabel', () => {
    it('returns the Celsius symbol', () => {
      expect(unitLabel('celsius')).toBe('°C');
    });

    it('returns the Fahrenheit symbol', () => {
      expect(unitLabel('fahrenheit')).toBe('°F');
    });
  });
});
