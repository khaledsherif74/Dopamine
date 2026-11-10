import { createAuthSlice, createRefresher } from '@dopamine/web-shared';
import { config } from '@/config.js';

export const ROLE = 'DRIVER';
export const refresher = createRefresher({ baseUrl: config.apiBaseUrl });
export const auth = createAuthSlice({ role: ROLE, baseUrl: config.apiBaseUrl, refresher });
export const authActions = auth.actions;
export const bootstrapAuth = auth.bootstrapAuth;
