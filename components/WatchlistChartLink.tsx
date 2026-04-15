'use client';

import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

// This shows the chart link with immediate route-change feedback.
const WatchlistChartLink = ({ symbol }: { symbol: string }) => {
    const pathname = usePathname();
    const [pending, setPending] = useState(false);

    useEffect(() => {
        setPending(false);
    }, [pathname]);

    return (
        <Link
            href={`/watchlist/${encodeURIComponent(symbol)}`}
            onClick={() => {
                startTransition(() => {
                    setPending(true);
                });
            }}
            className="watchlist-symbol-link"
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
            <span>{pending ? 'Opening...' : 'Chart'}</span>
        </Link>
    );
};

export default WatchlistChartLink;
