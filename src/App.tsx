
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import VentaBoletos from "./pages/VentaBoletos";
import NotFound from "./pages/NotFound";
import Receipt from './pages/Receipt';
import { RAFFLE_ID, SELLER_ID } from "./utils/setGlobalIdsFromUrl";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/venta-boletos" element={<VentaBoletos />} />
            <Route path="/receipt/:id" element={<Receipt />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
