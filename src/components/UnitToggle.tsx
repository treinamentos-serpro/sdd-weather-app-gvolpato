import type { KeyboardEvent } from 'react';
import { useRef } from 'react';
import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

const units: Array<{ value: Unit; label: string; ariaLabel: string }> = [
  { value: 'celsius', label: '°C', ariaLabel: 'Celsius' },
  { value: 'fahrenheit', label: '°F', ariaLabel: 'Fahrenheit' },
];

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % units.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + units.length) % units.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = units.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-md"
    >
      {units.map((option, index) => (
        <button
          key={option.value}
          ref={(element) => {
            buttonRefs.current[index] = element;
          }}
          type="button"
          aria-label={option.ariaLabel}
          aria-pressed={unit === option.value}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent-400 ${
            unit === option.value
              ? 'bg-accent-500 text-white'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
