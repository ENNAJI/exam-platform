import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initDemoData, storage } from './data/storage'

// Charger les données du serveur puis initialiser les données de démo si nécessaire
const initApp = async () => {
  // Essayer de charger les données depuis le serveur
  await storage.loadFromServer();
  
  // Initialiser les données de démonstration si vides
  initDemoData();
  
  // Synchroniser avec le serveur
  storage.syncToServer();
};

initApp();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
