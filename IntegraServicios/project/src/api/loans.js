import { mockLoans } from './mockData';

const USE_MOCK = true;

let mockLoansData = [...mockLoans];

export const getLoans = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));

    let filtered = [...mockLoansData];

    if (filters.status) {
      filtered = filtered.filter(l => l.status === filters.status);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(l => l.loanDate >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(l => l.loanDate <= filters.dateTo);
    }

    return { data: filtered, success: true };
  }

  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/loans?${queryParams}`);
  return await response.json();
};

export const createLoan = async (loanData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const newLoan = {
      ...loanData,
      id: String(Date.now()),
      loanDate: new Date().toISOString(),
      status: 'active',
    };
    mockLoansData.push(newLoan);
    return { data: newLoan, success: true, message: 'Préstamo registrado exitosamente' };
  }

  const response = await fetch('/api/loans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loanData),
  });
  return await response.json();
};

export const registerReturn = async (loanId, employeeId) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockLoansData.findIndex(l => l.id === loanId);

    if (index !== -1) {
      mockLoansData[index].returnDate = new Date().toISOString();
      mockLoansData[index].status = 'returned';
      mockLoansData[index].returnEmployeeId = employeeId;
      return { data: mockLoansData[index], success: true, message: 'Devolución registrada exitosamente' };
    }

    return { success: false, message: 'Préstamo no encontrado' };
  }

  const response = await fetch(`/api/loans/${loanId}/return`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return await response.json();
};
