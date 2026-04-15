import StockSearch from '@/components/StockSearch';
import { getWatchlistSymbolsForCurrentUser } from '@/lib/actions/watchlist.actions';

// This is the page behind the navbar search link.
export default async function SearchPage() {
    const initialWatchlistSymbols = await getWatchlistSymbolsForCurrentUser();
    return <StockSearch initialWatchlistSymbols={initialWatchlistSymbols} />;
}
