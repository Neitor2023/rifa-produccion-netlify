
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/lib/constants';

export function useOrganizationData(raffleId: string) {
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  
  const { data: organization, isLoading: isLoadingOrganization } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('organization')
          .select(`
            *,
            imagen_pago,
            imagen_pago_apartado,
            imagen_limpiar,
            image_apartado
          `)
          .limit(1)
          .single();
        
        if (error) {
          console.error('[useOrganizationData] Error fetching organization:', error);
          throw error;
        }
        
        console.log('[useOrganizationData] Raw organization data:', data);
        
        // Verify image URLs
        if (data) {
          console.log('[useOrganizationData] Image URLs:', {
            imagen_pago: data.imagen_pago || 'undefined',
            imagen_pago_apartado: data.imagen_pago_apartado || 'undefined',
            imagen_limpiar: data.imagen_limpiar || 'undefined',
            image_apartado: data.image_apartado || 'undefined'
          });
        }
        
        return data;
      } catch (error) {
        console.error('[useOrganizationData] Error in query:', error);
        throw error;
      }
    }
  });
  
  // Fetch admin user
  const { data: adminUser, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ['admin', raffleId],
    queryFn: async () => {
      if (!raffleId) return null;
      
      const { data: raffle } = await supabase
        .from('raffles')
        .select('id_admin')
        .eq('id', raffleId)
        .single();
      
      if (!raffle?.id_admin) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', raffle.id_admin)
        .single();
      
      if (error) {
        console.error('Error fetching admin:', error);
        return null;
      }
      
      return data;
    }
  });
  
  // Fetch organizer user
  const { data: organizerUser, isLoading: isLoadingOrganizer } = useQuery({
    queryKey: ['organizer', raffleId],
    queryFn: async () => {
      if (!raffleId) return null;
      
      const { data: raffle } = await supabase
        .from('raffles')
        .select('id_organizer')
        .eq('id', raffleId)
        .single();
      
      if (!raffle?.id_organizer) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', raffle.id_organizer)
        .single();
      
      if (error) {
        console.error('Error fetching organizer:', error);
        return null;
      }
      
      return data;
    }
  });
  
  // Combine organization with admin and organizer data
  useEffect(() => {
    if (organization && (adminUser || organizerUser)) {
      const updatedOrganization = { ...organization };
      
      if (adminUser) {
        updatedOrganization.admin_name = adminUser.name;
        updatedOrganization.admin_phone_number = adminUser.phone_number || '';
        updatedOrganization.admin_photo = adminUser.avatar;
      }
      
      if (organizerUser) {
        updatedOrganization.org_name = organizerUser.name;
        updatedOrganization.org_phone_number = organizerUser.phone_number || '';
        updatedOrganization.org_photo = organizerUser.avatar;
      }
      
      // Log the image URLs for debugging
      console.log('[useOrganizationData] Final organization images:', {
        imagen_pago: updatedOrganization.imagen_pago || 'undefined',
        imagen_pago_apartado: updatedOrganization.imagen_pago_apartado || 'undefined',
        image_apartado: updatedOrganization.image_apartado || 'undefined',
        imagen_limpiar: updatedOrganization.imagen_limpiar || 'undefined'
      });
      
      setOrganizationData(updatedOrganization);
    }
  }, [organization, adminUser, organizerUser]);

  const isLoading = 
    isLoadingOrganization || 
    isLoadingAdmin || 
    isLoadingOrganizer;

  return {
    organization: organizationData,
    isLoading
  };
}
