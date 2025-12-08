import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../context/UIContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Loader from "../../components/common/Loader";
import Select from "../../components/common/Select";
import GenericModal from "../../modals/GenericModal/GenericModal";
import {
  getMyReservationsApi,
  cancelReservationApi,
} from "../../api/Reservation/Reservation";
import { createRatingApi } from "../../api/rating/rating";
import { generateReservationsPDF } from "../../utils/pdfGenerator";
import RatingForm from "../../forms/RatingForm/RatingForm";
import "./MyReservations.css";

const MyReservations = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useUI();

  // Estados principales
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({
    open: false,
    reservation: null,
    options: null,
  });
  const [ratingModal, setRatingModal] = useState({
    open: false,
    reservation: null,
  });
  const [viewRatingModal, setViewRatingModal] = useState({
    open: false,
    rating: null,
  });
  const [pdfModal, setPdfModal] = useState({
    open: false,
    type: "structured",
  });
  const [cancelling, setCancelling] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Estados para filtros
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
    isRepetitive: "",
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

      if (filters.isRepetitive !== "") {
        apiFilters.isRepetitive = filters.isRepetitive === "true";
      }

      const response = await getMyReservationsApi(apiFilters);

      let reservationsData = [];

      if (response && response.reservations) {
        reservationsData = response.reservations;
      } else if (Array.isArray(response)) {
        reservationsData = response;
      }

      setReservations(reservationsData);

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

    if (reservation.isRepetitive) {
      setCancelModal({
        open: true,
        reservation,
        options: {
          showOptions: true,
          selectedOption: "single",
          hasRelatedReservations: true,
        },
      });
    } else {
      setCancelModal({
        open: true,
        reservation,
        options: null,
      });
    }
  };

  const handleCancelReservation = async () => {
    if (!cancelModal.reservation) return;

    setCancelling(true);
    try {
      let cancelAll = false;
      let cancelFuture = false;

      if (cancelModal.options && cancelModal.reservation.isRepetitive) {
        switch (cancelModal.options.selectedOption) {
          case "all":
            cancelAll = true;
            break;
          case "future":
            cancelFuture = true;
            break;
          case "single":
          default:
            break;
        }
      }

      const response = await cancelReservationApi(
        cancelModal.reservation.id,
        cancelAll,
        cancelFuture
      );

      if (response && (response.success || response.message)) {
        let successMessage = "Reserva cancelada exitosamente";

        if (cancelModal.options && cancelModal.reservation.isRepetitive) {
          switch (cancelModal.options.selectedOption) {
            case "all":
              successMessage =
                response.message ||
                "Todas las repeticiones han sido canceladas";
              break;
            case "future":
              successMessage =
                response.message || "Repeticiones futuras canceladas";
              break;
            case "single":
              successMessage =
                response.message || "Reserva cancelada exitosamente";
              break;
          }

          if (cancelAll || cancelFuture) {
            showSuccess(successMessage);
            setTimeout(() => {
              loadReservations();
            }, 500);
          } else {
            setReservations((prevReservations) =>
              prevReservations.map((res) =>
                res.id === cancelModal.reservation.id
                  ? { ...res, status: "cancelada" }
                  : res
              )
            );
            showSuccess(successMessage);
          }
        } else {
          setReservations((prevReservations) =>
            prevReservations.map((res) =>
              res.id === cancelModal.reservation.id
                ? { ...res, status: "cancelada" }
                : res
            )
          );
          showSuccess(response.message || "Reserva cancelada exitosamente");
        }
      } else {
        showError("Error al cancelar la reserva");
      }
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
      showError(error.message || "Error al cancelar la reserva");
    } finally {
      setCancelling(false);
      setCancelModal({ open: false, reservation: null, options: null });
    }
  };

  const handleCancelOptionChange = (option) => {
    setCancelModal((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        selectedOption: option,
      },
    }));
  };

  const handleOpenRatingModal = (reservation) => {
    if (!canRateReservation(reservation)) {
      showError("Solo se pueden calificar reservas finalizadas");
      return;
    }
    setRatingModal({ open: true, reservation });
  };

  const handleSubmitRating = async (ratingData) => {
    try {
      const ratingWithReservationId = {
        ...ratingData,
        reservationId: ratingModal.reservation.id,
      };

      const response = await createRatingApi(ratingWithReservationId);

      if (response.success) {
        showSuccess(response.message || "Calificación enviada exitosamente");

        // Actualizar la reserva para mostrar la nueva calificación
        setReservations((prevReservations) =>
          prevReservations.map((res) =>
            res.id === ratingModal.reservation.id
              ? { ...res, Rating: response.rating }
              : res
          )
        );

        setRatingModal({ open: false, reservation: null });
      } else {
        showError(response.message || "Error al enviar la calificación");
      }
    } catch (error) {
      console.error("Error al enviar calificación:", error);
      showError(error.message || "Error al enviar la calificación");
    }
  };

  // Nueva función para ver calificación existente
  const handleViewRating = (reservation) => {
    if (reservation.Rating) {
      setViewRatingModal({
        open: true,
        rating: reservation.Rating,
        reservation: reservation,
      });
    }
  };

  const openPdfModal = () => {
    if (reservations.length === 0) {
      showError("No hay reservas para exportar");
      return;
    }
    setPdfModal({ open: true, type: "structured" });
  };

  const closePdfModal = () => {
    setPdfModal({ open: false, type: "structured" });
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      closePdfModal();

      await generateReservationsPDF(reservations, filters, {
        title: `Mis Reservas - ${new Date().toLocaleDateString("es-ES")}`,
        filename: `mis-reservas-${new Date().toISOString().split("T")[0]}.pdf`,
        includeFilters: true,
        includeSummary: true,
      });

      showSuccess("PDF generado exitosamente");
    } catch (error) {
      console.error("Error generando PDF:", error);
      showError("Error al generar el PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({
        ...prev,
        page: newPage,
      }));
    }
  };

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      startDate: "",
      endDate: "",
      isRepetitive: "",
      page: 1,
      limit: 10,
    });
  };

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

  const canCancelReservation = (reservation) => {
    const status = reservation.status?.toLowerCase();

    if (status !== "pendiente" && status !== "activa") {
      return false;
    }

    try {
      const startDate = new Date(
        reservation.startDateTime || reservation.startTime || reservation.date
      );
      const now = new Date();
      const hoursDifference = (startDate - now) / (1000 * 60 * 60);

      return hoursDifference > 1;
    } catch (error) {
      console.error("Error calculando si se puede cancelar:", error);
      return false;
    }
  };

  const canRateReservation = (reservation) => {
    const status = reservation.status?.toLowerCase();
    const hasRating = reservation.Rating;

    return status === "finalizada" && !hasRating;
  };

  const hasRating = (reservation) => {
    return !!reservation.Rating;
  };

  const getStatusText = (status) => {
    const statusLower = status?.toLowerCase();

    switch (statusLower) {
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

  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
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

  const getRepeatIcon = (isRepetitive) => {
    return isRepetitive ? (
      <span className="repeat-icon" title="Reserva repetitiva">
        🔄
      </span>
    ) : null;
  };

  // Función para renderizar estrellas
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="star-filled">
          ⭐
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="star-half">
          ⭐
        </span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="star-empty">
          ☆
        </span>
      );
    }

    return stars;
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
          (typeof row.resource === "string" ? row.resource : "N/A");

        return (
          <div className="resource-cell">
            {resourceName}
            {getRepeatIcon(row.isRepetitive)}
          </div>
        );
      },
    },
    {
      key: "date",
      label: "Fecha",
      render: (row) => {
        const date = row.startDateTime || row.date || row.startDate;
        return formatDisplayDate(date);
      },
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
            {row.isRepetitive && " (R)"}
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
        const alreadyRated = hasRating(row);

        return (
          <div className="table-actions">
            {canCancel && (
              <Button
                size="small"
                variant="danger"
                onClick={() => handleOpenCancelModal(row)}
              >
                {row.isRepetitive ? "Cancelar 🔄" : "Cancelar"}
              </Button>
            )}

            {canRate && (
              <Button
                size="small"
                variant="success"
                onClick={() => handleOpenRatingModal(row)}
              >
                Calificar ⭐
              </Button>
            )}

            {alreadyRated && (
              <div
                className="rating-display-container"
                onClick={() => handleViewRating(row)}
                title="Ver calificación completa"
              >
                <div className="rating-stars-mini">
                  {renderStars(row.Rating.averageStars)}
                  <span className="rating-number">
                    {parseFloat(row.Rating.averageStars).toFixed(1)}
                  </span>
                </div>
                {row.Rating.comment && (
                  <span
                    className="comment-indicator"
                    title={row.Rating.comment}
                  >
                    💬
                  </span>
                )}
              </div>
            )}

            {!canCancel && !canRate && !alreadyRated && (
              <span className="no-actions-info">Sin acciones disponibles</span>
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
              <label>Tipo:</label>
              <Select
                value={filters.isRepetitive}
                onChange={(e) =>
                  handleFilterChange("isRepetitive", e.target.value)
                }
                options={[
                  { value: "", label: "Todos" },
                  { value: "true", label: "Repetitivas 🔄" },
                  { value: "false", label: "Únicas" },
                ]}
              />
            </div>

            <div className="filter-group">
              <label>Desde:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
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
                {generatingPDF ? "Generando PDF..." : "Exportar a PDF"}
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
            {filters.status !== "all" ||
            filters.startDate ||
            filters.endDate ||
            filters.isRepetitive !== "" ? (
              <Button onClick={handleClearFilters} variant="outline">
                Limpiar filtros para ver todas las reservas
              </Button>
            ) : (
              <p className="empty-state-text">
                ¡Comienza a hacer reservas para verlas aquí!
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="reservations-count">
              <p>
                Mostrando {reservations.length} reserva
                {reservations.length !== 1 ? "s" : ""} de{" "}
                {pagination.totalItems} total
                {filters.isRepetitive === "true" && " (Repetitivas 🔄)"}
                {filters.isRepetitive === "false" && " (Únicas)"}
              </p>
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
      <GenericModal
        isOpen={cancelModal.open}
        onClose={() =>
          !cancelling &&
          setCancelModal({ open: false, reservation: null, options: null })
        }
        title={
          cancelModal.reservation?.isRepetitive
            ? "Cancelar Reserva Repetitiva 🔄"
            : "Cancelar Reserva"
        }
        size="small"
      >
        {cancelModal.reservation && (
          <div className="cancel-form">
            {cancelModal.reservation.isRepetitive &&
              cancelModal.options?.showOptions && (
                <div className="repeat-cancel-options">
                  <div className="repeat-warning">
                    <div className="warning-icon">🔄</div>
                    <h4>Esta es una reserva repetitiva</h4>
                    <p>¿Qué deseas cancelar?</p>
                  </div>

                  <div className="cancel-options-list">
                    <label className="cancel-option">
                      <input
                        type="radio"
                        name="cancelOption"
                        value="single"
                        checked={
                          cancelModal.options.selectedOption === "single"
                        }
                        onChange={() => handleCancelOptionChange("single")}
                      />
                      <div className="option-content">
                        <strong>Solo esta reserva</strong>
                        <p>Cancelarás únicamente esta fecha específica.</p>
                      </div>
                    </label>

                    <label className="cancel-option">
                      <input
                        type="radio"
                        name="cancelOption"
                        value="future"
                        checked={
                          cancelModal.options.selectedOption === "future"
                        }
                        onChange={() => handleCancelOptionChange("future")}
                      />
                      <div className="option-content">
                        <strong>Repeticiones futuras</strong>
                        <p>
                          Cancelarás esta reserva y todas las futuras de la
                          serie.
                        </p>
                      </div>
                    </label>

                    <label className="cancel-option">
                      <input
                        type="radio"
                        name="cancelOption"
                        value="all"
                        checked={cancelModal.options.selectedOption === "all"}
                        onChange={() => handleCancelOptionChange("all")}
                      />
                      <div className="option-content">
                        <strong>Todas las repeticiones</strong>
                        <p>
                          Cancelarás todas las reservas de esta serie (pasadas y
                          futuras).
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

            <div className="cancel-warning">
              <div className="warning-icon">⚠️</div>
              <h4>
                {cancelModal.reservation.isRepetitive
                  ? `¿Estás seguro de cancelar ${
                      cancelModal.options?.selectedOption === "single"
                        ? "esta reserva"
                        : cancelModal.options?.selectedOption === "future"
                        ? "las repeticiones futuras"
                        : "todas las repeticiones"
                    }?`
                  : "¿Estás seguro de cancelar esta reserva?"}
              </h4>
              <p>Esta acción no se puede deshacer.</p>
            </div>

            <div className="reservation-details">
              <p>
                <strong>Recurso:</strong>{" "}
                {cancelModal.reservation.resource?.name ||
                  cancelModal.reservation.Resource?.name ||
                  cancelModal.reservation.resourceName ||
                  "N/A"}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {formatDisplayDate(
                  cancelModal.reservation.startDateTime ||
                    cancelModal.reservation.date
                )}
              </p>
              <p>
                <strong>Horario:</strong>{" "}
                {formatDisplayTime(
                  cancelModal.reservation.startDateTime ||
                    cancelModal.reservation.startTime
                )}{" "}
                -{" "}
                {formatDisplayTime(
                  cancelModal.reservation.endDateTime ||
                    cancelModal.reservation.endTime
                )}
              </p>
              <p>
                <strong>Estado actual:</strong>{" "}
                {getStatusText(cancelModal.reservation.status)}
              </p>
              {cancelModal.reservation.isRepetitive && (
                <p className="repeat-info">
                  <strong>Tipo:</strong> Reserva repetitiva 🔄
                </p>
              )}
            </div>

            <div className="cancel-buttons">
              <Button
                onClick={() =>
                  setCancelModal({
                    open: false,
                    reservation: null,
                    options: null,
                  })
                }
                variant="outline"
                disabled={cancelling}
              >
                No, mantener{" "}
                {cancelModal.reservation.isRepetitive
                  ? "reserva(s)"
                  : "reserva"}
              </Button>
              <Button
                onClick={handleCancelReservation}
                variant="danger"
                loading={cancelling}
                disabled={cancelling}
              >
                {cancelling
                  ? "Cancelando..."
                  : cancelModal.reservation.isRepetitive
                  ? `Sí, cancelar ${
                      cancelModal.options?.selectedOption === "single"
                        ? "esta reserva"
                        : cancelModal.options?.selectedOption === "future"
                        ? "repeticiones futuras"
                        : "todas las repeticiones"
                    }`
                  : "Sí, cancelar reserva"}
              </Button>
            </div>
          </div>
        )}
      </GenericModal>

      {/* Modal de calificación */}
      <GenericModal
        isOpen={ratingModal.open}
        onClose={() => setRatingModal({ open: false, reservation: null })}
        title="Calificar Reserva"
        subtitle="Evalúa tu experiencia con esta reserva"
        size="medium"
      >
        {ratingModal.reservation && (
          <RatingForm
            reservation={ratingModal.reservation}
            onSubmit={handleSubmitRating}
            onCancel={() => setRatingModal({ open: false, reservation: null })}
          />
        )}
      </GenericModal>

      {/* Modal para ver calificación existente */}
      <GenericModal
        isOpen={viewRatingModal.open}
        onClose={() => setViewRatingModal({ open: false, rating: null })}
        title="Calificación de la Reserva"
        size="medium"
      >
        {viewRatingModal.rating && (
          <div className="view-rating-content">
            <div className="reservation-info-rating">
              <h4>Información de la Reserva</h4>
              <p>
                <strong>Recurso:</strong>{" "}
                {viewRatingModal.reservation?.Resource?.name ||
                  viewRatingModal.reservation?.resource?.name ||
                  "N/A"}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {formatDisplayDate(viewRatingModal.reservation?.startDateTime)}
              </p>
              <p>
                <strong>Horario:</strong>{" "}
                {formatDisplayTime(viewRatingModal.reservation?.startDateTime)}{" "}
                - {formatDisplayTime(viewRatingModal.reservation?.endDateTime)}
              </p>
            </div>

            <div className="rating-details">
              <h4>Detalles de la Calificación</h4>

              <div className="rating-detail-item">
                <label>Cumplimiento de Horarios:</label>
                <div className="stars-display">
                  {renderStars(viewRatingModal.rating.scheduleCompliance)}
                  <span className="rating-value">
                    {viewRatingModal.rating.scheduleCompliance}/5
                  </span>
                </div>
              </div>

              <div className="rating-detail-item">
                <label>Calidad del Recurso:</label>
                <div className="stars-display">
                  {renderStars(viewRatingModal.rating.resourceQuality)}
                  <span className="rating-value">
                    {viewRatingModal.rating.resourceQuality}/5
                  </span>
                </div>
              </div>

              <div className="rating-detail-item">
                <label>Amabilidad del Personal:</label>
                <div className="stars-display">
                  {renderStars(viewRatingModal.rating.staffKindness)}
                  <span className="rating-value">
                    {viewRatingModal.rating.staffKindness}/5
                  </span>
                </div>
              </div>

              <div className="rating-average">
                <label>Promedio General:</label>
                <div className="stars-display-large">
                  {renderStars(viewRatingModal.rating.averageStars)}
                  <span className="rating-value-large">
                    {parseFloat(viewRatingModal.rating.averageStars).toFixed(1)}
                    /5
                  </span>
                </div>
              </div>

              {viewRatingModal.rating.comment && (
                <div className="rating-comment-display">
                  <label>Comentario:</label>
                  <p className="comment-text">
                    {viewRatingModal.rating.comment}
                  </p>
                </div>
              )}
            </div>

            <div className="view-rating-footer">
              <Button
                onClick={() =>
                  setViewRatingModal({ open: false, rating: null })
                }
                variant="primary"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </GenericModal>

      {/* Modal de PDF */}
      <GenericModal
        isOpen={pdfModal.open}
        onClose={closePdfModal}
        title="Exportar a PDF"
        size="small"
      >
        <div className="pdf-options-modal">
          <h4>¿Cómo deseas exportar las reservas?</h4>
          <p className="pdf-modal-description">
            Se exportarán {reservations.length} reserva
            {reservations.length !== 1 ? "s" : ""} con los filtros actuales.
          </p>

          <div className="pdf-option">
            <div className="pdf-option-header">
              <input
                type="radio"
                id="structured"
                name="pdfType"
                value="structured"
                checked={pdfModal.type === "structured"}
                onChange={(e) =>
                  setPdfModal((prev) => ({ ...prev, type: e.target.value }))
                }
              />
              <label htmlFor="structured">
                <strong>PDF Estructurado (Recomendado)</strong>
              </label>
            </div>
            <p className="pdf-option-description">
              Formato profesional optimizado para impresión. Incluye resumen,
              filtros aplicados y diseño claro.
            </p>
          </div>

          <div className="pdf-option">
            <div className="pdf-option-header">
              <input
                type="radio"
                id="snapshot"
                name="pdfType"
                value="snapshot"
                checked={pdfModal.type === "snapshot"}
                onChange={(e) =>
                  setPdfModal((prev) => ({ ...prev, type: e.target.value }))
                }
              />
              <label htmlFor="snapshot">
                <strong>Captura de Pantalla</strong>
              </label>
            </div>
            <p className="pdf-option-description">
              Imagen exacta de la tabla como aparece en pantalla. Útil para
              compartir vista rápida.
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
              {generatingPDF ? "Generando..." : "Generar PDF"}
            </Button>
          </div>
        </div>
      </GenericModal>
    </div>
  );
};

export default MyReservations;
