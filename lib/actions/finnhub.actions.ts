'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

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

type QuoteResponse = {
    c?: number;
    d?: number;
    dp?: number;
    h?: number;
    l?: number;
    o?: number;
    pc?: number;
};

function formatInstrumentLabel(rawType: string | undefined, exchange: string): string {
    const normalizedType = (rawType || '').trim();

    if (!normalizedType) {
        return 'Stock';
    }

    const lowerType = normalizedType.toLowerCase();

    if (lowerType === 'common stock' || lowerType === 'stock' || lowerType === 'equity') {
        return 'Stock';
    }

    if (lowerType === 'etf' || lowerType === 'etp') {
        return 'ETF';
    }

    if (lowerType === 'adr') {
        return 'ADR';
    }

    if (lowerType === 'preferred stock') {
        return 'Preferred';
    }

    if (lowerType === 'mutual fund') {
        return 'Fund';
    }

    if (lowerType === 'index') {
        return 'Index';
    }

    return normalizedType;
}

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
                    type: formatInstrumentLabel(item.type, exchange),
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

// This fetches a simple quote snapshot for one stock symbol.
export async function getStockQuote(symbol: string): Promise<QuoteResponse | null> {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return null;

    try {
        const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(cleanSymbol)}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
        return await fetchJSON<QuoteResponse>(url, 60);
    } catch (err) {
        console.error('getStockQuote error:', err);
        return null;
    }
}

// This builds a more varied company-news feed by combining symbol-specific and relevant general stories.
export async function getCompanySpecificNews(symbol: string, company: string): Promise<MarketNewsArticle[]> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanCompany = company.trim().toLowerCase();

    if (!cleanSymbol) return [];

    try {
        const companyNews = await getNews([cleanSymbol]);
        const generalNews = await getNews();

        const relatedGeneral = generalNews.filter((article) => {
            const haystack = `${article.headline} ${article.summary} ${article.related}`.toLowerCase();
            return haystack.includes(cleanSymbol.toLowerCase()) || (cleanCompany && haystack.includes(cleanCompany));
        });

        const merged = [...companyNews, ...relatedGeneral];
        const seen = new Set<string>();
        const sources = new Set<string>();
        const diversified: MarketNewsArticle[] = [];

        for (const article of merged) {
            const key = article.url || `${article.source}-${article.headline}`;
            if (seen.has(key)) continue;
            seen.add(key);

            // Prefer adding new sources early to avoid showing one outlet repeatedly.
            if (!sources.has(article.source) || diversified.length < 3) {
                diversified.push(article);
                sources.add(article.source);
            } else if (diversified.length < 8) {
                diversified.push(article);
            }

            if (diversified.length >= 8) break;
        }

        return diversified;
    } catch (err) {
        console.error('getCompanySpecificNews error:', err);
        return [];
    }
}

// This builds a short company-specific summary from recent news using Gemini.
export async function getCompanyNewsSummary(
    symbol: string,
    company: string,
    news: MarketNewsArticle[],
    quote?: QuoteResponse | null
): Promise<string> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanCompany = company.trim() || cleanSymbol;

    if (!cleanSymbol || news.length === 0) {
        return `No recent company-specific news summary is available for ${cleanCompany} right now.`;
    }

    if (!GEMINI_API_KEY) {
        return `Recent updates for ${cleanCompany} are listed below. Gemini summary is unavailable because the API key is missing.`;
    }

    const prompt = [
        `Summarize the latest company-specific news for ${cleanCompany} (${cleanSymbol}).`,
        'Write exactly 5 short bullet points in simple language for retail investors.',
        'Cover: current stock performance, what the latest news says, key opportunity, key risk, and whether the stock looks stronger/weaker/unclear right now.',
        'Do not give absolute financial advice or guaranteed predictions. Use balanced language like "looks constructive", "needs caution", or "mixed signals".',
        'Do not use markdown headings. Keep the total under 180 words.',
        '',
        `Latest quote data: ${JSON.stringify(quote || {}, null, 2)}`,
        `News data: ${JSON.stringify(news.slice(0, 5), null, 2)}`,
    ].join('\n');

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }],
                        },
                    ],
                }),
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini summary failed with status ${response.status}`);
        }

        const data = await response.json() as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text || `Recent updates for ${cleanCompany} are listed below.`;
    } catch (err) {
        console.error('getCompanyNewsSummary error:', err);
        return `Recent updates for ${cleanCompany} are listed below.`;
    }
}
