import { formatDayLabel, getShortDate } from '../../src/lib/format';

describe('date formatting utilities', () => {
  describe('formatDayLabel', () => {
    const date = '2026-09-16';

    it('labels the first forecast day as Hoje', () => {
      expect(formatDayLabel(0, date)).toBe('Hoje');
    });

    it('labels the second forecast day as Amanhã', () => {
      expect(formatDayLabel(1, date)).toBe('Amanhã');
    });

    it('formats later forecast days as a weekday', () => {
      expect(formatDayLabel(2, date)).toBe('Qua');
    });
  });

  describe('getShortDate', () => {
    it('formats an ISO date as day and month', () => {
      expect(getShortDate('2026-09-16')).toBe('16/09');
    });
  });
});
