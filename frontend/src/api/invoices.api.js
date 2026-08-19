import apiClient from './client.js';

// @desc    Get all invoices (supports optional user, paymentStatus, booking query parameters)
// @endpoint GET /api/invoices
export const getInvoices = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/invoices${query ? `?${query}` : ''}`);
};

// @desc    Get single invoice details by ID
// @endpoint GET /api/invoices/:id
export const getInvoiceById = async (id) => {
  return apiClient.get(`/invoices/${id}`);
};

// @desc    Create new invoice from completed booking (Admin / Service Manager)
// @endpoint POST /api/invoices
export const createInvoice = async (invoiceData) => {
  return apiClient.post('/invoices', invoiceData);
};

// @desc    Update invoice payment method (Admin / Service Manager)
// @endpoint PUT /api/invoices/:id
export const updateInvoice = async (id, invoiceData) => {
  return apiClient.put(`/invoices/${id}`, invoiceData);
};

// @desc    Update invoice payment status (Admin / Service Manager)
// @endpoint PATCH /api/invoices/:id/payment-status
export const updatePaymentStatus = async (id, paymentStatus) => {
  return apiClient.patch(`/invoices/${id}/payment-status`, { paymentStatus });
};

// @desc    Download invoice PDF blob
// @endpoint GET /api/invoices/:id/download
export const downloadInvoice = async (id) => {
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const response = await fetch(`${baseUrl}/invoices/${id}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch (e) {
      errorJson = { message: 'Failed to download invoice' };
    }
    throw errorJson;
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
  let filename = `invoice-${id}.pdf`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  return { blob, filename };
};
