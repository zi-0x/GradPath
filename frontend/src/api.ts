import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
});

export const api = {
  health: () => client.get('/health').then((r) => r.data),
  recommendations: (payload: unknown) => client.post('/recommendations', payload).then((r) => r.data),
  roi: (payload: unknown) => client.post('/roi', payload).then((r) => r.data),
  admit: (payload: unknown) => client.post('/admit-predictor', payload).then((r) => r.data),
  sop: (payload: unknown) => client.post('/sop/generate', payload).then((r) => r.data),
  loanEligibility: (payload: unknown) => client.post('/loan/eligibility', payload).then((r) => r.data),
  emi: (payload: unknown) => client.post('/loan/emi', payload).then((r) => r.data),
  loanOffers: () => client.get('/loan/offers').then((r) => r.data),
  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return client.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  studentDashboard: () => client.get('/dashboard/student').then((r) => r.data),
  adminDashboard: () => client.get('/dashboard/admin').then((r) => r.data),
  gamification: () => client.get('/gamification').then((r) => r.data),
  mentor: (payload: unknown) => client.post('/mentor/chat', payload).then((r) => r.data),
};
