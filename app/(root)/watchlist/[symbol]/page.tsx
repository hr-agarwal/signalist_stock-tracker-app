import { Newspaper, Sparkles } from 'lucide-react';
import BackToWatchlistButton from '@/components/BackToWatchlistButton';
import TradingViewWidget from '@/components/TradingViewWidget';
import { CANDLE_CHART_WIDGET_CONFIG, SYMBOL_INFO_WIDGET_CONFIG } from '@/lib/constants';
import { getCompanyNewsSummary, getCompanySpecificNews, getStockQuote } from '@/lib/actions/finnhub.actions';
import { getWatchlistItemsForCurrentUser } from '@/lib/actions/watchlist.actions';

// This renders a saved watchlist symbol with an embedded chart and company-specific news summary.
export default async function WatchlistSymbolPage({
    params,
}: {
    params: Promise<{ symbol: string }>;
}) {
    const { symbol: rawSymbol } = await params;
    const symbol = decodeURIComponent(rawSymbol).toUpperCase();
    const items = await getWatchlistItemsForCurrentUser();
    const item = items.find((entry) => entry.symbol.toUpperCase() === symbol);

    const company = item?.company || symbol;
    const [news, quote] = await Promise.all([
        getCompanySpecificNews(symbol, company),
        getStockQuote(symbol),
    ]);
    const summary = await getCompanyNewsSummary(symbol, company, news, quote);
    const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

    return (
        <section className="symbol-page">
            <div className="symbol-page-header">
                <div className="symbol-page-heading">
                    <BackToWatchlistButton />

                    <div className="symbol-title-group">
                        <div className="symbol-pill">
                            <Sparkles className="h-4 w-4 text-pink-500" />
                            <span>Saved stock view</span>
                        </div>
                        <p className="symbol-kicker">{symbol}</p>
                        <h1 className="symbol-title">{company}</h1>
                        <p className="symbol-description">
                            View the live chart here and read a company-specific news summary generated from recent headlines.
                        </p>
                    </div>
                </div>
            </div>

            <div className="symbol-layout">
                <TradingViewWidget
                    eyebrow="Overview"
                    title="Symbol Snapshot"
                    description="A compact view of the current trading profile."
                    scriptUrl={`${scriptUrl}symbol-info.js`}
                    config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                    height={170}
                />

                <TradingViewWidget
                    eyebrow="Chart"
                    title="Price Action"
                    description="Interactive chart for the saved symbol inside your workspace."
                    scriptUrl={`${scriptUrl}advanced-chart.js`}
                    config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                    height={600}
                />

                <section className="symbol-news-panel">
                    <h2 className="symbol-news-title">Recent company news</h2>
                    <div className="watchlist-news">
                        {news.length > 0 ? (
                            news.slice(0, 8).map((article) => (
                                <a
                                    key={`${article.id}-${article.url}`}
                                    href={article.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="news-item"
                                >
                                    <span className="news-tag">{article.source}</span>
                                    <h3 className="news-title">{article.headline}</h3>
                                    <p className="news-summary">{article.summary}</p>
                                    <span className="news-cta">Open source</span>
                                </a>
                            ))
                        ) : (
                            <div className="symbol-news-empty">
                                No recent company news found for this symbol.
                            </div>
                        )}
                    </div>
                </section>

                <section className="symbol-summary-card">
                    <div className="symbol-summary-header">
                        <div className="symbol-summary-icon">
                            <Newspaper className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="symbol-summary-kicker">Summary</p>
                            <h2 className="symbol-summary-title">What matters now</h2>
                        </div>
                    </div>
                    <div className="symbol-summary-text whitespace-pre-line">{summary}</div>
                </section>
            </div>
        </section>
    );
}
