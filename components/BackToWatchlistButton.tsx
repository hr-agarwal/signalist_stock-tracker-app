'use client';

import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

// This shows a styled back button with immediate route-change feedback.
const BackToWatchlistButton = () => {
    const pathname = usePathname();
    const [pending, setPending] = useState(false);

    useEffect(() => {
        setPending(false);
    }, [pathname]);

    return (
        <Link
            href="/watchlist"
            onClick={() => {
                startTransition(() => {
                    setPending(true);
                });
            }}
            className="symbol-back-link"
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{pending ? 'Returning...' : 'Back to Watchlist'}</span>
        </Link>
    );
};

export default BackToWatchlistButton;
