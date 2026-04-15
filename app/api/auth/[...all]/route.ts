import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/better-auth/auth';

// This exposes Better Auth's API routes for client-side auth calls.
const auth = await getAuth();

export const { GET, POST } = toNextJsHandler(auth!);
