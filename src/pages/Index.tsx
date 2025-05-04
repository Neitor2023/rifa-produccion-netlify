
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect to VentaBoletos page web
    navigate("/venta-boletos");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Romy Rifa</h1>
        <p className="text-xl text-gray-600 mb-6">Sistema de venta de boletos para rifas</p>
        <Button 
          onClick={() => navigate("/venta-boletos")}
          className="bg-rifa-purple hover:bg-rifa-darkPurple"
        >
          Ir a Venta de Boletos
        </Button>
      </div>
    </div>
  );
};

export default Index;
