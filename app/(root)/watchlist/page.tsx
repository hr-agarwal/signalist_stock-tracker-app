import Link from 'next/link';
import { Sparkles, Star } from 'lucide-react';
import WatchlistRowActions from '@/components/WatchlistRowActions';
import { getWatchlistItemsForCurrentUser } from '@/lib/actions/watchlist.actions';

// This shows the current user's watchlist symbols with a simple empty state.
export default async function WatchlistPage() {
    let items: { symbol: string; company: string; addedAt: Date }[] = [];

    try {
        items = await getWatchlistItemsForCurrentUser();
    } catch (error) {
        console.error('Watchlist page failed to load:', error);
    }

    if (items.length === 0) {
        return (
            <section className="watchlist-page">
                <div className="watchlist-hero">
                    <div className="watchlist-hero-copy">
                        <div className="watchlist-pill">
                            <Sparkles className="h-4 w-4 text-pink-500" />
                            <span>Personal watchlist</span>
                        </div>
                        <p className="watchlist-kicker">Tracking</p>
                        <h1 className="watchlist-heading">Build a cleaner shortlist of the stocks you care about.</h1>
                        <p className="watchlist-subheading">
                            Your watchlist is empty right now. Search for symbols and add the ones you want to follow here.
                        </p>
                    </div>
                </div>

                <div className="watchlist-empty-panel">
                    <div className="watchlist-empty">
                        <Star className="watchlist-star" />
                        <h2 className="empty-title">Your watchlist is empty</h2>
                        <p className="empty-description">
                            Search stocks and add the companies you want to track here.
                        </p>
                        <Link href="/search" className="search-btn">
                            Go to Search
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="watchlist-page">
            <div className="watchlist-hero">
                <div className="watchlist-hero-copy">
                    <div className="watchlist-pill">
                        <Sparkles className="h-4 w-4 text-pink-500" />
                        <span>Personal watchlist</span>
                    </div>
                    <p className="watchlist-kicker">Tracking</p>
                    <h1 className="watchlist-heading">Keep your highest-conviction names in one focused space.</h1>
                    <p className="watchlist-subheading">
                        Review saved symbols quickly and jump back into search whenever you want more context.
                    </p>
                </div>
                <div className="watchlist-count-card">
                    <span className="watchlist-count-label">Saved symbols</span>
                    <strong className="watchlist-count-value">{items.length}</strong>
                </div>
            </div>

            <div className="watchlist-panel">
                <div className="watchlist-panel-header">
                    <div>
                        <h2 className="watchlist-title">Your symbols</h2>
                        <p className="watchlist-panel-text">Open any symbol in search with one click.</p>
                    </div>
                </div>

                <ul className="watchlist-symbol-list">
                    {items.map((item) => (
                        <li
                            key={item.symbol}
                            className="watchlist-symbol-item"
                        >
                            <div>
                                <span className="watchlist-symbol-code">{item.symbol}</span>
                                <p className="watchlist-symbol-company">{item.company}</p>
                                <p className="watchlist-symbol-note">Jump back into discovery for more details.</p>
                            </div>
                            <WatchlistRowActions symbol={item.symbol} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
