'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { Loader2, Radar, Search, Sparkles, TrendingUp } from 'lucide-react';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { useSearchParams } from 'next/navigation';
import WatchlistButton from '@/components/WatchlistButton';
import StockChartModal from '@/components/StockChartModal';

type SearchResponse = {
    results: Stock[];
};

// This renders the stock search experience and updates results as the user types.
const StockSearch = ({ initialWatchlistSymbols = [] }: { initialWatchlistSymbols?: string[] }) => {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q')?.trim() || '';
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(initialWatchlistSymbols);
    const deferredQuery = useDeferredValue(query);

    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        setWatchlistSymbols(initialWatchlistSymbols);
    }, [initialWatchlistSymbols]);

    useEffect(() => {
        const trimmedQuery = deferredQuery.trim();

        if (!trimmedQuery) {
            setResults([]);
            setError('');
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();

        // This asks the internal API for matching stocks and handles the loading states.
        const loadResults = async () => {
            try {
                setIsLoading(true);
                setError('');

                const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(trimmedQuery)}`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('Could not load stock results.');
                }

                const data = (await response.json()) as SearchResponse;
                setResults(data.results || []);
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;

                setResults([]);
                setError('Search is unavailable right now. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        void loadResults();

        return () => controller.abort();
    }, [deferredQuery]);

    const popularSymbols = POPULAR_STOCK_SYMBOLS.slice(0, 12);
    const hasQuery = query.trim().length > 0;
    const statusLabel = !hasQuery
        ? 'Type to search'
        : isLoading
            ? 'Searching symbols...'
            : error
                ? 'Search unavailable'
                : results.length > 0
                    ? `${results.length} live match${results.length === 1 ? '' : 'es'}`
                    : 'No matches yet';

    const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
        const normalizedSymbol = symbol.toUpperCase();

        setWatchlistSymbols((current) => {
            if (isAdded) {
                return current.includes(normalizedSymbol) ? current : [...current, normalizedSymbol];
            }

            return current.filter((item) => item !== normalizedSymbol);
        });
    };

    return (
        <section className="search-page">
            <div className="search-hero">
                <div className="search-hero-copy">
                    <div className="search-pill">
                        <Sparkles className="h-4 w-4 text-pink-500" />
                        <span>Search workspace</span>
                    </div>
                    <p className="search-kicker">Stock Discovery</p>
                    <h1 className="search-title">Search global stocks in one place.</h1>
                    <p className="search-description">
                        Type a company name or symbol like `AAPL`, `TSLA`, or `Microsoft` to find matching stocks fast.
                    </p>
                </div>
                <div className="search-hero-badge">
                    <TrendingUp className="h-5 w-5 text-teal-400" />
                    <span>{statusLabel}</span>
                </div>
            </div>

            <div className="search-shell">
                <div className="search-summary">
                    <span className="search-summary-label">Quick guide</span>
                    <div className="search-summary-items">
                        <span className="search-summary-chip">
                            <strong>Stock</strong>
                            <span>Company share</span>
                        </span>
                        <span className="search-summary-chip">
                            <strong>ETF</strong>
                            <span>Basket of stocks</span>
                        </span>
                        <span className="search-summary-chip">
                            <strong>ADR</strong>
                            <span>Foreign stock in US</span>
                        </span>
                    </div>
                </div>

                <div className="search-input-wrapper">
                    <Search className="search-input-icon" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by symbol or company name"
                        className="search-page-input"
                    />
                    {isLoading && <Loader2 className="search-page-loader" />}
                </div>

                <div className="search-chip-row">
                    {popularSymbols.map((symbol) => (
                        <button
                            key={symbol}
                            type="button"
                            onClick={() => setQuery(symbol)}
                            className="search-chip"
                        >
                            {symbol}
                        </button>
                    ))}
                </div>
            </div>

            <div className="search-results-panel">
                <div className="search-results-header">
                    <div>
                        <h2 className="search-results-title">Matches</h2>
                        <p className="search-results-subtitle">
                            {hasQuery ? `Showing results for "${query.trim()}"` : 'Start typing to search for stocks.'}
                        </p>
                    </div>
                    {hasQuery && !isLoading && !error && (
                        <span className="search-results-count">{results.length} result{results.length === 1 ? '' : 's'}</span>
                    )}
                </div>

                {error && <p className="search-feedback">{error}</p>}

                {!hasQuery && (
                    <div className="search-empty-state">
                        <div className="search-empty-icon">
                            <Radar className="h-5 w-5" />
                        </div>
                        <p className="search-empty-title">Try a popular symbol to begin.</p>
                        <p className="search-empty-text">
                            You can search by short code like `NVDA` or by company name like `Nvidia`.
                        </p>
                    </div>
                )}

                {hasQuery && !isLoading && !error && results.length === 0 && (
                    <div className="search-empty-state">
                        <div className="search-empty-icon">
                            <Search className="h-5 w-5" />
                        </div>
                        <p className="search-empty-title">No matching stocks found.</p>
                        <p className="search-empty-text">
                            Try a different spelling, a shorter company name, or a ticker symbol.
                        </p>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="search-results-grid">
                        {results.map((stock) => (
                            <article key={`${stock.symbol}-${stock.exchange}`} className="search-card">
                                <div className="search-card-top">
                                    <div>
                                        <p className="search-card-symbol">{stock.symbol}</p>
                                        <h3 className="search-card-name">{stock.name}</h3>
                                    </div>
                                    <span className="search-card-type">{stock.type}</span>
                                </div>

                                <div className="search-card-meta">
                                    <span>{stock.exchange}</span>
                                    <span className="search-card-dot" />
                                    <span>Market lookup</span>
                                </div>

                                <div className="search-card-actions">
                                    <WatchlistButton
                                        symbol={stock.symbol}
                                        company={stock.name}
                                        isInWatchlist={watchlistSymbols.includes(stock.symbol.toUpperCase())}
                                        onWatchlistChange={handleWatchlistChange}
                                    />

                                    <StockChartModal stock={stock} />
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default StockSearch;
