import "./ReservationActions.css";

const ReservationActions = ({ 
  resource, 
  resourceType, 
  unit,
  onQuickReserve, 
  onAdvancedReserve, 
  isReserving 
}) => {
  return (
    <div className="resource-actions">
      <button 
        className={`btn-reserve ${!resource.isAvailable ? 'btn-disabled' : ''}`}
        disabled={!resource.isAvailable || isReserving === resource.id}
        onClick={() => onQuickReserve(resource.id, resourceType)}
      >
        {isReserving === resource.id ? (
          <>
            <div className="reserve-spinner"></div>
            Reservando...
          </>
        ) : resource.isAvailable ? (
          'Reserva Rápida'
        ) : (
          'No disponible'
        )}
      </button>
      
      {resource.isAvailable && (
        <button 
          className="btn-reserve-advanced"
          onClick={() => onAdvancedReserve(resource.id, resourceType, unit)}
        >
          Reservar con Calendario
        </button>
      )}
    </div>
  );
};

export default ReservationActions;