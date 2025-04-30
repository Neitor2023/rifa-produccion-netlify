
/**
 * Formats a phone number to include international dialing code
 * with Ecuador's country code (+593) as default
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

/**
 * Validates if a phone number appears to be in a valid format
 */
export const isValidPhoneFormat = (phone: string): boolean => {
  const formattedPhone = formatPhoneNumber(phone);
  
  // Check if the phone number has a reasonable length after formatting
  if (formattedPhone.length < 8 || formattedPhone.length > 15) {
    return false;
  }
  
  // For Ecuador numbers specifically
  if (formattedPhone.startsWith('+593') && formattedPhone.length !== 13) {
    return false;
  }
  
  return true;
};
