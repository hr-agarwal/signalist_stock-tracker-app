import Header from "@/components/Header";
import {getAuth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import { redirect } from "next/navigation";

// This protects the main app routes and passes the logged-in user to the header.
const Layout = async ({children} : {children : React.ReactNode} ) => {
    let session = null;

    try {
        const auth = await getAuth();
        session = await auth!.api.getSession({headers: await headers()});
    } catch (error) {
        console.error('Root layout session check failed:', error);
    }

    if(!session?.user) redirect('/sign-in');
    const user ={
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
    }



    return (
        <main className="min-h-screen text-gray-400">
           <Header user ={user} />
            <div className="container py-10">
                {children}
            </div>
        </main>
    )
}
export default Layout
