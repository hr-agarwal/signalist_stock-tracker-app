import {Inngest} from "inngest";

// This is the shared Inngest client used for events, cron jobs, and AI steps.
export const inngest = new Inngest({
    id: 'signalist',
    ai: {gemini: {apiKey: process.env.GEMINI_API_KEY }}
})
