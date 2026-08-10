/**
 * Vercel Serverless Function Entry Point
 *
 * Vercel routes all /api/* requests here via vercel.json rewrites.
 * This module re-exports the Express app as the default handler,
 * which Vercel wraps into a serverless function automatically.
 *
 * The Express app is initialised at module level in server.ts so that
 * Firestore connections and other singletons are reused across warm invocations.
 */
export { default } from '../server.ts';
