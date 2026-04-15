'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

// This fetches JSON from an API and optionally caches it for a short time.
async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
    const options: RequestInit & { next?: { revalidate: number } } = revalidateSeconds
        ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
        : { cache: 'no-store' };

    const res = await fetch(url, options);

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Fetch failed ${res.status}: ${text}`);
    }

    return (await res.json()) as T;
}

export { fetchJSON };

// This searches Finnhub for matching stock symbols and returns clean app-friendly results.
export async function searchStocks(query: string): Promise<Stock[]> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) return [];

    try {
        const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmedQuery)}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
        const data = await fetchJSON<FinnhubSearchResponse>(url, 300);
        const seen = new Set<string>();

        return (data.result || [])
            .filter((item) => item.symbol && item.description)
            .filter((item) => {
                const symbol = item.displaySymbol || item.symbol;
                if (seen.has(symbol)) return false;
                seen.add(symbol);
                return true;
            })
            .slice(0, 12)
            .map((item) => {
                const displaySymbol = item.displaySymbol || item.symbol;
                const exchange = displaySymbol.includes(':')
                    ? displaySymbol.split(':')[0]
                    : 'Global';

                return {
                    symbol: displaySymbol,
                    name: item.description,
                    exchange,
                    type: item.type || 'Stock',
                };
            });
    } catch (err) {
        console.error('searchStocks error:', err);
        return [];
    }
}

// This gets market news, using watchlist symbols first and general news as a fallback.
export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    try {
        const range = getDateRange(5);
        const token = NEXT_PUBLIC_FINNHUB_API_KEY;

        const cleanSymbols = (symbols || [])
            .map((s) => s?.trim().toUpperCase())
            .filter((s): s is string => Boolean(s));

        const maxArticles = 6;

        if (cleanSymbols.length > 0) {
            const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

            await Promise.all(
                cleanSymbols.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(
                            sym
                        )}&from=${range.from}&to=${range.to}&token=${token}`;

                        const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
                        perSymbolArticles[sym] = (articles || []).filter(validateArticle);
                    } catch (e) {
                        console.error('Error fetching company news for', sym, e);
                        perSymbolArticles[sym] = [];
                    }
                })
            );

            const collected: MarketNewsArticle[] = [];

            for (let round = 0; round < maxArticles; round++) {
                for (let i = 0; i < cleanSymbols.length; i++) {
                    const sym = cleanSymbols[i];
                    const list = perSymbolArticles[sym] || [];

                    if (list.length > 0) {
                        const article = list.shift();
                        if (!article || !validateArticle(article)) continue;

                        collected.push(formatArticle(article, true, sym, round));

                        if (collected.length >= maxArticles) break;
                    }
                }
                if (collected.length >= maxArticles) break;
            }

            if (collected.length > 0) {
                collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
                return collected.slice(0, maxArticles);
            }
        }

        // Fallback to general news
        const generalurl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
        const general = await fetchJSON<RawNewsArticle[]>(generalurl, 300);

        const seen = new Set<string>();
        const unique: RawNewsArticle[] = [];

        for (const art of general || []) {
            if (!validateArticle(art)) continue;

            const key = `${art.id}-${art.url}-${art.headline}`;
            if (seen.has(key)) continue;

            seen.add(key);
            unique.push(art);

            if (unique.length >= 20) break;
        }

        return unique
            .slice(0, maxArticles)
            .map((a, idx) => formatArticle(a, false, undefined, idx));
    } catch (err) {
        console.error('getNews error:', err);
        throw new Error('Failed to fetch news');
    }
}
