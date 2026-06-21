import api from '../api';
import { Platform } from 'react-native';

const buildExpenseFormData = (payload = {}) => {
  const formData = new FormData();
  formData.append('title', payload.title || '');
  formData.append('amount', String(payload.amount || 0));
  formData.append('category', payload.category || 'OTHER');
  formData.append('paidAt', payload.paidAt || new Date().toISOString());
  formData.append('note', payload.note || '');

  if (payload.bill) {
    formData.append('bill', {
      uri: Platform.OS === 'ios' ? payload.bill.uri.replace('file://', '') : payload.bill.uri,
      name: payload.bill.name || `bill_${Date.now()}.jpg`,
      type: payload.bill.type || 'image/jpeg',
    });
  }

  return formData;
};

export const getTripExpenses = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/expenses`);
  return response.data;
};

export const createExpense = async (tripId, payload) => {
  const response = await api.post(`/trips/${tripId}/expenses`, buildExpenseFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateExpense = async (expenseId, payload) => {
  const response = await api.put(`/expenses/${expenseId}`, buildExpenseFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteExpense = async (expenseId) => {
  const response = await api.delete(`/expenses/${expenseId}`);
  return response.data;
};
