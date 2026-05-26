'use client';

import { useMemo, useState } from 'react';
import { CandlestickChart, X } from 'lucide-react';
import { CANDLE_CHART_WIDGET_CONFIG } from '@/lib/constants';
import useTradingViewWidget from '@/hooks/useTradingViewWidget';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type StockChartModalProps = {
    stock: Stock;
};

const TRADING_VIEW_EMBED_URL = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

const ChartFrame = ({ symbol }: { symbol: string }) => {
    const config = useMemo(() => ({
        ...CANDLE_CHART_WIDGET_CONFIG(symbol),
        width: '100%',
        height: 640,
    }), [symbol]);
    const containerRef = useTradingViewWidget(TRADING_VIEW_EMBED_URL, config, 640);

    return (
        <div className="tradingview-widget-container stock-chart-modal-frame" ref={containerRef}>
            <div className="tradingview-widget-container__widget h-full w-full" />
        </div>
    );
};

// This opens a TradingView candle chart inside the app instead of navigating away.
const StockChartModal = ({ stock }: StockChartModalProps) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="search-card-link"
            >
                <CandlestickChart className="h-4 w-4" />
                <span>Open chart</span>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="stock-chart-modal" showCloseButton={false}>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="stock-chart-modal-close"
                        aria-label="Close chart"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <DialogHeader className="stock-chart-modal-header">
                        <div>
                            <DialogTitle className="stock-chart-modal-title">
                                {stock.symbol}
                            </DialogTitle>
                            <DialogDescription className="stock-chart-modal-description">
                                {stock.name}
                            </DialogDescription>
                        </div>
                        <div className="stock-chart-modal-meta">
                            <span>{stock.exchange}</span>
                            <span>{stock.type}</span>
                        </div>
                    </DialogHeader>

                    {open && <ChartFrame symbol={stock.symbol} />}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default StockChartModal;
