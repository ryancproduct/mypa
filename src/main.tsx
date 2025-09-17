import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeApp } from './services/appService';
import { offlineStorageService } from './services/offlineStorageService';

// Initialize services
try {
  initializeApp();
  offlineStorageService.initialize().catch(error => 
    console.warn('Offline storage initialization failed:', error)
  );
} catch (error) {
  console.warn('Service initialization failed:', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

