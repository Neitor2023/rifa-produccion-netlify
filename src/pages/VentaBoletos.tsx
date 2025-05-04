import React, { useState, useEffect } from 'react';
import NumberGrid from '@/components/NumberGrid';
import RaffleInfo from '@/components/RaffleInfo';
import PrizeCarousel from '@/components/PrizeCarousel';
import { Prize, PrizeImage, Organization } from '@/lib/constants';
import PrizeDetailModal from '@/components/PrizeDetailModal';
import PaymentModal from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';
import { Toaster } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { PaymentFormData } from '@/components/PaymentModal';
import DebugModal from '@/components/DebugModal';
import OrganizerInfo from '@/components/OrganizerInfo';
import RaffleHeader from '@/components/RaffleHeader';
import SellerInfo from '@/components/SellerInfo';
import { useParticipantManager } from '@/hooks/useParticipantManager';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (id: string | null): boolean => {
  if (!id) return false;
  return UUID_PATTERN.test(id);
};

const FALLBACK_SELLER_ID = "76c5b100-1530-458b-84d6-29fae68cd5d2";
const FALLBACK_RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

const formatPhoneNumber = (phone: string) => {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '+593' + cleanPhone.substring(1);
  } else if (!cleanPhone.includes('+')) {
    cleanPhone = '+' + cleanPhone;
  }
  return cleanPhone;
};

const getSellerIdFromUrl = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const sellerParam = urlParams.get('seller');
  
  if (sellerParam && isValidUUID(sellerParam)) {
    return sellerParam;
  }
  
  if (sellerParam) {
    console.log("Non-UUID seller ID provided:", sellerParam, "- Using fallback for now, will attempt to lookup by alternate identifier");
  }
  
  return FALLBACK_SELLER_ID;
};

const getRaffleIdFromUrl = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const raffleParam = urlParams.get('raffle');
  
  return (raffleParam && isValidUUID(raffleParam)) ? raffleParam : FALLBACK_RAFFLE_ID;
};

const VentaBoletos: React.FC = () => {
  const [raffleDetails, setRaffleDetails] = useState<any | null>(null);
  const [sellerDetails, setSellerDetails] = useState<any | null>(null);
  const [raffleNumbers, setRaffleNumbers] = useState<any[]>([]);
  const [raffleSeller, setRaffleSeller] = useState<any | null>(null);
  
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizeImages, setPrizeImages] = useState<PrizeImage[]>([]);
  
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);
  
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando datos de la rifa...');
  const [error, setError] = useState<string | null>(null);
  const [soldNumbersCount, setSoldNumbersCount] = useState(0);
  const [debugData, setDebugData] = useState<any>(null);
  
  const [validatedBuyerInfo, setValidatedBuyerInfo] = useState<ValidatedBuyerInfo | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { createParticipant } = useParticipantManager();

  const DEBUG_MODE = true;

  useEffect(() => {
    const sellerId = getSellerIdFromUrl();
    const raffleId = getRaffleIdFromUrl();
    
    console.log("VentaBoletos.tsx: Using seller:", sellerId, "and raffle:", raffleId, "(with UUID validation)");
    
    loadData(sellerId, raffleId);
  }, [location]);
  
  const loadData = async (sellerId: string, raffleId: string) => {
    try {
      setIsLoading(true);
      
      setLoadingMessage('Cargando detalles de la rifa...');
      const { data: raffleData, error: raffleError } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', raffleId)
        .single();
      
      if (raffleError) {
        throw new Error('Error al cargar los detalles de la rifa: ' + raffleError.message);
      }
      
      setRaffleDetails(raffleData);
      
      setLoadingMessage('Cargando información del vendedor...');
      let sellerData = null;

      const { data: sellerByUuid, error: sellerUuidError } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', sellerId)
        .maybeSingle();
      
      if (sellerByUuid) {
        sellerData = sellerByUuid;
        console.log("Found seller by UUID:", sellerData.id);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const sellerParam = urlParams.get('seller');
        
        if (sellerParam && sellerParam !== sellerId) {
          const { data: sellerByCedula, error: sellerCedulaError } = await supabase
            .from('sellers')
            .select('*')
            .eq('cedula', sellerParam)
            .maybeSingle();
            
          if (sellerByCedula) {
            sellerData = sellerByCedula;
            console.log("Found seller by cedula:", sellerData.id);
          }
        }
      }
      
      if (!sellerData) {
        throw new Error('No se pudo encontrar información del vendedor');
      }
      
      setSellerDetails(sellerData);
      
      const { data: raffleSellerData, error: raffleSellerError } = await supabase
        .from('raffle_sellers')
        .select('*')
        .eq('raffle_id', raffleId)
        .eq('seller_id', sellerData.id)
        .single();
      
      if (raffleSellerError || !raffleSellerData) {
        throw new Error('Error al cargar la relación vendedor-rifa: ' + 
          (raffleSellerError ? raffleSellerError.message : 'No se encontró la relación'));
      }
      
      setRaffleSeller(raffleSellerData);
      
      const { data: orgData, error: orgError } = await supabase
        .from('organization')
        .select('*')
        .single();
      
      if (orgData && !orgError) {
        setOrganizationData({
          org_name: orgData.org_name || 'Organizador',
          org_photo: orgData.org_photo || null,
          org_phone_number: orgData.org_phone_number || '',
          admin_name: orgData.admin_name || 'Administrador',
          admin_photo: orgData.admin_photo || null,
          admin_phone_number: orgData.admin_phone_number || '',
          organization_name: orgData.organization_name || 'Organización',
          organization_logo_url: orgData.organization_logo_url || null
        });
      }
      
      setLoadingMessage('Cargando premios...');
      const { data: prizesData, error: prizesError } = await supabase
        .from('prizes')
        .select('*')
        .eq('raffle_id', raffleId)
        .order('created_at', { ascending: true });
      
      if (!prizesError && prizesData) {
        setPrizes(prizesData as Prize[]);
      } else {
        console.error('Error al cargar los premios:', prizesError);
      }

      const { data: prizeImagesData, error: prizeImagesError } = await supabase
        .from('raffle_prize_images')
        .select('*')
        .eq('prize_id', prizesData?.[0]?.id);
      
      if (!prizeImagesError && prizeImagesData) {
        setPrizeImages(prizeImagesData as PrizeImage[]);
      } else {
        console.error('Error al cargar las imágenes de los premios:', prizeImagesError);
      }
      
      setLoadingMessage('Cargando números disponibles...');
      const { data: numbersData, error: numbersError } = await supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', raffleId)
        .eq('seller_id', sellerData.id);
      
      if (numbersError) {
        throw new Error('Error al cargar los números: ' + numbersError.message);
      }
      
      setRaffleNumbers(numbersData || []);
      
      const soldCount = numbersData?.filter(n => n.status === 'sold').length || 0;
      setSoldNumbersCount(soldCount);
      
      if (DEBUG_MODE) {
        setDebugData({
          raffleDetails: raffleData,
          sellerDetails: sellerData,
          raffleSellerDetails: raffleSellerData,
          numbersCount: numbersData?.length || 0,
          soldCount: soldCount,
          prizesCount: prizesData?.length || 0,
        });
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePrizeClick = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsPrizeModalOpen(true);
  };
  
  const handleReserveNumbers = async (
    selectedNumbers: string[],
    buyerPhone?: string,
    buyerName?: string,
    buyerCedula?: string
  ) => {
    if (
      !selectedNumbers.length || 
      !buyerPhone || 
      !buyerName || 
      !raffleDetails?.id || 
      !sellerDetails?.id
    ) {
      console.error('VentaBoletos.tsx: Faltan datos necesarios para reservar números');
      return;
    }
    
    try {
      console.log('VentaBoletos.tsx: Reservando números:', {
        selectedNumbers,
        buyerPhone,
        buyerName,
        buyerCedula
      });
      
      const formattedPhone = formatPhoneNumber(buyerPhone);
      
      const participantData = {
        name: buyerName,
        phone: formattedPhone,
        cedula: buyerCedula,
        email: '',
        raffle_id: raffleDetails.id,
        seller_id: sellerDetails.id
      };
      
      const participant = await createParticipant(participantData);
      
      if (!participant || !participant.id) {
        throw new Error('No se pudo crear el participante');
      }
      
      const numberUpdates = selectedNumbers.map(number => {
        const paddedNumber = parseInt(number);
        return {
          raffle_id: raffleDetails.id,
          seller_id: sellerDetails.id,
          participant_id: participant.id,
          number: paddedNumber,
          status: 'reserved',
          participant_name: buyerName,
          participant_phone: formattedPhone,
          participant_cedula: buyerCedula || '',
          reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
      });
      
      console.log('VentaBoletos.tsx: Actualizando estado de números a "reserved":', numberUpdates);
      
      const { error: updateError } = await supabase
        .from('raffle_numbers')
        .upsert(numberUpdates);
        
      if (updateError) {
        throw new Error('Error al actualizar los números: ' + updateError.message);
      }
      
      const { data: refreshedNumbers, error: refreshError } = await supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', raffleDetails.id)
        .eq('seller_id', sellerDetails.id);
        
      if (!refreshError) {
        setRaffleNumbers(refreshedNumbers || []);
      }
      
      console.log('VentaBoletos.tsx: Números reservados exitosamente');
      return true;
      
    } catch (error) {
      console.error('VentaBoletos.tsx: Error al reservar números:', error);
      return false;
    }
  };
  
  const handleProceedToPayment = (numbers: string[], participantData?: ValidatedBuyerInfo) => {
    console.log('VentaBoletos.tsx: Procediendo al pago para los números:', numbers);
    console.log('📦 VentaBoletos - Rendering PaymentModal with validatedBuyerData:', participantData);
    console.log('📦 Datos validados en VentaBoletos antes de pasarlos a PaymentModal:', participantData);
    
    setSelectedNumbers(numbers);
    setValidatedBuyerInfo(participantData || null);
    setIsPaymentModalOpen(true);
  };
  
  const handlePaymentComplete = (data: PaymentFormData) => {
    console.log('VentaBoletos.tsx: Pago completado con datos:', data);
    setPaymentData(data);
    setIsPaymentModalOpen(false);
    setIsVoucherModalOpen(true);
  };
  
  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
        >
          Volver al inicio
        </button>
      </div>
    );
  }
  
  if (!raffleDetails || !sellerDetails || !raffleSeller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-amber-500 mb-4">Datos no encontrados</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          No se pudieron encontrar los detalles de la rifa o del vendedor.
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
        >
          Volver al inicio
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {DEBUG_MODE && (
        <button 
          className="fixed bottom-4 right-4 bg-amber-500 text-white p-2 rounded z-50"
          onClick={() => setIsDebugModalOpen(true)}
        >
          Debug
        </button>
      )}
      
      {organizationData && <RaffleHeader organization={organizationData} />}
      
      <SellerInfo 
        name={sellerDetails.name} 
        phone={sellerDetails.phone || 'No disponible'}
        avatar={sellerDetails.avatar}
        id={sellerDetails.id}
      />
      
      {prizes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">
            Premios
          </h2>
          <PrizeCarousel prizes={prizes} onViewDetails={handlePrizeClick} />
        </section>
      )}
      
      <RaffleInfo
        description={raffleDetails.description}
        lottery={raffleDetails.lottery || 'No especificado'}
        dateLottery={raffleDetails.date_lottery || new Date().toISOString()}
        paymentInstructions={raffleDetails.payment_instructions || ''}
        price={raffleDetails.price}
        currency={raffleDetails.currency || 'USD'}
      />
      
      <NumberGrid
        numbers={raffleNumbers}
        raffleSeller={raffleSeller}
        onReserve={handleReserveNumbers}
        onProceedToPayment={handleProceedToPayment}
        debugMode={DEBUG_MODE}
        soldNumbersCount={soldNumbersCount}
      />
      
      {organizationData && <OrganizerInfo organization={organizationData} />}
      
      <PrizeDetailModal 
        isOpen={isPrizeModalOpen} 
        onClose={() => setIsPrizeModalOpen(false)} 
        prize={selectedPrize}
        prizeImages={prizeImages}
      />
      
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedNumbers={selectedNumbers}
        price={raffleDetails.price}
        onComplete={handlePaymentComplete}
        buyerData={validatedBuyerInfo}
        debugMode={DEBUG_MODE}
        raffleId={raffleDetails.id}
        sellerId={sellerDetails.id}
      />
      
      <DigitalVoucher
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        paymentData={paymentData}
        selectedNumbers={selectedNumbers}
        allowVoucherPrint={raffleSeller?.allow_voucher_print !== false}
        raffleDetails={{
          title: raffleDetails.title,
          price: raffleDetails.price,
          lottery: raffleDetails.lottery || '',
          dateLottery: raffleDetails.date_lottery 
            ? new Date(raffleDetails.date_lottery).toLocaleDateString() 
            : ''
        }}
      />
      
      {DEBUG_MODE && (
        <DebugModal
          isOpen={isDebugModalOpen}
          onClose={() => setIsDebugModalOpen(false)}
          data={debugData}
          title="🔍 Debug Information"
        />
      )}
      
      <Toaster
        position="top-right"
        visibleToasts={10}
        gap={12}
        closeButton
      />
    </div>
  );
};

export default VentaBoletos;
