
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setGlobalIdsFromUrl } from './utils/setGlobalIdsFromUrl'

// Ejecutamos la función para capturar los parámetros de URL antes de renderizar la aplicación
setGlobalIdsFromUrl().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
