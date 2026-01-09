// src/integrations/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';
import { v4 as uuidv4 } from 'uuid';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const getUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('userId', userId);
  }
  return userId;
};

const logEvent = (eventName: string, params?: { [key: string]: string | number | undefined }) => {
  const userId = getUserId();
  firebaseLogEvent(analytics, eventName, { ...params, user_id: userId });
};

export const trackPageView = () => {
  logEvent('page_view');
};

export const trackAuthenticationSuccess = () => {
  logEvent('authentication_success');
};

export const trackAuthenticationFailed = () => {
  logEvent('authentication_failed');
};

export const trackAppSelection = () => {
  logEvent('app_selection');
};

export const trackArtifactUploadStart = () => {
  logEvent('artifact_upload_start');
};

export const trackArtifactUploadComplete = (fileType: string, fileSize: number, uploadDuration: number) => {
  logEvent('artifact_upload_complete', {
    file_type: fileType,
    file_size: fileSize,
    upload_duration: uploadDuration,
  });
};

export const trackUploadFailed = () => {
  logEvent('upload_failed');
};

export const trackClearHistory = () => {
  logEvent('clear_history');
};

export const trackViewApiLogs = () => {
  logEvent('view_api_logs');
};

export const trackClickDonationLink = () => {
  logEvent('click_donation_link');
};

export const trackClickApiTokenGuide = () => {
  logEvent('click_api_token_guide');
};

export const trackApiError = () => {
  logEvent('api_error');
};
