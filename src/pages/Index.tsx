
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Ya no redireccionamos automáticamente aquí, ya que lo hacemos en App.tsx
    // y preservamos los parámetros de la URL
    console.log("[Index.tsx] Página Index cargada, no redireccionando (ya se hizo en App.tsx)");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Romy Rifa</h1>
        <p className="text-xl text-gray-600 mb-6">Sistema de venta de boletos para rifas</p>
        <Button 
          onClick={() => {
            // Preservar los parámetros de la URL al navegar
            const currentParams = new URLSearchParams(window.location.search).toString();
            const queryString = currentParams ? `?${currentParams}` : '';
            navigate(`/venta-boletos${queryString}`);
          }}
          className="bg-rifa-purple hover:bg-rifa-darkPurple"
        >
          Ir a Venta de Boletos
        </Button>
      </div>
    </div>
  );
};

export default Index;
