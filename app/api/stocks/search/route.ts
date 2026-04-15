import { NextResponse } from 'next/server';
import { searchStocks } from '@/lib/actions/finnhub.actions';

// This handles stock-search requests from the search page UI.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    const results = await searchStocks(query);
    return NextResponse.json({ results });
}
