import type { Unit } from '../types/weather';

export function toFahrenheit(valueCelsius: number): number {
  if (!Number.isFinite(valueCelsius)) {
    throw new RangeError('A temperatura deve ser um número finito.');
  }

  return (valueCelsius * 9) / 5 + 32;
}

export function convertTemperature(valueCelsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? toFahrenheit(valueCelsius) : valueCelsius;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatTemperature(valueCelsius: number, unit: Unit): string {
  return `${Math.round(convertTemperature(valueCelsius, unit))}${unitLabel(unit)}`;
}
