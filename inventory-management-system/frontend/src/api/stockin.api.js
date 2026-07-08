const STOCKIN_URL = '/api/stockin';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const stored = localStorage.getItem('ims_user');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {}
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw { response: { data } }; // Mock Axios error format
  }
  return data;
};

export const getStockInRecords = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${STOCKIN_URL}?${query}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const getStockInRecord = async (id) => {
  const res = await fetch(`${STOCKIN_URL}/${id}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const createStockInRecord = async (recordData) => {
  const res = await fetch(STOCKIN_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(recordData)
  });
  return handleResponse(res);
};

export const updateStockInRecord = async (id, recordData) => {
  const res = await fetch(`${STOCKIN_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(recordData)
  });
  return handleResponse(res);
};

export const deleteStockInRecord = async (id) => {
  const res = await fetch(`${STOCKIN_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};
