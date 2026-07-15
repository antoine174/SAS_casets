import axios from 'axios';

const api = axios.create({ baseURL: '/' });

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const getSuppliers   = ()           => api.get('/api/suppliers');
export const createSupplier = (data)       => api.post('/api/suppliers', data);
export const updateSupplier = (id, data)   => api.put(`/api/suppliers/${id}`, data);
export const deleteSupplier = (id)         => api.delete(`/api/suppliers/${id}`);

// ─── Cars ─────────────────────────────────────────────────────────────────────
export const getCars   = (supplierId)    => api.get('/api/cars', { params: { supplierId } });
export const createCar = (data)          => api.post('/api/cars', data);
export const updateCar = (id, data)      => api.put(`/api/cars/${id}`, data);
export const deleteCar = (id)            => api.delete(`/api/cars/${id}`);

// ─── Parts ────────────────────────────────────────────────────────────────────
export const getParts  = (params)        => api.get('/api/parts', { params });
export const deletePart = (id)           => api.delete(`/api/parts/${id}`);

export const createPart = (formData) =>
  api.post('/api/parts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const updatePart = (id, formData) =>
  api.put(`/api/parts/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchParts = (query) => api.get('/api/parts', { params: { search: query } });

// ─── Bulk Import ──────────────────────────────────────────────────────────────
export const analyzeBulkImport = (data) => api.post('/api/parts/bulk-analyze', data);
export const commitBulkImport  = (data) => api.post('/api/parts/bulk-commit',  data);
