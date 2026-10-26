export function formatRupiah(val: number | string | null | undefined): string {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatTanggal(val: string | Date | null | undefined): string {
  if (!val) return '-';
  const date = new Date(val);
  if (isNaN(date.getTime())) return String(val);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatAngka(val: number | string | null | undefined): string {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID').format(num);
}
