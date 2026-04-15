import TradingViewWidget from "@/components/TradingViewWidget";
import { HEATMAP_WIDGET_CONFIG, MARKET_DATA_WIDGET_CONFIG, MARKET_OVERVIEW_WIDGET_CONFIG, TOP_STORIES_WIDGET_CONFIG } from "@/lib/constants";
import { Activity, Globe2, Newspaper, Sparkles } from "lucide-react";

// This is the dashboard home page with the TradingView widgets.
const Home = () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    const highlights = [
        {
            title: "Live market pulse",
            description: "Track broad momentum and sector rotation without switching tabs.",
            icon: Activity,
        },
        {
            title: "Global discovery",
            description: "Surface market heat, quotes, and symbol movements from one dashboard.",
            icon: Globe2,
        },
        {
            title: "News context",
            description: "Pair price action with headlines so the moves have immediate context.",
            icon: Newspaper,
        },
    ];

    return (
        <div className="dashboard-page">
            <section className="dashboard-hero">
                <div className="dashboard-hero-copy">
                    <div className="dashboard-pill">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span>Market command center</span>
                    </div>
                    <h1 className="dashboard-hero-title">A cleaner view of the market, built for quick decisions.</h1>
                    <p className="dashboard-hero-description">
                        Your dashboard keeps the same idea and core widgets, but now feels sharper, easier to scan, and more modern.
                    </p>
                </div>

                <div className="dashboard-highlight-grid">
                    {highlights.map(({ title, description, icon: Icon }) => (
                        <article key={title} className="dashboard-highlight-card">
                            <div className="dashboard-highlight-icon">
                                <Icon className="h-5 w-5" />
                            </div>
                            <h2 className="dashboard-highlight-title">{title}</h2>
                            <p className="dashboard-highlight-description">{description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dashboard-overview-bar">
                <div>
                    <p className="dashboard-overview-label">Overview</p>
                    <h2 className="dashboard-overview-title">Today&apos;s market layout</h2>
                </div>
                <p className="dashboard-overview-text">
                    Overview, heatmap, headlines, and quotes remain in the same order for familiarity.
                </p>
            </section>

            <div className="flex min-h-screen home-wrapper">
                <section className="grid w-full gap-8 home-section">
                    <div className="md:col-span-1 xl:col-span-1">
                        <TradingViewWidget
                            eyebrow="Market"
                            title="Market Overview"
                            description="A quick read on sector leaders, laggards, and broad index movement."
                            scriptUrl={`${scriptUrl}market-overview.js`}
                            config={MARKET_OVERVIEW_WIDGET_CONFIG}
                            className="custom-chart"
                            height={600}
                        />
                    </div>
                    <div className="md-col-span xl:col-span-2">
                        <TradingViewWidget
                            eyebrow="Breadth"
                            title="Stock Heatmap"
                            description="Spot where capital is flowing at a glance with a cleaner visual frame."
                            scriptUrl={`${scriptUrl}stock-heatmap.js`}
                            config={HEATMAP_WIDGET_CONFIG}
                            height={600}
                        />
                    </div>
                </section>

                <section className="grid w-full gap-8 home-section">
                    <div className="h-full md:col-span-1 xl:col-span-1">
                        <TradingViewWidget
                            eyebrow="News"
                            title="Top Stories"
                            description="Keep the latest market narrative beside price movement."
                            scriptUrl={`${scriptUrl}timeline.js`}
                            config={TOP_STORIES_WIDGET_CONFIG}
                            className="custom-chart"
                            height={600}
                        />
                    </div>
                    <div className="h-full md:col-span-1 xl:col-span-2">
                        <TradingViewWidget
                            eyebrow="Quotes"
                            title="Market Data"
                            description="Scan the most relevant names in a denser but easier-to-read layout."
                            scriptUrl={`${scriptUrl}market-quotes.js`}
                            config={MARKET_DATA_WIDGET_CONFIG}
                            height={600}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Home;
