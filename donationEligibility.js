const minimumGapInDays = 90;
const millisecondsPerDay = 1000 * 60 * 60 * 24;

function calculateDonationEligibility(lastDonationDate) {
  if (!lastDonationDate) {
    return { isEligible: true, daysRemaining: 0 };
  }

  const daysSinceLastDonation = Math.floor(
    (Date.now() - new Date(lastDonationDate).getTime()) / millisecondsPerDay
  );
  const daysRemaining = minimumGapInDays - daysSinceLastDonation;

  return {
    isEligible: daysRemaining <= 0,
    daysRemaining: daysRemaining > 0 ? daysRemaining : 0
  };
}

module.exports = calculateDonationEligibility;
