
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import VentaBoletos from "./pages/VentaBoletos";
import NotFound from "./pages/NotFound";
import Receipt from './pages/Receipt';
import { RAFFLE_ID, SELLER_ID } from "./utils/setGlobalIdsFromUrl";

const queryClient = new QueryClient();

const App = () => {
  // Preservar los parámetros originales para redirecciones internas
  const preserveParams = () => {
    const params = new URLSearchParams(window.location.search);
    const prmtrRaffle = params.get('prmtrRaffle');
    const prmtrDNI = params.get('prmtrDNI');
    
    let queryString = '';
    if (prmtrRaffle || prmtrDNI) {
      const newParams = new URLSearchParams();
      if (prmtrRaffle) newParams.append('prmtrRaffle', prmtrRaffle);
      if (prmtrDNI) newParams.append('prmtrDNI', prmtrDNI);
      queryString = '?' + newParams.toString();
    }
    
    return queryString;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              <Route path="/" element={
                <Navigate to={`/venta-boletos${preserveParams()}`} replace />
              } />
              <Route path="/venta-boletos" element={<VentaBoletos />} />
              <Route path="/receipt/:id" element={<Receipt />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
