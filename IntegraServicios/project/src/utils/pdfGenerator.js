// utils/pdfGenerator.js
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Genera un PDF a partir de un elemento HTML (captura como imagen)
 */
export const generatePDFFromElement = async (elementId, filename = 'documento.pdf', options = {}) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento con ID ${elementId} no encontrado`);
    }

    const {
      title = 'Documento',
      orientation = 'portrait',
      margin = 10,
      scale = 2,
      quality = 1
    } = options;

    // Crear canvas del elemento
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgWidth = 210; // Ancho A4 en mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Crear PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    // Agregar título si se especifica
    if (title) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, margin);
    }

    // Agregar imagen
    const imgData = canvas.toDataURL('image/png', quality);
    pdf.addImage(imgData, 'PNG', margin, title ? margin + 10 : margin, imgWidth - (2 * margin), imgHeight - (2 * margin));

    // Guardar PDF
    pdf.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};

/**
 * Genera un PDF estructurado de reservas
 */
export const generateReservationsPDF = (reservations, filters = {}, options = {}) => {
  try {
    const {
      title = 'Reporte de Reservas',
      filename = `reservas-${new Date().toISOString().split('T')[0]}.pdf`,
      includeFilters = true,
      includeSummary = true
    } = options;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    // Configurar fuentes
    pdf.setFont('helvetica');

    // Título
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Fecha de generación
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Generado: ${dateStr}`, margin, yPosition);
    yPosition += 8;

    // Filtros aplicados
    if (includeFilters && Object.keys(filters).length > 0) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Filtros aplicados:', margin, yPosition);
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const filterLines = [];
      
      if (filters.status && filters.status !== 'all') {
        const statusMap = {
          'pendiente': 'Pendientes',
          'activa': 'Activas', 
          'finalizada': 'Finalizadas',
          'cancelada': 'Canceladas'
        };
        filterLines.push(`Estado: ${statusMap[filters.status] || filters.status}`);
      }
      
      if (filters.startDate) {
        filterLines.push(`Desde: ${formatDateForDisplay(filters.startDate)}`);
      }
      
      if (filters.endDate) {
        filterLines.push(`Hasta: ${formatDateForDisplay(filters.endDate)}`);
      }
      
      if (filterLines.length > 0) {
        pdf.text(filterLines.join(' | '), margin, yPosition);
        yPosition += 8;
      }
    }

    yPosition += 5;

    // Verificar si hay reservas
    if (!reservations || reservations.length === 0) {
      pdf.setFontSize(12);
      pdf.text('No hay reservas para mostrar', pageWidth / 2, yPosition, { align: 'center' });
      pdf.save(filename);
      return { success: true, filename };
    }

    // Encabezados de tabla
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    
    const columns = [
      { name: 'Recurso', width: 50 },
      { name: 'Fecha', width: 25 },
      { name: 'Horario', width: 25 },
      { name: 'Estado', width: 25 },
      { name: 'Detalles', width: 65 }
    ];

    // Dibujar línea de encabezado
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    
    let xPosition = margin;
    columns.forEach((col, index) => {
      pdf.text(col.name, xPosition + 2, yPosition);
      
      // Dibujar bordes
      if (index === 0) {
        pdf.line(xPosition, yPosition - 4, xPosition, yPosition + 4);
      }
      pdf.line(xPosition + col.width, yPosition - 4, xPosition + col.width, yPosition + 4);
      
      xPosition += col.width;
    });
    
    // Línea superior e inferior
    pdf.line(margin, yPosition - 4, margin + 190, yPosition - 4);
    pdf.line(margin, yPosition + 4, margin + 190, yPosition + 4);
    
    yPosition += 8;

    // Contenido de la tabla
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    reservations.forEach((reservation, index) => {
      // Verificar si necesitamos nueva página
      if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPosition = margin;
        
        // Redibujar encabezados
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        
        xPosition = margin;
        columns.forEach((col, colIndex) => {
          pdf.text(col.name, xPosition + 2, yPosition);
          
          if (colIndex === 0) {
            pdf.line(xPosition, yPosition - 4, xPosition, yPosition + 4);
          }
          pdf.line(xPosition + col.width, yPosition - 4, xPosition + col.width, yPosition + 4);
          
          xPosition += col.width;
        });
        
        pdf.line(margin, yPosition - 4, margin + 190, yPosition - 4);
        pdf.line(margin, yPosition + 4, margin + 190, yPosition + 4);
        
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
      }

      xPosition = margin;
      
      // Recurso
      const resourceName = reservation.resource?.name || reservation.Resource?.name || reservation.resourceName || 'N/A';
      const lines1 = pdf.splitTextToSize(resourceName, columns[0].width - 4);
      pdf.text(lines1[0], xPosition + 2, yPosition);
      xPosition += columns[0].width;
      
      // Fecha
      const date = new Date(reservation.startDateTime || reservation.date || reservation.startDate);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      pdf.text(dateStr, xPosition + 2, yPosition);
      xPosition += columns[1].width;
      
      // Horario
      const startTime = formatTime(reservation.startDateTime || reservation.startTime);
      const endTime = formatTime(reservation.endDateTime || reservation.endTime);
      pdf.text(`${startTime}-${endTime}`, xPosition + 2, yPosition);
      xPosition += columns[2].width;
      
      // Estado con color
      const status = reservation.status?.toLowerCase();
      const statusText = getStatusText(status);
      const statusColor = getStatusColor(status);
      
      // Guardar color actual
      const currentColor = pdf.getTextColor();
      
      // Establecer color según estado
      pdf.setTextColor(statusColor.r, statusColor.g, statusColor.b);
      pdf.text(statusText, xPosition + 2, yPosition);
      
      // Restaurar color
      pdf.setTextColor(currentColor);
      xPosition += columns[3].width;
      
      // Detalles
      let details = '';
      if (reservation.rating || reservation.ratingValue) {
        details = `Calificación: ⭐ ${reservation.rating || reservation.ratingValue}/5`;
        if (reservation.comment) {
          details += ` - ${reservation.comment.substring(0, 30)}...`;
        }
      } else if (reservation.purpose) {
        details = reservation.purpose.substring(0, 40);
      }
      
      if (details) {
        const lines2 = pdf.splitTextToSize(details, columns[4].width - 4);
        pdf.text(lines2[0], xPosition + 2, yPosition);
      }
      
      // Línea separadora
      pdf.setDrawColor(240, 240, 240);
      pdf.setLineWidth(0.2);
      pdf.line(margin, yPosition + 3, margin + 190, yPosition + 3);
      
      yPosition += 7;
    });

    // Resumen
    if (includeSummary) {
      yPosition += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, margin + 190, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumen', margin, yPosition);
      yPosition += 6;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Contar por estado
      const statusCount = {
        pendiente: 0,
        activa: 0,
        finalizada: 0,
        cancelada: 0,
        otros: 0
      };
      
      reservations.forEach(res => {
        const status = res.status?.toLowerCase();
        if (statusCount.hasOwnProperty(status)) {
          statusCount[status]++;
        } else {
          statusCount.otros++;
        }
      });
      
      let summaryX = margin;
      let summaryY = yPosition;
      
      Object.entries(statusCount).forEach(([status, count]) => {
        if (count > 0) {
          const statusText = getStatusText(status);
          pdf.text(`${statusText}: ${count}`, summaryX, summaryY);
          summaryY += 5;
          
          // Nueva columna si llegamos al final
          if (summaryY > pdf.internal.pageSize.getHeight() - 20) {
            summaryX += 40;
            summaryY = yPosition;
          }
        }
      });
      
      yPosition = summaryY + 5;
      
      // Total
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total de reservas: ${reservations.length}`, margin, yPosition);
    }

    // Guardar PDF
    pdf.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generando PDF de reservas:', error);
    throw error;
  }
};

/**
 * Función auxiliar para formatear fecha
 */
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Función auxiliar para formatear hora
 */
const formatTime = (dateString) => {
  if (!dateString) return '--:--';
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Función auxiliar para obtener texto del estado
 */
const getStatusText = (status) => {
  const statusMap = {
    'pendiente': 'Pendiente',
    'activa': 'Activa',
    'finalizada': 'Finalizada',
    'cancelada': 'Cancelada'
  };
  return statusMap[status] || status || 'Desconocido';
};

/**
 * Función auxiliar para obtener color del estado
 */
const getStatusColor = (status) => {
  const colorMap = {
    'pendiente': { r: 245, g: 158, b: 11 }, // Naranja
    'activa': { r: 16, g: 185, b: 129 },    // Verde
    'finalizada': { r: 59, g: 130, b: 246 }, // Azul
    'cancelada': { r: 239, g: 68, b: 68 }    // Rojo
  };
  return colorMap[status] || { r: 107, g: 114, b: 128 }; // Gris por defecto
};

/**
 * Genera un PDF simple con texto
 */
export const generateSimplePDF = (title, content, filename = 'documento.pdf') => {
  const pdf = new jsPDF();
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 20, 20);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const lines = pdf.splitTextToSize(content, 170);
  pdf.text(lines, 20, 30);
  
  pdf.save(filename);
  return { success: true, filename };
};