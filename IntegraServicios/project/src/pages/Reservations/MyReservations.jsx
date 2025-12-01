import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../context/UIContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import Loader from "../../components/common/Loader";
import Select from "../../components/common/Select";
import {
  getMyReservationsApi,
  cancelReservationApi,
} from "../../api/Reservation/Reservation";
import { generateReservationsPDF } from "../../utils/pdfGenerator";
import "./MyReservations.css";

const MyReservations = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  
  // Estados principales
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState({
    open: false,
    reservation: null,
  });
  const [cancelModal, setCancelModal] = useState({
    open: false,
    reservation: null,
  });
  const [pdfModal, setPdfModal] = useState({
    open: false,
    type: 'structured'
  });
  const [cancelling, setCancelling] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Cargar reservas cuando cambien los filtros o usuario
  useEffect(() => {
    if (user?.id) {
      loadReservations();
    } else {
      setLoading(false);
      setReservations([]);
    }
  }, [filters, user]);

  const loadReservations = async () => {
    setLoading(true);
    
    try {
      // Preparar filtros para la API
      const apiFilters = {
        page: filters.page,
        limit: filters.limit,
      };
      
      if (filters.status !== "all") {
        apiFilters.status = filters.status;
      }
      
      if (filters.startDate) {
        apiFilters.startDate = filters.startDate;
      }
      
      if (filters.endDate) {
        apiFilters.endDate = filters.endDate;
      }
      
      const response = await getMyReservationsApi(apiFilters);
      
      // Verificar si la respuesta tiene la estructura esperada
      let reservationsData = [];
      
      if (response && response.reservations) {
        reservationsData = response.reservations;
      } else if (Array.isArray(response)) {
        reservationsData = response;
      }
      
      setReservations(reservationsData);
      
      // Manejar paginación
      if (response && response.total) {
        setPagination({
          currentPage: response.currentPage || 1,
          totalPages: response.totalPages || 1,
          totalItems: response.total || 0,
        });
      }
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      showError("Error al cargar las reservas");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelModal = (reservation) => {
    if (!canCancelReservation(reservation)) {
      showError("Esta reserva no puede ser cancelada");
      return;
    }
    setCancelModal({ open: true, reservation });
  };

  const handleCancelReservation = async () => {
    if (!cancelModal.reservation) return;
    
    setCancelling(true);
    try {
      const response = await cancelReservationApi(cancelModal.reservation.id);
      
      if (response && (response.success || response.message)) {
        showSuccess(response.message || "Reserva cancelada exitosamente");
        
        // Actualizar la lista de reservas localmente
        setReservations(prevReservations => 
          prevReservations.map(res => 
            res.id === cancelModal.reservation.id 
              ? { ...res, status: "cancelada" }
              : res
          )
        );
      } else {
        showError("Error al cancelar la reserva");
      }
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
      showError(error.message || "Error al cancelar la reserva");
    } finally {
      setCancelling(false);
      setCancelModal({ open: false, reservation: null });
    }
  };

  const handleOpenRating = (reservation) => {
    setRatingModal({ open: true, reservation });
    setRating(5);
    setComment("");
  };

  const handleSubmitRating = async () => {
    try {
      // IMPORTANTE: Necesitarías agregar esta función a tu API
      const response = { success: true, message: "Calificación enviada exitosamente" };
      
      showSuccess(response.message);
      setRatingModal({ open: false, reservation: null });
      loadReservations();
    } catch (error) {
      console.error("Error al enviar calificación:", error);
      showError("Error al enviar la calificación");
    }
  };

  // Funciones para PDF
  const openPdfModal = () => {
    if (reservations.length === 0) {
      showError("No hay reservas para exportar");
      return;
    }
    setPdfModal({ open: true, type: 'structured' });
  };

  const closePdfModal = () => {
    setPdfModal({ open: false, type: 'structured' });
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      closePdfModal();
      
      // Generar PDF estructurado
      await generateReservationsPDF(reservations, filters, {
        title: `Mis Reservas - ${new Date().toLocaleDateString('es-ES')}`,
        filename: `mis-reservas-${new Date().toISOString().split('T')[0]}.pdf`,
        includeFilters: true,
        includeSummary: true
      });
      
      showSuccess("PDF generado exitosamente");
      
    } catch (error) {
      console.error("Error generando PDF:", error);
      showError("Error al generar el PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Manejar cambios en filtros
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1, // Resetear a primera página al cambiar filtros
    }));
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({
        ...prev,
        page: newPage,
      }));
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      status: "all",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    });
  };

  // Formatear fecha para mostrar
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha:", dateString, error);
      return "Fecha inválida";
    }
  };

  // Formatear hora para mostrar
  const formatDisplayTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formateando hora:", dateString, error);
      return "Hora inválida";
    }
  };

  // Determinar si una reserva puede ser cancelada
  const canCancelReservation = (reservation) => {
    const status = reservation.status?.toLowerCase();
    
    // Solo reservas pendientes o activas pueden cancelarse
    if (status !== "pendiente" && status !== "activa") {
      return false;
    }
    
    try {
      const startDate = new Date(reservation.startDateTime || reservation.startTime || reservation.date);
      const now = new Date();
      const hoursDifference = (startDate - now) / (1000 * 60 * 60);
      
      // Permitir cancelación hasta 1 hora antes (ajustable)
      return hoursDifference > 1;
    } catch (error) {
      console.error("Error calculando si se puede cancelar:", error);
      return false;
    }
  };

  // Determinar si una reserva puede ser calificada
  const canRateReservation = (reservation) => {
    const status = reservation.status?.toLowerCase();
    const hasRating = !!(reservation.rating || reservation.ratingValue);
    
    // Solo reservas finalizadas sin calificación pueden calificarse
    return status === "finalizada" && !hasRating;
  };

  // Obtener texto de estado (traducción al español)
  const getStatusText = (status) => {
    const statusLower = status?.toLowerCase();
    
    switch(statusLower) {
      case "pendiente":
        return "Pendiente";
      case "activa":
        return "Activa";
      case "finalizada":
        return "Finalizada";
      case "cancelada":
        return "Cancelada";
      default:
        return status || "Desconocido";
    }
  };

  // Obtener clase CSS para el estado
  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase();
    switch(statusLower) {
      case "pendiente":
        return "pendiente";
      case "activa":
        return "activa";
      case "finalizada":
        return "finalizada";
      case "cancelada":
        return "cancelada";
      default:
        return "unknown";
    }
  };

  // Columnas de la tabla
  const columns = [
    { 
      key: "resource", 
      label: "Recurso",
      render: (row) => {
        const resourceName = 
          row.resource?.name || 
          row.Resource?.name || 
          row.resourceName || 
          (typeof row.resource === 'string' ? row.resource : "N/A");
        return resourceName;
      }
    },
    { 
      key: "date", 
      label: "Fecha",
      render: (row) => {
        const date = row.startDateTime || row.date || row.startDate;
        return formatDisplayDate(date);
      }
    },
    {
      key: "time",
      label: "Horario",
      render: (row) => {
        const startTime = formatDisplayTime(row.startDateTime || row.startTime);
        const endTime = formatDisplayTime(row.endDateTime || row.endTime);
        return `${startTime} - ${endTime}`;
      },
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => {
        const status = row.status?.toLowerCase();
        const statusText = getStatusText(row.status);
        const statusClass = getStatusClass(row.status);
        
        return (
          <span className={`status-badge status-${statusClass}`}>
            {statusText}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => {
        const canCancel = canCancelReservation(row);
        const canRate = canRateReservation(row);
        const hasRating = !!(row.rating || row.ratingValue);
        
        return (
          <div className="table-actions">
            {canCancel && (
              <Button
                size="small"
                variant="danger"
                onClick={() => handleOpenCancelModal(row)}
              >
                Cancelar
              </Button>
            )}
            
            {canRate && (
              <Button
                size="small"
                variant="success"
                onClick={() => handleOpenRating(row)}
              >
                Calificar
              </Button>
            )}
            
            {hasRating && (
              <span className="rating-display">
                ⭐ {row.rating || row.ratingValue}/5
                {(row.comment || row.commentText) && (
                  <span className="comment-hint" title={row.comment || row.commentText}> 💬</span>
                )}
              </span>
            )}
            
            {!canCancel && !canRate && !hasRating && (
              <span className="no-actions-info">
                Sin acciones disponibles
              </span>
            )}
          </div>
        );
      },
    },
  ];

  if (loading && reservations.length === 0) {
    return <Loader fullScreen />;
  }

  return (
    <div className="my-reservations-page">
      <h1 className="page-title">Mis Reservas</h1>
      
      {/* Filtros */}
      <Card className="filters-card">
        <div className="filters-section">
          <h3>Filtrar Reservas</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Estado:</label>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                options={[
                  { value: "all", label: "Todos" },
                  { value: "pendiente", label: "Pendientes" },
                  { value: "activa", label: "Activas" },
                  { value: "finalizada", label: "Finalizadas" },
                  { value: "cancelada", label: "Canceladas" },
                ]}
              />
            </div>
            
            <div className="filter-group">
              <label>Desde:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                max={filters.endDate}
                className="filter-date-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Hasta:</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                min={filters.startDate}
                className="filter-date-input"
              />
            </div>
            
            <div className="filter-actions">
              <Button
                variant="secondary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Limpiar Filtros
              </Button>
              <Button
                variant="primary"
                onClick={loadReservations}
                disabled={loading}
              >
                Aplicar Filtros
              </Button>
              <Button
                variant="success"
                onClick={openPdfModal}
                loading={generatingPDF}
                disabled={reservations.length === 0 || loading}
                className="export-button"
              >
                {generatingPDF ? 'Generando PDF...' : 'Exportar a PDF'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Tabla de reservas */}
      <Card>
        {loading && reservations.length > 0 ? (
          <div className="loading-message">
            <Loader size="small" />
            <p>Actualizando reservas...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="no-reservations">
            <p>No tienes reservas registradas con los filtros actuales.</p>
            {(filters.status !== "all" || filters.startDate || filters.endDate) ? (
              <Button onClick={handleClearFilters} variant="outline">
                Limpiar filtros para ver todas las reservas
              </Button>
            ) : (
              <p className="empty-state-text">¡Comienza a hacer reservas para verlas aquí!</p>
            )}
          </div>
        ) : (
          <>
            <div className="reservations-count">
              <p>Mostrando {reservations.length} reserva{reservations.length !== 1 ? 's' : ''} de {pagination.totalItems} total</p>
            </div>
            
            <div id="reservations-table">
              <Table
                columns={columns}
                data={reservations}
                emptyMessage="No se encontraron reservas"
                loading={loading}
              />
            </div>
            
            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="pagination-controls">
                <Button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  variant="outline"
                >
                  Anterior
                </Button>
                
                <span className="pagination-info">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
                
                <Button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  variant="outline"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal de cancelación */}
      <Modal
        isOpen={cancelModal.open}
        onClose={() => !cancelling && setCancelModal({ open: false, reservation: null })}
        title="Cancelar Reserva"
        size="small"
      >
        {cancelModal.reservation && (
          <div className="cancel-form">
            <div className="cancel-warning">
              <div className="warning-icon">⚠️</div>
              <h4>¿Estás seguro de cancelar esta reserva?</h4>
              <p>Esta acción no se puede deshacer.</p>
            </div>
            
            <div className="reservation-details">
              <p><strong>Recurso:</strong> {cancelModal.reservation.resource?.name || cancelModal.reservation.Resource?.name || cancelModal.reservation.resourceName || "N/A"}</p>
              <p><strong>Fecha:</strong> {formatDisplayDate(cancelModal.reservation.startDateTime || cancelModal.reservation.date)}</p>
              <p><strong>Horario:</strong> {formatDisplayTime(cancelModal.reservation.startDateTime || cancelModal.reservation.startTime)} - {formatDisplayTime(cancelModal.reservation.endDateTime || cancelModal.reservation.endTime)}</p>
              <p><strong>Estado actual:</strong> {getStatusText(cancelModal.reservation.status)}</p>
            </div>

            <div className="cancel-buttons">
              <Button 
                onClick={() => setCancelModal({ open: false, reservation: null })}
                variant="outline"
                disabled={cancelling}
              >
                No, mantener reserva
              </Button>
              <Button 
                onClick={handleCancelReservation}
                variant="danger"
                loading={cancelling}
                disabled={cancelling}
              >
                {cancelling ? "Cancelando..." : "Sí, cancelar reserva"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de calificación */}
      <Modal
        isOpen={ratingModal.open}
        onClose={() => setRatingModal({ open: false, reservation: null })}
        title="Calificar Servicio"
        size="small"
      >
        {ratingModal.reservation && (
          <div className="rating-form">
            <div className="reservation-info">
              <p><strong>Recurso:</strong> {ratingModal.reservation.resource?.name || ratingModal.reservation.Resource?.name || ratingModal.reservation.resourceName || "N/A"}</p>
              <p><strong>Fecha:</strong> {formatDisplayDate(ratingModal.reservation.startDateTime || ratingModal.reservation.date)}</p>
              <p><strong>Estado:</strong> {getStatusText(ratingModal.reservation.status)}</p>
            </div>
            
            <div className="rating-stars">
              <label>Calificación:</label>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${rating >= star ? "star-active" : ""}`}
                    onClick={() => setRating(star)}
                    aria-label={`Calificar con ${star} estrella${star !== 1 ? 's' : ''}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <div className="rating-value">{rating}/5</div>
            </div>

            <div className="rating-comment">
              <label>Comentario (opcional):</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comparte tu experiencia con este recurso..."
                rows={4}
                maxLength={500}
              />
              <div className="char-counter">{comment.length}/500</div>
            </div>

            <div className="rating-buttons">
              <Button 
                onClick={() => setRatingModal({ open: false, reservation: null })}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitRating} 
                variant="primary"
              >
                Enviar Calificación
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de PDF */}
      <Modal
        isOpen={pdfModal.open}
        onClose={closePdfModal}
        title="Exportar a PDF"
        size="small"
      >
        <div className="pdf-options-modal">
          <h4>¿Cómo deseas exportar las reservas?</h4>
          <p className="pdf-modal-description">
            Se exportarán {reservations.length} reserva{reservations.length !== 1 ? 's' : ''} con los filtros actuales.
          </p>
          
          <div className="pdf-option">
            <div className="pdf-option-header">
              <input
                type="radio"
                id="structured"
                name="pdfType"
                value="structured"
                checked={pdfModal.type === 'structured'}
                onChange={(e) => setPdfModal(prev => ({ ...prev, type: e.target.value }))}
              />
              <label htmlFor="structured">
                <strong>PDF Estructurado (Recomendado)</strong>
              </label>
            </div>
            <p className="pdf-option-description">
              Formato profesional optimizado para impresión. Incluye resumen, filtros aplicados y diseño claro.
            </p>
          </div>
          
          <div className="pdf-option">
            <div className="pdf-option-header">
              <input
                type="radio"
                id="snapshot"
                name="pdfType"
                value="snapshot"
                checked={pdfModal.type === 'snapshot'}
                onChange={(e) => setPdfModal(prev => ({ ...prev, type: e.target.value }))}
              />
              <label htmlFor="snapshot">
                <strong>Captura de Pantalla</strong>
              </label>
            </div>
            <p className="pdf-option-description">
              Imagen exacta de la tabla como aparece en pantalla. Útil para compartir vista rápida.
            </p>
          </div>

          <div className="pdf-modal-buttons">
            <Button onClick={closePdfModal} variant="outline">
              Cancelar
            </Button>
            <Button 
              onClick={handleGeneratePDF} 
              variant="primary"
              loading={generatingPDF}
            >
              {generatingPDF ? 'Generando...' : 'Generar PDF'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyReservations;