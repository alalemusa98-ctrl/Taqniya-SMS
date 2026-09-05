/**
 * دالة تنسيق التواريخ لضمان ظهور الأرقام اللاتينية (Western Arabic Digits: 1, 2, 3...)
 * بدلاً من الأرقام الهندية/المشرقية (١، ٢، ٣...)
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // YYYY-MM-DD
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  const datePart = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  return `${datePart} ${timePart}`;
}

export function formatTime(dateString?: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
