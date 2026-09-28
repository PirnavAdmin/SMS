// Event utility for real-time finance dashboard auto-refresh synchronization

export const FINANCE_UPDATED_EVENT = 'finance_data_updated';

export const notifyFinanceUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FINANCE_UPDATED_EVENT));
  }
};
