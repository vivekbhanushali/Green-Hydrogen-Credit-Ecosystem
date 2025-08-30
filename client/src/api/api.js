import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Authentication APIs
export const login = (credentials) => api.post('/login', credentials);
export const signup = (userData) => api.post('/signup', userData);
export const getProfile = () => api.get('/profile');

// NGO APIs
export const getNGOCredits = () => api.get('/NGO/my-credits');
export const createNGOCredit = (creditData) => api.post('/NGO/credits', creditData);
export const getTransactions = () => api.get('/NGO/transactions');

// Buyer APIs
export const getBuyerCredits = () => api.get('/buyer/credits');
export const getCreditDetailsAPI = (creditId) => api.get(`/buyer/credits/${creditId}`);
export const purchaseCredit = (purchaseData) => api.post('/buyer/purchase', purchaseData);
export const getPurchasedCredits = () => api.get('/buyer/purchased-credits');
export const generateCertificate = (creditId) => api.get(`/buyer/generate-certificate/${creditId}`);
export const downloadCertificate = (creditId) => api.get(`/buyer/download-certificate/${creditId}`);

// Auditor APIs
export const getAssignedCredits = () => api.get('/auditor/credits');
export const auditCreditApi = (auditData) => api.patch(`/auditor/audit/${auditData["creditId"]}`, auditData);

// Health check
export const getHealth = () => api.get('/health');

// Legacy/placeholder APIs that are now implemented in the full_server.py
export const sellCreditApi = (sellData) => api.patch('/buyer/sell', sellData);
export const removeSaleCreditApi = (removeData) => api.patch('/buyer/remove-from-sale', removeData);
export const expireCreditApi = (expireCreditId) => api.patch(`/NGO/credits/expire/${expireCreditId}`);
export const verifyBeforeExpire = (verificationData) => api.post(`/NGO/expire-req`, verificationData);
export const checkAuditorsNumber = (amount) => api.get(`/NGO/audit-req`, { params: { amount } });

// 🚀 NEW ENHANCED API ENDPOINTS
export const getPortfolioAnalytics = () => api.get('/buyer/portfolio-analytics');
export const getMarketTrends = () => api.get('/buyer/market-trends');
export const getRecommendations = () => api.get('/buyer/recommendations');
export const getNotifications = () => api.get('/buyer/notifications');

// 🧠 ML VERIFICATION API ENDPOINTS
export const submitVerification = (data) => api.post('/verification/submit', data);
export const mlVerify = (data) => api.post('/verification/ml-verify', data);
export const getPendingVerifications = () => api.get('/verification/pending');
export const approveVerification = (verificationId, data) => api.post(`/verification/${verificationId}/approve`, data);
export const rejectVerification = (verificationId, data) => api.post(`/verification/${verificationId}/reject`, data);
export const getIndustryVerificationStatus = () => api.get('/verification/industry-status');

export default api;
