import { earningsService } from './earningsService';

export const payoutService = {
  listPayouts: earningsService.getEarnings,
  getPayoutDetail: earningsService.getPayoutDetail,
  refreshEligibility: earningsService.refreshPayoutEligibility,
  createPayout: earningsService.createPayout,
  updatePayout: earningsService.updatePayout,
};
