'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

// This creates a new user and sends a follow-up event for the welcome workflow.
export const signUpWithEmail = async ({email,password,fullName, country, investmentGoals,riskTolerance,preferredIndustry}: SignUpFormData)  => {
    try{

        const response = await auth!.api.signUpEmail({body: {email, password, name:fullName}})

        if(response){
            await inngest.send({
                name: 'app/user.created',
                data:{email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry}
            })
        }
        return {success:true, data:response}

    }catch(e){
        console.log('Sign up failed',e);
        return { success: false, error: 'Sign up failed' };
    }
}

// This signs in an existing user with email and password.
export const signInWithEmail = async ({email,password}: SignInFormData)  => {
    try{

        const response = await auth!.api.signInEmail({body: {email, password}})
        return {success:true, data:response}

    }catch(e){
        console.log('Sign-in failed',e);
        return { success: false, error: 'Sign-in failed' };
    }
}


// This signs the current user out using the request cookies from the server.
export const signOut = async ()  => {
    try {
        await auth!.api.signOut({ headers: await headers()});
        return { success: true };
    }catch(e){
        console.log('Sign out failed',e);
        return { success: false, error: 'Sign out failed' };
    }
}

