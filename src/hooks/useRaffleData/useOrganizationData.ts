
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/lib/constants';

export function useOrganizationData(raffleId: string) {
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  
  const { data: organization, isLoading: isLoadingOrganization } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
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
