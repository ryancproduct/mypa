import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { pwaService, initializePWA } from './services/pwaService';
import { notificationService, setPwaService } from './services/notificationService';
import { offlineStorageService } from './services/offlineStorageService';

// Initialize services
try {
  initializePWA();
  setPwaService(pwaService);
  offlineStorageService.initialize().catch(error => 
    console.warn('Offline storage initialization failed:', error)
  );
  notificationService.initialize().catch(error => 
    console.warn('Notification service initialization failed:', error)
  );
} catch (error) {
  console.warn('Service initialization failed:', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

