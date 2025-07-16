import { api } from './client';

export const connectAccount = (accountData) => {
  return api.post('/api/v1/broker/connect', accountData);
};

export const getAccounts = () => {
  return api.get('/api/v1/broker/accounts');
};
