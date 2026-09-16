const dayLabelFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
});

/** Rótulo curto do dia da semana (ex.: "seg", "ter") a partir de uma data ISO. */
export function formatDayLabel(index: number, isoDate: string, timeZone?: string): string;
export function formatDayLabel(isoDate: string, timeZone?: string): string;
export function formatDayLabel(
  indexOrIsoDate: number | string,
  isoDateOrTimeZone?: string,
  timeZone?: string,
): string {
  const isoDate = typeof indexOrIsoDate === 'string' ? indexOrIsoDate : isoDateOrTimeZone;
  const resolvedTimeZone = typeof indexOrIsoDate === 'number' ? timeZone : isoDateOrTimeZone;

  if (typeof indexOrIsoDate === 'number') {
    if (indexOrIsoDate === 0) return 'Hoje';
    if (indexOrIsoDate === 1) return 'Amanhã';
  }

  const date = new Date(`${isoDate}T12:00:00Z`);
  const formatter = resolvedTimeZone
    ? new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: resolvedTimeZone })
    : dayLabelFormatter;
  const label = formatter.format(date).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getShortDate(isoDate: string, timeZone?: string): string {
  const formatter = timeZone
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone })
    : shortDateFormatter;
  return formatter.format(new Date(`${isoDate}T12:00:00Z`));
}

export function formatLocalDateTime(isoDateTime: string, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(isoDateTime));
}
