'use client';

import { startTransition, useState } from 'react';
import { Check, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';

// This lets the user add or remove a stock from their watchlist directly from search results.
const WatchlistButton = ({ symbol, company, isInWatchlist, onWatchlistChange }: WatchlistButtonProps) => {
    const [pending, setPending] = useState(false);

    const handleClick = () => {
        if (pending) return;

        setPending(true);

        startTransition(() => {
            void (async () => {
                const result = isInWatchlist
                    ? await removeFromWatchlist(symbol)
                    : await addToWatchlist({ symbol, company });

                setPending(false);

                if (!result?.success) {
                    toast.error(result?.error || 'Watchlist update failed.');
                    return;
                }

                onWatchlistChange?.(symbol, Boolean(result.isInWatchlist));
                toast.success(result.isInWatchlist ? 'Added to watchlist.' : 'Removed from watchlist.');
            })();
        });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            className={`search-watchlist-btn ${isInWatchlist ? 'search-watchlist-btn-active' : ''}`}
        >
            {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isInWatchlist ? (
                <Check className="h-4 w-4" />
            ) : (
                <Star className="h-4 w-4" />
            )}
            <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>
    );
};

export default WatchlistButton;
