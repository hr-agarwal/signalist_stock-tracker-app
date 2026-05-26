'use server';

import {getAuth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";
import {sendWelcomeEmail} from "@/lib/nodemailer";

const buildWelcomeIntro = ({
    country,
    investmentGoals,
    riskTolerance,
    preferredIndustry,
}: Pick<SignUpFormData, 'country' | 'investmentGoals' | 'riskTolerance' | 'preferredIndustry'>) => `
<p class="mobile-text dark-text-secondary" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
    Your Signalist dashboard is ready. We will tune your experience around ${investmentGoals.toLowerCase()} investing, ${riskTolerance.toLowerCase()} risk tolerance, ${preferredIndustry.toLowerCase()} ideas, and market context for ${country}.
</p>
`;

// This sends the welcome email immediately after signup and also reports failures to the caller.
export const sendUserCreatedEvent = async ({
    email,
    fullName,
    country,
    investmentGoals,
    riskTolerance,
    preferredIndustry,
}: SignUpFormData) => {
    try {
        await sendWelcomeEmail({
            email,
            name: fullName,
            intro: buildWelcomeIntro({country, investmentGoals, riskTolerance, preferredIndustry}),
        });

        return { success: true, emailSent: true };
    } catch (emailError) {
        console.error('Welcome email send failed', emailError);

        try {
            await inngest.send({
                name: 'app/user.created',
                data:{email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry}
            });
        } catch (eventError) {
            console.error('Sign-up event fallback send failed', eventError);
        }

        return {
            success: false,
            emailSent: false,
            error: emailError instanceof Error ? emailError.message : 'Welcome email failed',
        };
    }
}

// This creates a new user and sends a follow-up event for the welcome workflow.
export const signUpWithEmail = async ({email,password,fullName, country, investmentGoals,riskTolerance,preferredIndustry}: SignUpFormData)  => {
    try{
        const auth = await getAuth();

        const response = await auth!.api.signUpEmail({
            body: {email, password, name:fullName},
            headers: await headers(),
        })

        if(response) await sendUserCreatedEvent({email,password,fullName, country, investmentGoals,riskTolerance,preferredIndustry});
        return {success:true, data:response}

    }catch(e){
        console.log('Sign up failed',e);
        return {
            success: false,
            error: e instanceof Error ? e.message : 'Sign up failed',
        };
    }
}

// This signs in an existing user with email and password.
export const signInWithEmail = async ({email,password}: SignInFormData)  => {
    try{
        const auth = await getAuth();

        const response = await auth!.api.signInEmail({
            body: {email, password},
            headers: await headers(),
        })
        return {success:true, data:response}

    }catch(e){
        console.log('Sign-in failed',e);
        return {
            success: false,
            error: e instanceof Error ? e.message : 'Sign-in failed',
        };
    }
}


// This signs the current user out using the request cookies from the server.
export const signOut = async ()  => {
    try {
        const auth = await getAuth();
        await auth!.api.signOut({ headers: await headers()});
        return { success: true };
    }catch(e){
        console.log('Sign out failed',e);
        return { success: false, error: 'Sign out failed' };
    }
}

