import { format } from 'date-fns';

export function formatDateRange(startDate: Date, endDate: Date): string {
  const formatString = 'dd/MM/yy';
  const formattedStart = format(startDate, formatString);
  const formattedEnd = format(endDate, formatString);
  return `${formattedStart} - ${formattedEnd}`;
}

export function formatSingleDate(date: Date): string {
  return format(date, 'dd/MM/yy');
}

