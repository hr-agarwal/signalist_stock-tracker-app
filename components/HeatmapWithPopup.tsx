'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import TradingViewWidget from '@/components/TradingViewWidget';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { addToWatchlist } from '@/lib/actions/watchlist.actions';
import { formatPrice } from '@/lib/utils';

type HeatmapWithPopupProps = {
    title?: string;
    eyebrow?: string;
    description?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
};

type SearchResponse = {
    results: Stock[];
};

type QuoteResponse = {
    quote: QuoteData | null;
};

type SelectedStock = {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
    currentPrice?: number;
    changePercent?: number;
};

function parseSymbolFromText(raw: string): string | null {
    const exchangeSymbol = raw.match(/\b(?:NASDAQ|NYSE|AMEX|OTC|TSX):[A-Z.\-]{1,10}\b/);
    if (exchangeSymbol) return exchangeSymbol[0];

    const plainSymbol = raw.match(/\b[A-Z]{1,5}\b/);
    return plainSymbol ? plainSymbol[0] : null;
}

function parseSymbol(input: unknown): string | null {
    if (!input) return null;
    if (typeof input === 'string') return parseSymbolFromText(input);

    try {
        return parseSymbolFromText(JSON.stringify(input));
    } catch {
        return null;
    }
}

function formatChangePercentValue(changePercent?: number): string {
    if (!Number.isFinite(changePercent)) return 'N/A';
    const sign = (changePercent || 0) > 0 ? '+' : '';
    return `${sign}${(changePercent || 0).toFixed(2)}%`;
}

// This wraps the heatmap widget and opens an in-app modal for the clicked symbol.
const HeatmapWithPopup = ({ title, eyebrow, description, scriptUrl, config, height = 600 }: HeatmapWithPopupProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null);
    const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const isInWatchlist = useMemo(() => {
        if (!selectedStock) return false;
        return watchlistSymbols.includes(selectedStock.symbol.toUpperCase());
    }, [selectedStock, watchlistSymbols]);

    const openModalForSymbol = async (rawSymbol: string) => {
        const symbol = rawSymbol.trim().toUpperCase();
        if (!symbol) return;

        setLoading(true);
        setOpen(true);

        try {
            const searchResponse = await fetch(`/api/stocks/search?q=${encodeURIComponent(symbol)}`);
            const searchData = (await searchResponse.json()) as SearchResponse;

            const stockMatch =
                searchData.results.find((stock) => stock.symbol.toUpperCase() === symbol) ??
                searchData.results[0] ??
                { symbol, name: symbol, exchange: 'Global', type: 'Stock' };

            const quoteResponse = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(stockMatch.symbol)}`);
            const quoteData = (await quoteResponse.json()) as QuoteResponse;

            setSelectedStock({
                symbol: stockMatch.symbol,
                name: stockMatch.name,
                exchange: stockMatch.exchange,
                type: stockMatch.type,
                currentPrice: quoteData.quote?.c,
                changePercent: quoteData.quote?.dp,
            });
        } catch {
            setSelectedStock({
                symbol,
                name: symbol,
                exchange: 'Global',
                type: 'Stock',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleTvLinkOpen = (eventLike: Event) => {
            const event = eventLike as CustomEvent<Record<string, unknown>>;
            const symbol =
                parseSymbol(event.detail?.symbol) ||
                parseSymbol(event.detail?.proName) ||
                parseSymbol(event.detail?.href) ||
                parseSymbol(event.detail);

            if (!symbol) return;

            event.preventDefault();
            event.stopPropagation();
            void openModalForSymbol(symbol);
        };

        const handlePostMessage = (event: MessageEvent) => {
            if (typeof event.origin === 'string' && !event.origin.includes('tradingview.com')) return;
            const symbol = parseSymbol(event.data);
            if (!symbol) return;
            void openModalForSymbol(symbol);
        };

        window.addEventListener('tv-link-open', handleTvLinkOpen as EventListener);
        document.addEventListener('tv-link-open', handleTvLinkOpen as EventListener);
        window.addEventListener('message', handlePostMessage);

        return () => {
            window.removeEventListener('tv-link-open', handleTvLinkOpen as EventListener);
            document.removeEventListener('tv-link-open', handleTvLinkOpen as EventListener);
            window.removeEventListener('message', handlePostMessage);
        };
    }, []);

    const handleAddToWatchlist = () => {
        if (!selectedStock || isPending || isInWatchlist) return;

        startTransition(() => {
            void (async () => {
                const result = await addToWatchlist({
                    symbol: selectedStock.symbol,
                    company: selectedStock.name,
                });

                if (!result?.success) {
                    toast.error(result?.error || 'Could not add stock to watchlist.');
                    return;
                }

                setWatchlistSymbols((prev) => [...new Set([...prev, selectedStock.symbol.toUpperCase()])]);
                toast.success('Added to watchlist.');
            })();
        });
    };

    return (
        <>
            <TradingViewWidget
                eyebrow={eyebrow}
                title={title}
                description={description}
                scriptUrl={scriptUrl}
                config={config}
                height={height}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="heatmap-modal" showCloseButton={false}>
                    <button
                        type="button"
                        aria-label="Close popup"
                        className="heatmap-modal-close"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <DialogHeader>
                        <DialogTitle className="heatmap-modal-symbol">
                            {selectedStock?.symbol || 'Loading...'}
                        </DialogTitle>
                        <DialogDescription className="heatmap-modal-company">
                            {selectedStock?.name || 'Fetching stock details'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="heatmap-modal-meta">
                        <span>{selectedStock?.exchange || 'Global'}</span>
                        <span>{selectedStock?.type || 'Stock'}</span>
                    </div>

                    <div className="heatmap-modal-stat">
                        <p className="heatmap-modal-label">Current Price</p>
                        <p className="heatmap-modal-value">
                            {selectedStock?.currentPrice ? formatPrice(selectedStock.currentPrice) : 'N/A'}
                        </p>
                    </div>

                    <div className="heatmap-modal-stat">
                        <p className="heatmap-modal-label">Price Change</p>
                        <p className="heatmap-modal-value">
                            {formatChangePercentValue(selectedStock?.changePercent)}
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={handleAddToWatchlist}
                        disabled={loading || isPending || !selectedStock || isInWatchlist}
                        className="yellow-btn w-full heatmap-modal-button"
                    >
                        {loading || isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isInWatchlist ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        <span>{isInWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}</span>
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default HeatmapWithPopup;
