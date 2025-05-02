import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import NumberGrid from '@/components/NumberGrid';
import PrizeCarousel from '@/components/PrizeCarousel';
import PrizeDetailModal from '@/components/PrizeDetailModal';
import RaffleHeader from '@/components/RaffleHeader';
import RaffleInfo from '@/components/RaffleInfo';
import SellerInfo from '@/components/SellerInfo';
import OrganizerInfo from '@/components/OrganizerInfo';
import PaymentModal from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';
import DebugModal from '@/components/DebugModal';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import { Prize, PrizeImage, Organization } from '@/lib/constants';
import { PaymentFormData } from '@/components/PaymentModal';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { useBuyerInfo, BuyerInfoProvider } from '@/contexts/BuyerInfoContext';
import { useRaffleData } from '@/hooks/useRaffleData';

// Constants
const SELLER_ID = "e2a43af3-5ec5-4f17-bca7-7b61ea5e52b2"; // Valid UUID format
const RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

// Define interface for URL search parameters
interface QueryParams {
  sellerID?: string;
  debug?: string;
}

// Main VentaBoletos component
const VentaBoletos: React.FC = () => {
  return (
    <BuyerInfoProvider>
      <VentaBoletosContent />
    </BuyerInfoProvider>
  );
};

// Content component wrapped by BuyerInfoProvider
const VentaBoletosContent: React.FC = () => {
  const location = useLocation();
  const { buyerInfo } = useBuyerInfo();
  
  // States for loading and data
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);

  // States for modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false);
  const [isPrizeDetailModalOpen, setIsPrizeDetailModalOpen] = useState<boolean>(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  
  // States for data objects
  const [seller, setSeller] = useState<any>(null);
  const [raffle, setRaffle] = useState<any>(null);
  const [raffleSeller, setRaffleSeller] = useState<any>(null);
  const [raffleNumbers, setRaffleNumbers] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizeImages, setPrizeImages] = useState<PrizeImage[]>([]);
  const [lastPaymentData, setLastPaymentData] = useState<PaymentFormData | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  // Initialize file upload hook
  const { uploadFile, uploadError, isUploading } = useStorageUpload();

  // Parse query parameters from URL
  const queryParams: QueryParams = {};
  const searchParams = new URLSearchParams(location.search);
  queryParams.sellerID = searchParams.get('sellerID') || SELLER_ID;  // Use constant as fallback
  queryParams.debug = searchParams.get('debug') || undefined;

  // Set debug mode based on URL parameter
  useEffect(() => {
    if (queryParams.debug === "true") {
      setDebugMode(true);
      console.log("🐛 Debug mode enabled");
    }
  }, [queryParams.debug]);

  // Fetch seller, raffle, and related data
  useEffect(() => {
    const fetchData = async () => {
      if (!queryParams.sellerID) {
        toast.error('No se ha proporcionado un ID de vendedor');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch seller data
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers')
          .select('*')
          .eq('id', queryParams.sellerID)
          .single();

        if (sellerError) throw new Error(`Error al cargar datos del vendedor: ${sellerError.message}`);
        if (!sellerData) throw new Error('No se encontró el vendedor');
        setSeller(sellerData);

        // Find the active raffle for this seller
        const { data: raffleSellerData, error: raffleSellerError } = await supabase
          .from('raffle_sellers')
          .select('*')
          .eq('seller_id', queryParams.sellerID)
          .eq('active', true)
          .single();

        if (raffleSellerError) throw new Error(`Error al cargar datos de la rifa: ${raffleSellerError.message}`);
        if (!raffleSellerData) throw new Error('No hay rifas activas para este vendedor');
        setRaffleSeller(raffleSellerData);

        // Load raffle details
        const { data: raffleData, error: raffleError } = await supabase
          .from('raffles')
          .select('*')
          .eq('id', raffleSellerData.raffle_id || RAFFLE_ID)
          .single();

        if (raffleError) throw new Error(`Error al cargar detalles de la rifa: ${raffleError.message}`);
        if (!raffleData) throw new Error('No se encontraron detalles de la rifa');
        setRaffle(raffleData);

        // Load organization data
        const { data: orgData, error: orgError } = await supabase
          .from('organization')
          .select('*')
          .single();

        if (!orgError && orgData) setOrganization(orgData as Organization);

        // Load raffle numbers
        const { data: numbersData, error: numbersError } = await supabase
          .from('raffle_numbers')
          .select('*')
          .eq('raffle_id', raffleSellerData.raffle_id || RAFFLE_ID)
          .eq('seller_id', queryParams.sellerID);

        if (numbersError) throw new Error(`Error al cargar números de la rifa: ${numbersError.message}`);
        if (!numbersData) throw new Error('No se encontraron números para esta rifa');

        // Format numbers as padded strings
        const formattedNumbers = numbersData.map(n => ({
          ...n,
          number: n.number.toString().padStart(2, '0')
        }));
        setRaffleNumbers(formattedNumbers);

        // Load prizes
        const { data: prizesData, error: prizesError } = await supabase
          .from('prizes')
          .select('*')
          .eq('raffle_id', raffleSellerData.raffle_id || RAFFLE_ID);

        if (!prizesError && prizesData) setPrizes(prizesData as Prize[]);

        // Load prize images
        if (prizesData && prizesData.length > 0) {
          const prizeIds = prizesData.map(prize => prize.id);
          const { data: imagesData, error: imagesError } = await supabase
            .from('raffle_prize_images')
            .select('*')
            .in('prize_id', prizeIds);

          if (!imagesError && imagesData) {
            // Map received data to match PrizeImage interface
            const formattedImages: PrizeImage[] = imagesData.map(img => ({
              ...img,
              url_image: img.image_url // Ensure backward compatibility
            }));
            setPrizeImages(formattedImages);
          }
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Error al cargar datos');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [queryParams.sellerID]);

  // Calculate sold numbers count
  const soldNumbersCount = raffleNumbers.filter(n => n.status === 'sold').length;

  // Handle reserving numbers
  const handleReserveNumbers = async (
    selectedNums: string[],
    buyerPhone?: string,
    buyerName?: string,
    buyerCedula?: string
  ) => {
    try {
      if (!buyerPhone || !buyerName) {
        toast.error('Se requiere nombre y teléfono para reservar números');
        return;
      }

      // Check if participant already exists
      const { data: existingParticipant, error: participantError } = await supabase
        .from('participants')
        .select('id, name')
        .eq('phone', buyerPhone)
        .eq('raffle_id', raffleSeller.raffle_id)
        .maybeSingle();

      let participantId;

      if (participantError) {
        console.error('Error checking participant:', participantError);
        toast.error('Error al verificar participante');
        return;
      }

      if (existingParticipant) {
        participantId = existingParticipant.id;
        console.log(`Participante existente encontrado: ${existingParticipant.name} (ID: ${participantId})`);
      } else {
        // Create new participant - use a placeholder email if needed since it's required
        const { data: newParticipant, error: createError } = await supabase
          .from('participants')
          .insert({
            name: buyerName,
            phone: buyerPhone,
            email: `${buyerPhone}@placeholder.com`, // Add placeholder email since it's required
            cedula: buyerCedula || null,
            raffle_id: raffleSeller.raffle_id,
            seller_id: raffleSeller.seller_id
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating participant:', createError);
          toast.error('Error al crear participante');
          return;
        }

        participantId = newParticipant.id;
        console.log(`Nuevo participante creado con ID: ${participantId}`);
      }

      // Calculate expiration time (24 hours from now)
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24);

      // Update raffle numbers
      const updates = selectedNums.map(num => ({
        number: parseInt(num),
        raffle_id: raffleSeller.raffle_id,
        seller_id: raffleSeller.seller_id,
        status: 'reserved',
        participant_id: participantId,
        participant_name: buyerName,
        participant_phone: buyerPhone,
        participant_cedula: buyerCedula || null,
        reservation_expires_at: expirationTime.toISOString()
      }));

      const { error: updateError } = await supabase
        .from('raffle_numbers')
        .upsert(updates, { onConflict: 'raffle_id,number' });

      if (updateError) {
        console.error('Error updating raffle numbers:', updateError);
        toast.error('Error al reservar números');
        return;
      }

      // Refresh raffle numbers
      const { data: refreshedNumbers, error: refreshError } = await supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', raffleSeller.raffle_id)
        .eq('seller_id', raffleSeller.seller_id);

      if (!refreshError && refreshedNumbers) {
        const formattedRefreshed = refreshedNumbers.map(n => ({
          ...n,
          number: n.number.toString().padStart(2, '0')
        }));
        setRaffleNumbers(formattedRefreshed);
      }

      toast.success(`${selectedNums.length} número(s) reservados por 24 horas`);
    } catch (error: any) {
      console.error('Error reserving numbers:', error);
      toast.error(error.message || 'Error al reservar números');
    }
  };

  // Process payment and update number status to sold
  const handlePaymentComplete = async (paymentData: PaymentFormData) => {
    try {
      console.log('Processing payment with data:', paymentData);
      setLastPaymentData(paymentData);

      // Check if any numbers are selected
      if (!selectedNumbers.length) {
        toast.error('No hay números seleccionados para pagar');
        return;
      }

      // Prepare payment proof URL (if available)
      let paymentProofUrl = null;

      if (paymentData.paymentMethod === 'transfer' && paymentData.paymentProof) {
        const file = paymentData.paymentProof as File;
        const fileName = `payment_proof/${raffleSeller.raffle_id}/${Date.now()}_${file.name}`;

        const { url, error } = await uploadFile(file, fileName);
        if (error) {
          console.error('Error uploading payment proof:', error);
          toast.error('Error al subir comprobante de pago');
          return;
        }

        paymentProofUrl = url;
      }

      // Fetch participant information
      let participantId;
      const buyerPhone = paymentData.buyerPhone;

      // Use context buyer info or create new participant
      if (buyerInfo && buyerInfo.id) {
        participantId = buyerInfo.id;
        console.log(`Using existing participant ID from context: ${participantId}`);
      } else {
        // Check if participant already exists
        const { data: existingParticipant } = await supabase
          .from('participants')
          .select('id')
          .eq('phone', buyerPhone)
          .eq('raffle_id', raffleSeller.raffle_id)
          .maybeSingle();

        if (existingParticipant) {
          participantId = existingParticipant.id;
        } else {
          // Create new participant
          const { data: newParticipant, error: createError } = await supabase
            .from('participants')
            .insert({
              name: paymentData.buyerName,
              phone: paymentData.buyerPhone,
              email: paymentData.buyerEmail || `${paymentData.buyerPhone}@placeholder.com`, // Add email with fallback
              cedula: paymentData.buyerCedula || null,
              raffle_id: raffleSeller.raffle_id,
              seller_id: raffleSeller.seller_id,
              direccion: paymentData.direccion || null,
              sugerencia_producto: paymentData.sugerenciaProducto || null,
              nota: paymentData.nota || null
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating participant:', createError);
            toast.error('Error al crear participante');
            return;
          }

          participantId = newParticipant.id;
        }
      }

      // Update raffle numbers to sold status
      const updates = selectedNumbers.map(num => ({
        number: parseInt(num),
        raffle_id: raffleSeller.raffle_id,
        seller_id: raffleSeller.seller_id,
        status: 'sold',
        participant_id: participantId,
        participant_name: paymentData.buyerName,
        participant_phone: paymentData.buyerPhone,
        participant_cedula: paymentData.buyerCedula || null,
        payment_proof: paymentProofUrl,
        payment_approved: paymentData.paymentMethod === 'cash' // Auto-approve cash payments
      }));

      const { error: updateError } = await supabase
        .from('raffle_numbers')
        .upsert(updates, { onConflict: 'raffle_id,number' });

      if (updateError) {
        console.error('Error updating raffle numbers:', updateError);
        toast.error('Error al actualizar números');
        return;
      }

      // Refresh raffle numbers
      const { data: refreshedNumbers, error: refreshError } = await supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', raffleSeller.raffle_id)
        .eq('seller_id', raffleSeller.seller_id);

      if (!refreshError && refreshedNumbers) {
        const formattedRefreshed = refreshedNumbers.map(n => ({
          ...n,
          number: n.number.toString().padStart(2, '0')
        }));
        setRaffleNumbers(formattedRefreshed);
      }

      // Close payment modal and open voucher
      setIsPaymentModalOpen(false);
      setIsVoucherModalOpen(true);

      toast.success(`${selectedNumbers.length} número(s) pagados correctamente`);
    } catch (error: any) {
      console.error('Error completing payment:', error);
      toast.error(error.message || 'Error al procesar pago');
    }
  };

  // Handle proceeding to payment
  const handleProceedToPayment = (numbers: string[]) => {
    setSelectedNumbers(numbers);
    setIsPaymentModalOpen(true);
  };

  // Handle opening prize details modal
  const handleViewPrizeDetails = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsPrizeDetailModalOpen(true);
  };

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return <LoadingSpinner message="Cargando datos de la rifa..." />;
  }

  // Show error if seller or raffle not found
  if (!seller || !raffle || !raffleSeller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-gray-100">
            Error al cargar datos
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300">
            No se encontraron datos del vendedor o la rifa. Verifique el enlace e intente nuevamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* Debug button */}
      {debugMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsDebugModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Bug className="h-4 w-4 mr-2" /> Debug
          </Button>
        </div>
      )}
      
      {/* Raffle Header */}
      {organization && (
        <RaffleHeader organization={organization} />
      )}

      {/* Prize Carousel */}
      {prizes.length > 0 && (
        <PrizeCarousel 
          prizes={prizes} 
          onViewDetails={handleViewPrizeDetails} 
        />
      )}

      {/* Raffle Info */}
      <RaffleInfo
        description={raffle.description || ''}
        lottery={raffle.lottery || ''}
        dateLottery={raffle.date_lottery || ''}
        paymentInstructions={raffle.payment_instructions || ''}
        price={raffle.price || 0}
        currency={raffle.currency || '$'}
      />

      {/* Seller Info */}
      <SellerInfo
        name={seller.name}
        phone={seller.phone || ''}
        avatar={seller.avatar}
        id={seller.id}
      />

      {/* Number Grid */}
      <NumberGrid
        numbers={raffleNumbers}
        raffleSeller={raffleSeller}
        onReserve={handleReserveNumbers}
        onProceedToPayment={handleProceedToPayment}
        debugMode={debugMode}
        soldNumbersCount={soldNumbersCount}
      />

      {/* Organizer Info */}
      {organization && (
        <OrganizerInfo organization={organization} />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedNumbers={selectedNumbers}
        price={raffle.price || 0}
        onComplete={handlePaymentComplete}
        buyerData={buyerInfo}
        debugMode={debugMode}
      />

      {/* Digital Voucher Modal */}
      <DigitalVoucher
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        paymentData={lastPaymentData}
        selectedNumbers={selectedNumbers}
        allowVoucherPrint={raffleSeller.allow_voucher_print}
        raffleDetails={{
          title: raffle.title || "Rifa",
          price: raffle.price || 0,
          lottery: raffle.lottery || "",
          dateLottery: raffle.date_lottery || ""
        }}
      />

      {/* Prize Detail Modal */}
      <PrizeDetailModal
        isOpen={isPrizeDetailModalOpen}
        onClose={() => setIsPrizeDetailModalOpen(false)}
        prize={selectedPrize}
        prizeImages={prizeImages}
      />

      {/* Debug Modal */}
      {debugMode && (
        <DebugModal
          isOpen={isDebugModalOpen}
          onClose={() => setIsDebugModalOpen(false)}
          data={{
            seller,
            raffle,
            raffleSeller,
            raffleNumbers,
            prizes,
            organization,
            selectedNumbers,
            buyerInfo
          }}
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
