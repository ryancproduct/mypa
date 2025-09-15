import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Try to initialize PWA features with better error handling
try {
  // Dynamically import to avoid blocking the main thread
  import('./services/pwaService').then(({ initializePWA }) => {
    initializePWA();
  }).catch(error => console.warn('PWA initialization failed:', error));
  
  // Initialize offline storage asynchronously
  import('./services/offlineStorageService').then(({ offlineStorageService }) => {
    offlineStorageService.initialize().catch(error => 
      console.warn('Offline storage initialization failed:', error)
    );
  }).catch(error => console.warn('Offline storage import failed:', error));
  
  // Initialize notifications asynchronously  
  import('./services/notificationService').then(({ notificationService }) => {
    notificationService.initialize().catch(error => 
      console.warn('Notification service initialization failed:', error)
    );
  }).catch(error => console.warn('Notification service import failed:', error));
  
} catch (error) {
  console.warn('Service initialization failed:', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

