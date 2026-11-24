export function normalizeDatabaseTimestamp(value: Date | string | undefined): Date {
  const date = value instanceof Date ? value : new Date(value ?? Number.NaN);
  if (Number.isNaN(date.getTime())) throw new Error("Postgres devolvió una fecha inválida");
  return date;
}
