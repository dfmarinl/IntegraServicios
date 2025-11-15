import { mockReservations } from './mockData';

const USE_MOCK = true;

let mockReservationsData = [...mockReservations];

export const getReservations = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = [...mockReservationsData];

    if (filters.userId) {
      filtered = filtered.filter(r => r.userId === filters.userId);
    }
    if (filters.resourceId) {
      filtered = filtered.filter(r => r.resourceId === filters.resourceId);
    }
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(r => r.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => r.date <= filters.dateTo);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { data: filtered, success: true };
  }

  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/reservations?${queryParams}`);
  return await response.json();
};

export const getReservationById = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const reservation = mockReservationsData.find(r => r.id === id);
    return { data: reservation, success: !!reservation };
  }

  const response = await fetch(`/api/reservations/${id}`);
  return await response.json();
};

export const createReservation = async (reservationData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));

    const hasConflict = mockReservationsData.some(r =>
      r.resourceId === reservationData.resourceId &&
      r.date === reservationData.date &&
      r.status !== 'cancelled' &&
      (
        (reservationData.startTime >= r.startTime && reservationData.startTime < r.endTime) ||
        (reservationData.endTime > r.startTime && reservationData.endTime <= r.endTime)
      )
    );

    if (hasConflict) {
      return { success: false, message: 'El recurso ya está reservado en ese horario' };
    }

    const newReservation = {
      ...reservationData,
      id: String(Date.now()),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    mockReservationsData.push(newReservation);
    return { data: newReservation, success: true, message: 'Reserva creada exitosamente' };
  }

  const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservationData),
  });
  return await response.json();
};

export const createRecurringReservations = async (reservationData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 600));

    const { startDate, endDate, frequency, ...baseData } = reservationData;
    const createdReservations = [];
    const dates = [];

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + frequency)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }

    for (const date of dates) {
      const hasConflict = mockReservationsData.some(r =>
        r.resourceId === baseData.resourceId &&
        r.date === date &&
        r.status !== 'cancelled' &&
        (
          (baseData.startTime >= r.startTime && baseData.startTime < r.endTime) ||
          (baseData.endTime > r.startTime && baseData.endTime <= r.endTime)
        )
      );

      if (!hasConflict) {
        const newReservation = {
          ...baseData,
          date,
          id: String(Date.now() + Math.random()),
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        };
        mockReservationsData.push(newReservation);
        createdReservations.push(newReservation);
      }
    }

    return {
      data: createdReservations,
      success: true,
      message: `Se crearon ${createdReservations.length} de ${dates.length} reservas`,
    };
  }

  const response = await fetch('/api/reservations/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservationData),
  });
  return await response.json();
};

export const cancelReservation = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockReservationsData.findIndex(r => r.id === id);

    if (index !== -1) {
      const reservation = mockReservationsData[index];
      const reservationDateTime = new Date(`${reservation.date}T${reservation.startTime}`);

      if (reservationDateTime <= new Date()) {
        return { success: false, message: 'No se puede cancelar una reserva pasada o en curso' };
      }

      mockReservationsData[index].status = 'cancelled';
      return { data: mockReservationsData[index], success: true, message: 'Reserva cancelada exitosamente' };
    }

    return { success: false, message: 'Reserva no encontrada' };
  }

  const response = await fetch(`/api/reservations/${id}/cancel`, {
    method: 'PUT',
  });
  return await response.json();
};

export const rateReservation = async (id, rating, comment) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockReservationsData.findIndex(r => r.id === id);

    if (index !== -1) {
      mockReservationsData[index].rating = rating;
      mockReservationsData[index].comment = comment;
      return { data: mockReservationsData[index], success: true, message: 'Calificación registrada' };
    }

    return { success: false, message: 'Reserva no encontrada' };
  }

  const response = await fetch(`/api/reservations/${id}/rate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, comment }),
  });
  return await response.json();
};
