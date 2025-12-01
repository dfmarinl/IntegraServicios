import { useState } from "react";
import { 
  checkResourceAvailabilityApi, 
  getAvailableSlotsApi 
} from "../../../../api/Reservation/Reservation";

export const useResourceAvailability = () => {
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Función para obtener los slots disponibles para un recurso en una fecha específica
  const getAvailableSlots = async (resourceId, date) => {
    try {
      setLoadingSlots(true);
      console.log('🔍 Hook: Obteniendo slots para:', { resourceId, date });
      
      const result = await getAvailableSlotsApi(resourceId, date);
      
      console.log('✅ Hook: Slots recibidos:', result);
      
      // Estructura esperada del resultado:
      // {
      //   resourceId: "123",
      //   date: "2024-01-15",
      //   availableSlots: [
      //     {
      //       startTime: "2024-01-15T09:00:00Z",
      //       endTime: "2024-01-15T09:30:00Z",
      //       startTimeFormatted: "09:00",
      //       endTimeFormatted: "09:30",
      //       isAvailable: true
      //     },
      //     // ... más slots
      //   ]
      // }
      
      if (result && result.availableSlots) {
        setAvailableSlots(result.availableSlots);
        return result.availableSlots;
      } else {
        console.warn('⚠️ Hook: No se recibieron slots disponibles', result);
        setAvailableSlots([]);
        return [];
      }
      
    } catch (error) {
      console.error('❌ Hook: Error obteniendo slots:', error);
      setAvailableSlots([]);
      throw error; // Re-lanzar el error para manejarlo en el componente
    } finally {
      setLoadingSlots(false);
    }
  };

  const checkAvailability = async (resourceId, startDateTime, endDateTime) => {
    try {
      setCheckingAvailability(true);
      const result = await checkResourceAvailabilityApi(resourceId, startDateTime, endDateTime);
      setAvailabilityResult(result);
      return result;
    } catch (error) {
      console.error("Error checking availability:", error);
      const errorResult = { 
        isAvailable: false, 
        message: error.message || "Error al verificar disponibilidad" 
      };
      setAvailabilityResult(errorResult);
      return errorResult;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const clearAvailabilityResult = () => {
    setAvailabilityResult(null);
  };

  // Función para limpiar los slots disponibles
  const clearAvailableSlots = () => {
    setAvailableSlots([]);
  };

  return {
    // Estados
    checkingAvailability,
    availabilityResult,
    availableSlots,
    loadingSlots,
    
    // Funciones
    checkAvailability,
    getAvailableSlots,
    clearAvailabilityResult,
    clearAvailableSlots
  };
};