'use client';

import { createAuthClient } from 'better-auth/react';

// This is the browser-side Better Auth client used by the auth forms.
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || undefined,
    basePath: '/api/auth',
});
