import { format, parseISO, differenceInMinutes, addDays, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, formatStr, { locale: es });
  } catch (error) {
    return date;
  }
};

export const formatDateTime = (dateTime, formatStr = 'dd/MM/yyyy HH:mm') => {
  if (!dateTime) return '';
  try {
    const parsedDate = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
    return format(parsedDate, formatStr, { locale: es });
  } catch (error) {
    return dateTime;
  }
};

export const calculateDuration = (startTime, endTime) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  return endMinutes - startMinutes;
};

export const addMinutesToTime = (time, minutes) => {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;

  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
};

export const getDatesBetween = (startDate, endDate, frequency = 1) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d = addDays(d, frequency)) {
    dates.push(format(d, 'yyyy-MM-dd'));
  }

  return dates;
};

export const isDateInRange = (date, startDate, endDate) => {
  const check = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return !isBefore(check, start) && !isAfter(check, end);
};

export const getTodayString = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getCurrentTimeString = () => {
  return format(new Date(), 'HH:mm');
};

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
