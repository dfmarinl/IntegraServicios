export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidTime = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const isTimeAfter = (time1, time2) => {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return h1 * 60 + m1 > h2 * 60 + m2;
};

export const hasTimeOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

export const isWithinGlobalTime = (time, globalStart, globalEnd) => {
  const [h, m] = time.split(':').map(Number);
  const [gh1, gm1] = globalStart.split(':').map(Number);
  const [gh2, gm2] = globalEnd.split(':').map(Number);

  const timeMinutes = h * 60 + m;
  const globalStartMinutes = gh1 * 60 + gm1;
  const globalEndMinutes = gh2 * 60 + gm2;

  return timeMinutes >= globalStartMinutes && timeMinutes <= globalEndMinutes;
};

export const isFutureDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  return checkDate >= today;
};

export const isFutureDateTime = (date, time) => {
  const now = new Date();
  const checkDateTime = new Date(`${date}T${time}`);
  return checkDateTime > now;
};

export const validateRequired = (value, message = 'Este campo es requerido') => {
  return value ? '' : message;
};

export const validateEmail = (email) => {
  if (!email) return 'El correo es requerido';
  if (!isValidEmail(email)) return 'Correo inválido';
  return '';
};

export const validateTime = (time) => {
  if (!time) return 'La hora es requerida';
  if (!isValidTime(time)) return 'Formato de hora inválido (HH:MM)';
  return '';
};

export const validateTimeRange = (startTime, endTime) => {
  const startError = validateTime(startTime);
  const endError = validateTime(endTime);

  if (startError) return startError;
  if (endError) return endError;
  if (!isTimeAfter(endTime, startTime)) {
    return 'La hora de fin debe ser posterior a la hora de inicio';
  }

  return '';
};
