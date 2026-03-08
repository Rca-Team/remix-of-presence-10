import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { loadModels, areModelsLoaded } from './services/FaceRecognitionService'
import { toast } from 'sonner'

// If a previous PWA service worker cached an older bundle (common after remixing),
// it can serve JS built without the latest env injection, causing `supabaseUrl is required`.
// We proactively unregister and clear caches once on startup to force a fresh load.
const unregisterStaleServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    // Best-effort only; do not block app startup.
    console.warn('Service worker cleanup skipped:', e);
  }
};

void unregisterStaleServiceWorkers();


// Improved model loading with retry mechanism
const loadFaceModels = async (retries = 2, delay = 1500) => {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      if (areModelsLoaded()) {
        console.log('Face recognition models already loaded');
        return true;
      }
      
      console.log(`Loading face recognition models (attempt ${attempt + 1}/${retries + 1})...`);
      await loadModels();
      console.log('Face recognition models loaded successfully');
      return true;
    } catch (err) {
      console.error(`Error loading face models (attempt ${attempt + 1}/${retries + 1}):`, err);
      
      if (attempt < retries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Increase delay for each retry using exponential backoff
        delay = delay * 1.5;
      }
      
      attempt++;
    }
  }
  
  console.error(`Failed to load face models after ${retries + 1} attempts`);
  return false;
}

// Initialize application
const initApp = () => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark">
        <App />
      </ThemeProvider>
    </StrictMode>
  );
  
  // Load face models after app is rendered
  loadFaceModels()
    .then(success => {
      if (!success) {
        setTimeout(() => {
          toast.error('Failed to pre-load face recognition models. Some features may not work correctly.', {
            duration: 6000,
            id: 'face-models-error' // Prevent duplicate toasts
          });
        }, 1000);
      }
    });
}

// Start the application
initApp();
