/**
 * Shared module — barrel export for the entire shared layer.
 * Usage: import { api, useAuthStore, formatCurrency } from '@/shared';
 */

export { default as api } from './api/axios';
export * from './api/endpoints';

export * from './utils/date';
export * from './utils/format';

export * from './stores/authStore';
