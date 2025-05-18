
import { useState } from 'react';
import { useSellerData } from './useRaffleData/useSellerData';
import { useRaffleBasicData } from './useRaffleData/useRaffleBasicData';
import { usePrizesData } from './useRaffleData/usePrizesData';
import { useOrganizationData } from './useRaffleData/useOrganizationData';
import { useRaffleNumbersData } from './useRaffleData/useRaffleNumbersData';

interface UseRaffleDataProps {
  raffleId: string;
  sellerId: string;
}

export function useRaffleData({ raffleId, sellerId }: UseRaffleDataProps) {
  console.log("[useRaffleData.ts] Called with params:", { raffleId, sellerId });
  
  // Get seller data
  const { seller, isLoadingSeller } = useSellerData(sellerId);
  
  // Get raffle basic data
  const { raffle, isLoadingRaffle, debugMode } = useRaffleBasicData(raffleId);
  
  // Get prizes data
  const { prizes, prizeImages, isLoadingPrizes, isLoadingPrizeImages } = usePrizesData(raffleId);
  
  // Get organization data
  const { organization, isLoading: isLoadingOrganization } = useOrganizationData(raffleId);
  
  // Get raffle numbers data
  const { 
    raffleNumbers, 
    raffleSeller, 
    formatNumbersForGrid, 
    refetchRaffleNumbers, 
    maxNumbersAllowed, 
    allowVoucherPrint,
    isLoading: isLoadingRaffleNumbers 
  } = useRaffleNumbersData(raffleId, seller?.id || '');

  const isLoading = 
    isLoadingSeller || 
    isLoadingRaffle || 
    isLoadingPrizes || 
    isLoadingPrizeImages ||
    isLoadingOrganization || 
    isLoadingRaffleNumbers;

  return {
    seller,
    raffle,
    prizes,
    prizeImages,
    organization,
    raffleNumbers,
    raffleSeller,
    formatNumbersForGrid,
    isLoading,
    refetchRaffleNumbers,
    maxNumbersAllowed,
    debugMode,
    allowVoucherPrint
  };
}
