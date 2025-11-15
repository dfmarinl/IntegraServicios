import { mockReservations, mockResources } from './mockData';

const USE_MOCK = true;

export const getMostReservedResources = async (startDate, endDate) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));

    const filtered = mockReservations.filter(r => {
      const date = r.date;
      return date >= startDate && date <= endDate && r.status !== 'cancelled';
    });

    const counts = {};
    filtered.forEach(r => {
      if (!counts[r.resourceId]) {
        counts[r.resourceId] = {
          resourceId: r.resourceId,
          resourceName: r.resourceName,
          count: 0,
        };
      }
      counts[r.resourceId].count++;
    });

    const result = Object.values(counts).sort((a, b) => b.count - a.count);

    return { data: result, success: true };
  }

  const response = await fetch(`/api/reports/most-reserved?startDate=${startDate}&endDate=${endDate}`);
  return await response.json();
};

export const getMostLoanedResource = async (startDate, endDate) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const result = {
      resourceId: '1',
      resourceName: 'Aula 101',
      loanCount: 45,
    };

    return { data: result, success: true };
  }

  const response = await fetch(`/api/reports/most-loaned?startDate=${startDate}&endDate=${endDate}`);
  return await response.json();
};

export const getRatingsReport = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const ratedReservations = mockReservations.filter(r => r.rating);

    const byResource = {};
    ratedReservations.forEach(r => {
      if (!byResource[r.resourceId]) {
        byResource[r.resourceId] = {
          resourceName: r.resourceName,
          ratings: [],
        };
      }
      byResource[r.resourceId].ratings.push(r.rating);
    });

    const result = Object.entries(byResource).map(([id, data]) => ({
      resourceId: id,
      resourceName: data.resourceName,
      averageRating: (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(2),
      totalRatings: data.ratings.length,
    }));

    return { data: result, success: true };
  }

  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/reports/ratings?${queryParams}`);
  return await response.json();
};
