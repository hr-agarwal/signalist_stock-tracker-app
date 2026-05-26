'use client';
import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS} from "@/lib/constants";
import {CountrySelectField} from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import {sendUserCreatedEvent} from "@/lib/actions/auth_actions";
import { authClient } from "@/lib/better-auth/client";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {ArrowRight, CheckCircle2, Sparkles} from "lucide-react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";


// This renders the sign-up form and collects the user's investing preferences.
const SignUp = () => {
    const router = useRouter();
    const [accountCreatedOpen, setAccountCreatedOpen] = useState(false);
    const {
        register,
        handleSubmit,
        control,
        formState: {errors, isSubmitting},
    } = useForm<SignUpFormData>({
        defaultValues:{
            fullName: '',
            email: '',
            password: '',
            country: 'India',
            investmentGoals: 'Growth',
            riskTolerance: 'medium',
            preferredIndustry: 'Technology'
        },
        mode: 'onBlur'
    });

    useEffect(() => {
        if (!accountCreatedOpen) return;

        const timeout = window.setTimeout(() => {
            router.replace('/sign-in');
        }, 1800);

        return () => window.clearTimeout(timeout);
    }, [accountCreatedOpen, router]);

    // This creates the account and redirects to the main app after a successful signup.
    const onSubmit = async (data: SignUpFormData) => {
        try{
          const result = await authClient.signUp.email({
              email: data.email,
              password: data.password,
              name: data.fullName,
          });

          if(result.error) {
              toast.error('Sign up failed',{
                  description: result.error.message || 'Please check your details and try again.',
              })
              return;
          }

          void sendUserCreatedEvent(data).then((welcomeResult) => {
              if (!welcomeResult.emailSent) {
                  toast.warning('Account created, but welcome email was not sent.', {
                      description: 'Please check the mail credentials or Inngest worker configuration.',
                  });
              }
          });
          setAccountCreatedOpen(true);
        } catch(e){
            console.error(e);
            toast.error('Sign up failed',{
                description: e instanceof Error ? e.message : 'Failed to sign up'
            })
        }
    }
    return (
        <>
            <Dialog open={accountCreatedOpen}>
                <DialogContent className="account-created-modal" showCloseButton={false}>
                    <div className="account-created-icon">
                        <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <DialogHeader className="text-center">
                        <DialogTitle className="account-created-title">Account created</DialogTitle>
                        <DialogDescription className="account-created-description">
                            Your Signalist account is ready. Redirecting you to sign in...
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            <div className="auth-form-heading">
                <span className="auth-form-badge">
                    <Sparkles className="h-4 w-4" />
                    Build your edge
                </span>
                <h1 className="form-title">Sign Up & Personalize</h1>
                <p className="form-subtitle">
                    Create your Signalist profile and tune the dashboard to your market style.
                </p>
            </div>

                <form onSubmit={handleSubmit(onSubmit)} className="auth-signup-form">
                    <div className="auth-signup-grid">
                        <InputField
                            name="fullName"
                            label="Full name"
                            placeholder="Harsh Agarwal"
                            register={register}
                            error={errors.fullName}
                            validation={{
                                required: 'Full name is required',
                                minLength: {
                                    value: 2,
                                    message: 'Minimum 2 characters required'
                                }
                                }}
                        />

                        <InputField
                            name="email"
                            label="Email"
                            placeholder="xyz@gmail.com"
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
                            placeholder="Enter a Strong Password"
                            type="password"
                            register={register}
                            error={errors.password}
                            validation={{required: 'Password is required',
                                     minLength:{
                                     value: 8,
                                         message: 'Password must be at least 8 characters'
                                     }
                        }}
                        />

                        <CountrySelectField
                            name ="country"
                            label="Country"
                            control={control}
                            error={errors.country}
                            required
                        />

                        <SelectField
                        name="investmentGoals"
                        label="Investment Goals"
                        placeholder="Select your investment goal"
                        options={INVESTMENT_GOALS}
                        control={control}
                        error={errors.investmentGoals}
                        required
                        />

                        <SelectField
                        name="riskTolerance"
                        label="Risk Tolerance"
                        placeholder="Select your risk level"
                        options={RISK_TOLERANCE_OPTIONS}
                        control={control}
                        error={errors.riskTolerance}
                        required
                        />

                        <div className="auth-signup-span">
                            <SelectField
                                name="preferredIndustry"
                                label="Preferred Industry"
                                placeholder="Select your preferred industry"
                                options={PREFERRED_INDUSTRIES}
                                control={control}
                                error={errors.preferredIndustry}
                                required
                            />
                        </div>
                    </div>

                    <Button type ="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5 auth-submit-btn">
                        <span>{isSubmitting ? 'Creating Account' : 'Start Your Investing Journey'}</span>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <FooterLink text="Already have an account?" linkText="Sign in" href="/sign-in"/>
                </form>
        </>
    )
}
export default SignUp
