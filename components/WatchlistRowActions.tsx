'use client';

import Link from 'next/link';
import { startTransition, useState } from 'react';
import { ArrowUpRight, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';

// This renders the chart and delete actions for a saved watchlist symbol.
const WatchlistRowActions = ({ symbol }: { symbol: string }) => {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    const handleDelete = () => {
        if (pending) return;

        setPending(true);

        startTransition(() => {
            void (async () => {
                const result = await removeFromWatchlist(symbol);
                setPending(false);

                if (!result?.success) {
                    toast.error(result?.error || 'Could not remove this symbol.');
                    return;
                }

                toast.success('Removed from watchlist.');
                router.refresh();
            })();
        });
    };

    return (
        <div className="watchlist-row-actions">
            <Link
                href={`https://www.tradingview.com/symbols/${encodeURIComponent(symbol.replace(':', '-'))}/`}
                target="_blank"
                rel="noreferrer"
                className="watchlist-symbol-link"
            >
                <span>Chart</span>
                <ArrowUpRight className="h-4 w-4" />
            </Link>

            <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="watchlist-delete-btn"
            >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Delete</span>
            </button>
        </div>
    );
};

export default WatchlistRowActions;
