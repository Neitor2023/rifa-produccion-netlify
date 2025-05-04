/**
 * Calculates the expiration date for a reservation based on specified parameters
 */
export function calculateExpirationDate(
  reservationDays: number = 5,
  lotteryDate?: Date
): Date {
  // Calculate the reservation expiration date based on reservationDays and lotteryDate
  const currentDate = new Date();
  const daysToAdd = typeof reservationDays === 'number' ? reservationDays : 5;
  
  // Create a new date by adding the specified days
  const expirationDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  
  // Determine if we should use the lottery date if it comes before the calculated expiration
  if (lotteryDate && lotteryDate instanceof Date && !isNaN(lotteryDate.getTime())) {
    // Valid lottery date, compare with expiration date
    if (expirationDate.getTime() > lotteryDate.getTime()) {
      // If expiration would be after the lottery, use the lottery date instead
      return new Date(lotteryDate);
    }
  }
  
  // Otherwise use the calculated expiration date
  return expirationDate;
}
