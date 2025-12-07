import { useState, useEffect } from "react";
import { useUI } from "../../../context/UIContext";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import {
  getMostReservedResourcesApi,
  getMostLoanedResourceApi,
  getRatingsReportApi,
  getStatsSummaryApi,
} from "../../../api/stats/stats";
import { generateStatsReportPDF } from "../../../utils/statsPdfGenerator";
import "./StatsPage.css";

const StatsPage = () => {
  const { showSuccess, showError, showWarning } = useUI();

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Estados de datos
  const [mostReservedData, setMostReservedData] = useState(null);
  const [mostLoanedData, setMostLoanedData] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  // Estados para filtros
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    limit: 10,
  });

  // Cargar estadísticas al montar o cambiar filtros
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadAllStats();
    }
  }, []);

  const loadAllStats = async () => {
    if (!filters.startDate || !filters.endDate) {
      showWarning("Por favor selecciona un rango de fechas");
      return;
    }

    setLoading(true);

    try {
      // Cargar todas las estadísticas en paralelo
      const [mostReserved, mostLoaned, ratings, summary] = await Promise.all([
        getMostReservedResourcesApi(filters).catch((err) => {
          console.error("Error en mostReserved:", err);
          return null;
        }),
        getMostLoanedResourceApi(filters).catch((err) => {
          console.error("Error en mostLoaned:", err);
          return null;
        }),
        getRatingsReportApi(filters).catch((err) => {
          console.error("Error en ratings:", err);
          return null;
        }),
        getStatsSummaryApi(filters).catch((err) => {
          console.error("Error en summary:", err);
          return null;
        }),
      ]);

      setMostReservedData(mostReserved);
      setMostLoanedData(mostLoaned);
      setRatingsData(ratings);
      setSummaryData(summary);

      showSuccess("Estadísticas cargadas exitosamente");
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      showError("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      limit: 10,
    });
    setMostReservedData(null);
    setMostLoanedData(null);
    setRatingsData(null);
    setSummaryData(null);
  };

  const handleGeneratePDF = async () => {
    if (!mostReservedData && !mostLoanedData && !ratingsData) {
      showWarning(
        "No hay datos para exportar. Por favor genera las estadísticas primero."
      );
      return;
    }

    try {
      setGeneratingPDF(true);

      const statsData = {
        mostReserved: mostReservedData,
        mostLoaned: mostLoanedData,
        ratings: ratingsData,
        summary: summaryData,
      };

      await generateStatsReportPDF(statsData, filters);

      showSuccess("Informe PDF generado exitosamente");
    } catch (error) {
      console.error("Error generando PDF:", error);
      showError("Error al generar el informe PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const hasData =
    mostReservedData || mostLoanedData || ratingsData || summaryData;

  return (
    <div className="stats-page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">📊 Estadísticas e Informes</h1>
        <p className="page-subtitle">
          Análisis detallado del uso de recursos y calidad del servicio
        </p>
      </div>

      {/* Filtros */}
      <Card className="filters-card">
        <div className="filters-section">
          <h3>Filtros de Consulta</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Fecha de Inicio *</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                max={filters.endDate}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Fecha de Fin *</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                min={filters.startDate}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Límite de Resultados</label>
              <select
                value={filters.limit}
                onChange={(e) =>
                  handleFilterChange("limit", parseInt(e.target.value))
                }
                className="filter-input"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="filter-actions">
              <Button
                variant="secondary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Limpiar
              </Button>
              <Button
                variant="primary"
                onClick={loadAllStats}
                loading={loading}
                disabled={!filters.startDate || !filters.endDate}
              >
                {loading ? "Generando..." : "Generar Estadísticas"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Botón de exportar */}
      {hasData && (
        <div className="export-section">
          <Button
            variant="success"
            onClick={handleGeneratePDF}
            loading={generatingPDF}
            disabled={loading}
            className="export-button"
          >
            {generatingPDF
              ? "Generando PDF..."
              : "📄 Exportar Informe Completo"}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <Loader fullScreen />
          <p>Cargando estadísticas...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasData && (
        <Card className="empty-state">
          <div className="empty-state-content">
            <div className="empty-icon">📊</div>
            <h3>Sin estadísticas</h3>
            <p>
              Selecciona un rango de fechas y haz clic en "Generar Estadísticas"
              para ver los informes
            </p>
          </div>
        </Card>
      )}

      {/* Estadísticas */}
      {!loading && hasData && (
        <div className="stats-content">
          {/* HU-012: Recursos Más Reservados */}
          {mostReservedData && mostReservedData.data && (
            <Card className="stat-card">
              <div className="stat-card-header">
                <h2>📋 Recursos Más Reservados (HU-012)</h2>
                <span className="stat-badge">
                  {mostReservedData.data.length} recursos
                </span>
              </div>

              <div className="stat-summary">
                <div className="summary-item">
                  <span className="summary-label">Total de Reservas:</span>
                  <span className="summary-value">
                    {mostReservedData.summary.totalReservations}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Recursos Analizados:</span>
                  <span className="summary-value">
                    {mostReservedData.summary.totalResources}
                  </span>
                </div>
              </div>

              <div className="resources-grid">
                {mostReservedData.data.map((item, index) => (
                  <div key={item.resource.id} className="resource-card">
                    <div className="resource-rank">#{index + 1}</div>
                    <div className="resource-info">
                      <h4>{item.resource.name}</h4>
                      <p className="resource-type">{item.resourceType.name}</p>
                      {item.unit && (
                        <p className="resource-unit">📍 {item.unit.name}</p>
                      )}
                    </div>
                    <div className="resource-stats">
                      <div className="stat-item">
                        <span className="stat-number">
                          {item.statistics.totalReservations}
                        </span>
                        <span className="stat-label">Reservas</span>
                      </div>
                    </div>
                    {item.resource.features && (
                      <div className="resource-features">
                        {Object.entries(item.resource.features)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <span key={key} className="feature-tag">
                              {key}: {value}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* HU-013: Recurso Más Prestado */}
          {mostLoanedData && mostLoanedData.data && (
            <Card className="stat-card highlight-card">
              <div className="stat-card-header">
                <h2>🏆 Recurso Más Prestado (HU-013)</h2>
                <span className="stat-badge gold">Destacado</span>
              </div>

              <div className="most-loaned-content">
                <div className="most-loaned-header">
                  <div className="trophy-icon">🏆</div>
                  <div>
                    <h3>{mostLoanedData.data.resource.name}</h3>
                    <p className="resource-type-main">
                      {mostLoanedData.data.resourceType.name}
                    </p>
                  </div>
                </div>

                <div className="stats-grid-main">
                  <div className="stat-box">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                      <span className="stat-number-large">
                        {mostLoanedData.data.statistics.loanCount}
                      </span>
                      <span className="stat-label">Préstamos Realizados</span>
                    </div>
                  </div>

                  <div className="stat-box">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                      <span className="stat-number-large">
                        {mostLoanedData.data.statistics.totalReservations}
                      </span>
                      <span className="stat-label">Total Reservas</span>
                    </div>
                  </div>

                  <div className="stat-box">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <span className="stat-number-large">
                        {mostLoanedData.data.statistics.uniqueUsers}
                      </span>
                      <span className="stat-label">Usuarios Únicos</span>
                    </div>
                  </div>

                  <div className="stat-box">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <span className="stat-number-large">
                        {mostLoanedData.data.statistics.loanRate}%
                      </span>
                      <span className="stat-label">Tasa de Préstamo</span>
                    </div>
                  </div>
                </div>

                {mostLoanedData.data.statistics.failuresCount > 0 && (
                  <div className="failure-alert">
                    <span>⚠️</span>
                    <p>
                      {mostLoanedData.data.statistics.failuresCount} fallos de
                      servicio ({mostLoanedData.data.statistics.failureRate}%
                      del total)
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* HU-018: Reporte de Calificaciones */}
          {ratingsData && ratingsData.data && (
            <Card className="stat-card">
              <div className="stat-card-header">
                <h2>⭐ Reporte de Calificaciones (HU-018)</h2>
                <span className="stat-badge">
                  {ratingsData.data.overall?.totalRatings || 0} calificaciones
                </span>
              </div>

              {/* Resumen General */}
              {ratingsData.data.overall && (
                <div className="ratings-overview">
                  <h3>Resumen General</h3>
                  <div className="ratings-grid">
                    <div className="rating-box">
                      <div className="rating-value-large">
                        {ratingsData.data.overall.averages.overall}
                      </div>
                      <div className="rating-stars">
                        {"⭐".repeat(
                          Math.round(
                            parseFloat(
                              ratingsData.data.overall.averages.overall
                            )
                          )
                        )}
                      </div>
                      <div className="rating-label">Promedio General</div>
                    </div>

                    <div className="rating-detail-box">
                      <div className="rating-detail-item">
                        <span>⏰ Cumplimiento de Horarios</span>
                        <strong>
                          {ratingsData.data.overall.averages.scheduleCompliance}
                          /5.00
                        </strong>
                      </div>
                      <div className="rating-detail-item">
                        <span>🔧 Calidad del Recurso</span>
                        <strong>
                          {ratingsData.data.overall.averages.resourceQuality}
                          /5.00
                        </strong>
                      </div>
                      <div className="rating-detail-item">
                        <span>😊 Amabilidad del Personal</span>
                        <strong>
                          {ratingsData.data.overall.averages.staffKindness}
                          /5.00
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Distribución */}
                  {ratingsData.data.overall.distribution && (
                    <div className="distribution-section">
                      <h4>Distribución de Calificaciones</h4>
                      <div className="distribution-bars">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count =
                            ratingsData.data.overall.distribution[stars] || 0;
                          const percentage =
                            (count / ratingsData.data.overall.totalRatings) *
                            100;
                          return (
                            <div key={stars} className="distribution-bar">
                              <span className="bar-label">
                                {"⭐".repeat(stars)}
                              </span>
                              <div className="bar-container">
                                <div
                                  className="bar-fill"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="bar-count">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Top Recursos */}
              {ratingsData.data.byResource &&
                ratingsData.data.byResource.length > 0 && (
                  <div className="top-section">
                    <h3>Top Recursos Mejor Calificados</h3>
                    <div className="top-list">
                      {ratingsData.data.byResource
                        .slice(0, 5)
                        .map((item, index) => (
                          <div key={item.resource.id} className="top-item">
                            <div className="top-rank">
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : `#${index + 1}`}
                            </div>
                            <div className="top-info">
                              <h4>{item.resource.name}</h4>
                              <p>{item.resource.type}</p>
                            </div>
                            <div className="top-rating">
                              <span className="rating-number">
                                {item.statistics.averages.overall}
                              </span>
                              <span className="rating-stars-small">
                                {"⭐".repeat(
                                  Math.round(
                                    parseFloat(item.statistics.averages.overall)
                                  )
                                )}
                              </span>
                              <span className="rating-count">
                                ({item.statistics.totalRatings} calificaciones)
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Top Empleados */}
              {ratingsData.data.byEmployee &&
                ratingsData.data.byEmployee.length > 0 && (
                  <div className="top-section">
                    <h3>Top Empleados Mejor Calificados</h3>
                    <div className="top-list">
                      {ratingsData.data.byEmployee
                        .slice(0, 5)
                        .map((item, index) => (
                          <div key={item.employee.id} className="top-item">
                            <div className="top-rank">
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : `#${index + 1}`}
                            </div>
                            <div className="top-info">
                              <h4>{item.employee.name}</h4>
                              <p>{item.employee.email}</p>
                            </div>
                            <div className="top-rating">
                              <span className="rating-number">
                                {item.statistics.averages.staffKindness}
                              </span>
                              <span className="rating-stars-small">
                                {"⭐".repeat(
                                  Math.round(
                                    parseFloat(
                                      item.statistics.averages.staffKindness
                                    )
                                  )
                                )}
                              </span>
                              <span className="rating-count">
                                ({item.statistics.totalRatings} calificaciones)
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsPage;
