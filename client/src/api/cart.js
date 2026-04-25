import api from './axios';

export const getMyCartAPI = () => api.get('/cart');
export const replaceMyCartAPI = (items) => api.put('/cart', { items });
export const mergeMyCartAPI = (items) => api.post('/cart/merge', { items });
export const clearMyCartAPI = () => api.delete('/cart');
