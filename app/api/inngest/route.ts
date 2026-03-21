import {serve} from "inngest/next";
import {inngest} from "@/lib/inngest/client";
import {sendDailyNewsSummary, sendSignUpEmail} from "@/lib/inngest/functions";

// This exposes the Inngest HTTP handlers so events and cron jobs can run.
export const {GET,POST,PUT} = serve({
    client: inngest,
    functions: [sendSignUpEmail,sendDailyNewsSummary]
})
