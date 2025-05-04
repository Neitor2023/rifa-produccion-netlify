
/**
 * Formats a phone number to Ecuador's international format:
 * - If starts with "0", removes it and adds "+593"
 * - If starts with "+5930", replaces it with "+593"
 * - If doesn't have a prefix, adds "+593"
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  
  let cleanedPhone = phone.trim();
  
  // First, remove any non-numeric characters except for the + sign
  cleanedPhone = cleanedPhone.replace(/[^\d+]/g, '');
  
  // If it starts with "+5930", replace with "+593"
  if (cleanedPhone.startsWith('+5930')) {
    cleanedPhone = '+593' + cleanedPhone.substring(5);
    console.log("🔄 Phone formatted from +5930: ", cleanedPhone);
  }
  // If it starts with "0", remove it and add "+593"
  else if (cleanedPhone.startsWith('0')) {
    cleanedPhone = '+593' + cleanedPhone.substring(1);
    console.log("🔄 Phone formatted from 0: ", cleanedPhone);
  }
  // If it doesn't have any prefix, add "+593"
  else if (!cleanedPhone.startsWith('+')) {
    cleanedPhone = '+593' + cleanedPhone;
    console.log("🔄 Phone formatted with +593 prefix: ", cleanedPhone);
  }
  
  return cleanedPhone;
};
