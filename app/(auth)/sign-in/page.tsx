'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { authClient } from "@/lib/better-auth/client";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {ArrowRight, LockKeyhole} from "lucide-react";

// This renders the sign-in form and logs the user in on submit.
const SignIn = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    // This sends the form data to the server action and moves the user to the dashboard on success.
    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await authClient.signIn.email({
                email: data.email,
                password: data.password,
            });

            if(result.error) {
                toast.error('Sign in failed', {
                    description: result.error.message || 'Please check your email and password.',
                });
                return;
            }

            router.replace('/');
            router.refresh();
        } catch (e) {
            console.error(e);
            toast.error('Sign in failed', {
                description: e instanceof Error ? e.message : 'Failed to sign in.'
            })
        }
    }

    return (
        <>
            <div className="auth-form-heading">
                <span className="auth-form-badge">
                    <LockKeyhole className="h-4 w-4" />
                    Secure access
                </span>
                <h1 className="form-title">Welcome back</h1>
                <p className="form-subtitle">
                    Sign in to continue tracking watchlists, alerts, and market signals.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@jsmastery.com"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: 'Email is required',
                        pattern: {
                            value: /^[\w.-]+@[\w.-]+\.\w+$/,
                            message: 'Enter a valid email address',
                        },
                    }}
                />

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: 8 }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5 auth-submit-btn">
                    <span>{isSubmitting ? 'Signing In' : 'Sign In'}</span>
                    <ArrowRight className="h-4 w-4" />
                </Button>

                <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up" />
            </form>
        </>
    );
};
export default SignIn;
