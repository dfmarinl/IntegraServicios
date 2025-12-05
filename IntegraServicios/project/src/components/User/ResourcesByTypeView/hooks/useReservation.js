import { useState } from "react";
import { createReservationApi } from "../../../../api/Reservation/Reservation";
import { useNavigate } from "react-router-dom";

export const useReservation = () => {
  const [reserving, setReserving] = useState(null);
  const navigate = useNavigate();

  const createQuickReservation = async (resourceId, resourceType) => {
    try {
      setReserving(resourceId);
      
      const reservationData = {
        resourceId: resourceId, // Asegúrate de que sea un número, no un objeto
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        purpose: `Reserva de ${resourceType?.name || 'recurso'}`,
        attendees: 1,
        isRepetitive: false
      };

      const result = await createReservationApi(reservationData);
      return { success: true, data: result };
      
    } catch (err) {
      console.error("Error al crear reserva:", err);
      return { success: false, error: err.message };
    } finally {
      setReserving(null);
    }
  };

  // NUEVA FUNCIÓN para crear reserva desde el calendario
  const createReservationFromCalendar = async (reservationData) => {
    try {
      setReserving(reservationData.resourceId);
      
      // Validar que resourceId sea un número
      const validatedData = {
        ...reservationData,
        resourceId: parseInt(reservationData.resourceId),
        attendees: parseInt(reservationData.attendees) || 1
      };

      const result = await createReservationApi(validatedData);
      return { success: true, data: result };
      
    } catch (err) {
      console.error("Error al crear reserva desde calendario:", err);
      return { success: false, error: err.message };
    } finally {
      setReserving(null);
    }
  };

  const navigateToAdvancedReservation = (resourceId, resourceType, unit) => {
    navigate(`/app/reservations/new`, { 
      state: { 
        resourceId: resourceId,
        resourceType: resourceType,
        unit: unit
      } 
    });
  };

  return {
    reserving,
    createQuickReservation,
    createReservationFromCalendar, // Nueva función
    navigateToAdvancedReservation
  };
};