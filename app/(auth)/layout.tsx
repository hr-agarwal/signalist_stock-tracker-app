export const dynamic = "force-dynamic";
import Link from "next/link";
import Image from "next/image";
import {getAuth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {Sparkles} from "lucide-react";


// This layout shows the auth screens and sends signed-in users back to the dashboard.
const Layout = async ({children} : {children : React.ReactNode} ) => {
    let session = null;

    try {
        const auth = await getAuth();
        session = await auth!.api.getSession({headers: await headers()});
    } catch (error) {
        console.error('Auth layout session check failed:', error);
    }

    if(session?.user) redirect('/')

    return (
        <main className="auth-layout">
            <div className="auth-ambient auth-ambient-one" />
            <div className="auth-ambient auth-ambient-two" />
            <div className="auth-grid" />

            <section className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo" aria-label="Signalist home">
                    <span className="auth-logo-mark">
                        <Image src="/assets/icons/logo.svg" alt="Signalist logo" width={140} height={32} className='auth-logo-image' />
                    </span>
                </Link>

                <div className="auth-form-shell">
                    <div className="auth-form-glow" />
                    <div className="auth-form-content">
                        {children}
                    </div>
                </div>

            </section>

            <section className="auth-right-section">
                <div className="auth-insight-card">
                    <div className="auth-insight-header">
                        <span className="auth-insight-icon">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <span>Live market workspace</span>
                    </div>
                    <blockquote className="auth-blockquote">
                        Signalist turned my watchlist into a winning list. The alerts are spot-on, and I feel more confident making moves in the market.
                    </blockquote>

                    <div className="auth-testimonial-row">
                        <div>
                            <cite className="auth-testimonial-author">R. Sharma</cite>
                            <p className="max-md:text-xs text-gray-500">Retail Investor</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((star)=>(
                                <Image src="/assets/icons/star.svg" alt="Star" key={star} width={20} height={20} className='h-5 w-5' />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="auth-showcase">
                    <div className="auth-dashboard-stage">
                        <Image src="/assets/images/auth-dashboard-preview.png" alt="Dashboard Preview" width={1175} height={628} className='auth-dashboard-preview' priority />
                    </div>
                </div>
            </section>
        </main>
    )
}
export default Layout
