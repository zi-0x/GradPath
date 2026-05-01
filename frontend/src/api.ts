import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
});

let sessionToken: string | null = null;

function syncSessionHeader() {
  if (sessionToken) {
    client.defaults.headers.common['X-Session-Token'] = sessionToken;
  } else {
    delete client.defaults.headers.common['X-Session-Token'];
  }
}

export function setSessionToken(token: string | null) {
  sessionToken = token;
  syncSessionHeader();
}

export function clearSessionToken() {
  setSessionToken(null);
}

syncSessionHeader();

export const api = {
  health: () => client.get('/health').then((r) => r.data),
  demoPersonas: () => client.get('/demo/personas').then((r) => r.data),
  register: (payload: unknown) => client.post('/auth/register', payload).then((r) => r.data),
  login: (payload: unknown) => client.post('/auth/login', payload).then((r) => r.data),
  activatePersona: (personaId: string) => client.post(`/demo/personas/${personaId}/activate`).then((r) => r.data),
  me: () => client.get('/users/me').then((r) => r.data),
  updateMe: (payload: unknown) => client.patch('/users/me', payload).then((r) => r.data),
  onboarding: (payload: unknown) => client.post('/users/me/onboarding', payload).then((r) => r.data),
  universities: (params?: Record<string, unknown>) => client.get('/universities', { params }).then((r) => r.data),
  universityDetail: (universityId: string) => client.get(`/universities/${universityId}`).then((r) => r.data),
  shortlistUniversity: (universityId: string) => client.post(`/universities/${universityId}/shortlist`).then((r) => r.data),
  unshortlistUniversity: (universityId: string) => client.delete(`/universities/${universityId}/shortlist`).then((r) => r.data),
  generateRecommendations: () => client.post('/recommendations/generate').then((r) => r.data),
  myRecommendations: () => client.get('/recommendations/me').then((r) => r.data),
  recommendations: (payload: unknown) => client.post('/recommendations', payload).then((r) => r.data),
  roi: (payload: unknown) => client.post('/roi', payload).then((r) => r.data),
  admit: (payload: unknown) => client.post('/admit-predictor', payload).then((r) => r.data),
  sop: (payload: unknown) => client.post('/sop/generate', payload).then((r) => r.data),
  loanEligibility: (payload: unknown) => client.post('/loan/eligibility', payload).then((r) => r.data),
  emi: (payload: unknown) => client.post('/loan/emi', payload).then((r) => r.data),
  loanOffers: () => client.get('/loan/offers').then((r) => r.data),
  acceptLoanOffer: (offerId: string) => client.post(`/loan/offers/${offerId}/accept`).then((r) => r.data),
  nudgesMe: () => client.get('/nudges/me').then((r) => r.data),
  markNudgeRead: (nudgeId: string) => client.post(`/nudges/${nudgeId}/read`).then((r) => r.data),
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
  resetDemo: () => client.post('/admin/reset-demo').then((r) => r.data),
  initDb: () => client.post('/admin/init-db').then((r) => r.data),

  // Admin CRUD: Universities
  adminUniversities: (page = 1, pageSize = 20) =>
    client.get('/admin/universities', { params: { page, page_size: pageSize } }).then((r) => r.data),
  adminCreateUniversity: (payload: unknown) => client.post('/admin/universities', payload).then((r) => r.data),
  adminUpdateUniversity: (uniId: string, payload: unknown) => client.patch(`/admin/universities/${uniId}`, payload).then((r) => r.data),
  adminDeleteUniversity: (uniId: string) => client.delete(`/admin/universities/${uniId}`).then((r) => r.data),

  // Admin CRUD: Loan Offers
  adminLoanOffers: (page = 1, pageSize = 20) =>
    client.get('/admin/loan-offers', { params: { page, page_size: pageSize } }).then((r) => r.data),
  adminCreateLoanOffer: (payload: unknown) => client.post('/admin/loan-offers', payload).then((r) => r.data),
  adminUpdateLoanOffer: (offerId: string, payload: unknown) => client.patch(`/admin/loan-offers/${offerId}`, payload).then((r) => r.data),
  adminDeleteLoanOffer: (offerId: string) => client.delete(`/admin/loan-offers/${offerId}`).then((r) => r.data),

  // Admin CRUD: Nudges
  adminNudges: (page = 1, pageSize = 20) =>
    client.get('/admin/nudges', { params: { page, page_size: pageSize } }).then((r) => r.data),
  adminCreateNudge: (payload: unknown) => client.post('/admin/nudges', payload).then((r) => r.data),
  adminUpdateNudge: (nudgeId: string, payload: unknown) => client.patch(`/admin/nudges/${nudgeId}`, payload).then((r) => r.data),
  adminDeleteNudge: (nudgeId: string) => client.delete(`/admin/nudges/${nudgeId}`).then((r) => r.data),
};
