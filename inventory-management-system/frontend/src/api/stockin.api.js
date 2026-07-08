import api from './api';

const STOCKIN_URL = '/api/stockin';

export const getStockInRecords = async (params = {}) => {
  const res = await api.get(STOCKIN_URL, { params });
  return res.data;
};

export const getStockInRecord = async (id) => {
  const res = await api.get(`${STOCKIN_URL}/${id}`);
  return res.data;
};

export const createStockInRecord = async (recordData) => {
  const res = await api.post(STOCKIN_URL, recordData);
  return res.data;
};

export const updateStockInRecord = async (id, recordData) => {
  const res = await api.put(`${STOCKIN_URL}/${id}`, recordData);
  return res.data;
};

export const deleteStockInRecord = async (id) => {
  const res = await api.delete(`${STOCKIN_URL}/${id}`);
  return res.data;
};
