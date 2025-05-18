
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setGlobalIdsFromUrl } from './utils/setGlobalIdsFromUrl'

console.log("[main.tsx] Iniciando la aplicación, extrayendo parámetros de URL primero");

// Ejecutamos la función para capturar los parámetros de URL antes de renderizar la aplicación
setGlobalIdsFromUrl().then(() => {
  console.log("[main.tsx] Parámetros de URL extraídos, iniciando renderizado de la aplicación");
  createRoot(document.getElementById("root")!).render(<App />);
});
