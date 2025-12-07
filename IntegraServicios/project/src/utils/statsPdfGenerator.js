import { jsPDF } from "jspdf";

/**
 * Genera un PDF completo con todas las estadísticas
 */
export const generateStatsReportPDF = (statsData, filters = {}) => {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // ========== PORTADA ==========
    pdf.setFillColor(59, 130, 246); // Azul
    pdf.rect(0, 0, pageWidth, 60, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("INFORME DE ESTADÍSTICAS", pageWidth / 2, 30, { align: "center" });

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("Sistema IntegraServicios", pageWidth / 2, 40, {
      align: "center",
    });

    // Fecha de generación
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    pdf.text(`Generado: ${dateStr}`, pageWidth / 2, 50, { align: "center" });

    yPosition = 75;
    pdf.setTextColor(0, 0, 0);

    // ========== FILTROS APLICADOS ==========
    if (filters.startDate || filters.endDate) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Período de Análisis", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");

      if (filters.startDate) {
        pdf.text(
          `Desde: ${formatDateForDisplay(filters.startDate)}`,
          margin + 5,
          yPosition
        );
        yPosition += 6;
      }

      if (filters.endDate) {
        pdf.text(
          `Hasta: ${formatDateForDisplay(filters.endDate)}`,
          margin + 5,
          yPosition
        );
        yPosition += 6;
      }

      yPosition += 5;
      drawSeparator(pdf, yPosition, margin, pageWidth);
      yPosition += 8;
    }

    // ========== 1. RECURSOS MÁS RESERVADOS (HU-012) ==========
    if (
      statsData.mostReserved &&
      statsData.mostReserved.data &&
      statsData.mostReserved.data.length > 0
    ) {
      yPosition = addSectionTitle(
        pdf,
        "1. RECURSOS MÁS RESERVADOS",
        yPosition,
        margin
      );

      const summary = statsData.mostReserved.summary;

      // Resumen numérico
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Total de recursos analizados: ${summary.totalResources}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      pdf.text(
        `Total de reservas: ${summary.totalReservations}`,
        margin + 5,
        yPosition
      );
      yPosition += 10;

      // Tabla de recursos
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");

      // Encabezados
      const columns = [
        { text: "Recurso", x: margin + 5, width: 60 },
        { text: "Tipo", x: margin + 70, width: 50 },
        { text: "Reservas", x: margin + 125, width: 30 },
        { text: "Características", x: margin + 160, width: 30 },
      ];

      columns.forEach((col) => {
        pdf.text(col.text, col.x, yPosition);
      });

      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
      yPosition += 8;

      pdf.setFont("helvetica", "normal");

      // Datos (máximo 10 recursos para no exceder página)
      statsData.mostReserved.data.slice(0, 10).forEach((item, index) => {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }

        // Nombre del recurso
        const resourceName = pdf.splitTextToSize(
          item.resource.name,
          columns[0].width - 5
        );
        pdf.text(resourceName[0], columns[0].x, yPosition);

        // Tipo
        const typeName = pdf.splitTextToSize(
          item.resourceType.name,
          columns[1].width - 5
        );
        pdf.text(typeName[0], columns[1].x, yPosition);

        // Cantidad de reservas
        pdf.text(
          item.statistics.totalReservations.toString(),
          columns[2].x,
          yPosition
        );

        // Características
        if (item.resource.features) {
          const featuresCount = Object.keys(item.resource.features).length;
          pdf.text(`${featuresCount} car.`, columns[3].x, yPosition);
        }

        yPosition += 7;
      });

      yPosition += 5;
      drawSeparator(pdf, yPosition, margin, pageWidth);
      yPosition += 10;
    }

    // ========== 2. RECURSO MÁS PRESTADO (HU-013) ==========
    if (statsData.mostLoaned && statsData.mostLoaned.data) {
      // Verificar si necesitamos nueva página
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      yPosition = addSectionTitle(
        pdf,
        "2. RECURSO MÁS PRESTADO",
        yPosition,
        margin
      );

      const data = statsData.mostLoaned.data;

      // Caja destacada
      pdf.setFillColor(240, 249, 255);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 50, "F");

      yPosition += 8;

      // Nombre del recurso
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(59, 130, 246);
      const resourceNameLines = pdf.splitTextToSize(
        data.resource.name,
        pageWidth - 2 * margin - 10
      );
      pdf.text(resourceNameLines[0], margin + 5, yPosition);
      yPosition += 8;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      // Tipo y unidad
      pdf.text(`Tipo: ${data.resourceType.name}`, margin + 5, yPosition);
      yPosition += 6;

      if (data.unit) {
        pdf.text(`Unidad: ${data.unit.name}`, margin + 5, yPosition);
        yPosition += 6;
      }

      // Estadísticas
      pdf.setFont("helvetica", "bold");
      yPosition += 2;
      pdf.text(
        `Préstamos realizados: ${data.statistics.loanCount}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Total de reservas: ${data.statistics.totalReservations}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      pdf.text(
        `Usuarios únicos: ${data.statistics.uniqueUsers}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      pdf.text(
        `Tasa de préstamo: ${data.statistics.loanRate}%`,
        margin + 5,
        yPosition
      );

      yPosition += 15;
      drawSeparator(pdf, yPosition, margin, pageWidth);
      yPosition += 10;
    }

    // ========== 3. REPORTE DE CALIFICACIONES (HU-018) ==========
    if (statsData.ratings && statsData.ratings.data) {
      // Verificar si necesitamos nueva página
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = margin;
      }

      yPosition = addSectionTitle(
        pdf,
        "3. REPORTE DE CALIFICACIONES",
        yPosition,
        margin
      );

      const ratingsData = statsData.ratings.data;

      // Estadísticas generales
      if (ratingsData.overall) {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("Resumen General", margin + 5, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Total de calificaciones: ${ratingsData.overall.totalRatings}`,
          margin + 10,
          yPosition
        );
        yPosition += 6;

        // Promedios
        pdf.setFont("helvetica", "bold");
        pdf.text("Promedios:", margin + 10, yPosition);
        yPosition += 6;
        pdf.setFont("helvetica", "normal");

        pdf.text(
          `⭐ General: ${ratingsData.overall.averages.overall}/5.00`,
          margin + 15,
          yPosition
        );
        yPosition += 5;
        pdf.text(
          `⏰ Cumplimiento de horarios: ${ratingsData.overall.averages.scheduleCompliance}/5.00`,
          margin + 15,
          yPosition
        );
        yPosition += 5;
        pdf.text(
          `🔧 Calidad del recurso: ${ratingsData.overall.averages.resourceQuality}/5.00`,
          margin + 15,
          yPosition
        );
        yPosition += 5;
        pdf.text(
          `😊 Amabilidad del personal: ${ratingsData.overall.averages.staffKindness}/5.00`,
          margin + 15,
          yPosition
        );
        yPosition += 10;

        // Distribución de calificaciones
        if (ratingsData.overall.distribution) {
          pdf.setFont("helvetica", "bold");
          pdf.text("Distribución de calificaciones:", margin + 10, yPosition);
          yPosition += 6;
          pdf.setFont("helvetica", "normal");

          const dist = ratingsData.overall.distribution;
          pdf.text(
            `⭐⭐⭐⭐⭐ (5 estrellas): ${dist["5"]} calificaciones`,
            margin + 15,
            yPosition
          );
          yPosition += 5;
          pdf.text(
            `⭐⭐⭐⭐ (4 estrellas): ${dist["4"]} calificaciones`,
            margin + 15,
            yPosition
          );
          yPosition += 5;
          pdf.text(
            `⭐⭐⭐ (3 estrellas): ${dist["3"]} calificaciones`,
            margin + 15,
            yPosition
          );
          yPosition += 5;
          pdf.text(
            `⭐⭐ (2 estrellas): ${dist["2"]} calificaciones`,
            margin + 15,
            yPosition
          );
          yPosition += 5;
          pdf.text(
            `⭐ (1 estrella): ${dist["1"]} calificaciones`,
            margin + 15,
            yPosition
          );
          yPosition += 10;
        }
      }

      // Top 5 recursos mejor calificados
      if (ratingsData.byResource && ratingsData.byResource.length > 0) {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("Top 5 Recursos Mejor Calificados", margin + 5, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);

        ratingsData.byResource.slice(0, 5).forEach((item, index) => {
          pdf.setFont("helvetica", "bold");
          const stars = "⭐".repeat(
            Math.round(parseFloat(item.statistics.averages.overall))
          );
          pdf.text(
            `${index + 1}. ${item.resource.name} ${stars}`,
            margin + 10,
            yPosition
          );
          yPosition += 5;

          pdf.setFont("helvetica", "normal");
          pdf.text(
            `   Promedio: ${item.statistics.averages.overall}/5.00 (${item.statistics.totalRatings} calificaciones)`,
            margin + 10,
            yPosition
          );
          yPosition += 6;
        });

        yPosition += 5;
      }

      // Top 5 empleados mejor calificados
      if (ratingsData.byEmployee && ratingsData.byEmployee.length > 0) {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("Top 5 Empleados Mejor Calificados", margin + 5, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);

        ratingsData.byEmployee.slice(0, 5).forEach((item, index) => {
          pdf.setFont("helvetica", "bold");
          const stars = "⭐".repeat(
            Math.round(parseFloat(item.statistics.averages.staffKindness))
          );
          pdf.text(
            `${index + 1}. ${item.employee.name} ${stars}`,
            margin + 10,
            yPosition
          );
          yPosition += 5;

          pdf.setFont("helvetica", "normal");
          pdf.text(
            `   Amabilidad: ${item.statistics.averages.staffKindness}/5.00 (${item.statistics.totalRatings} calificaciones)`,
            margin + 10,
            yPosition
          );
          yPosition += 6;
        });
      }
    }

    // ========== PIE DE PÁGINA ==========
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
      pdf.text(
        "IntegraServicios - Sistema de Gestión de Recursos",
        margin,
        pageHeight - 10
      );
    }

    // Guardar PDF
    const filename = `informe-estadisticas-${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("Error generando PDF de estadísticas:", error);
    throw error;
  }
};

// ========== FUNCIONES AUXILIARES ==========

const addSectionTitle = (pdf, title, yPosition, margin) => {
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(59, 130, 246);
  pdf.text(title, margin, yPosition);
  pdf.setTextColor(0, 0, 0);
  yPosition += 8;
  return yPosition;
};

const drawSeparator = (pdf, yPosition, margin, pageWidth) => {
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
