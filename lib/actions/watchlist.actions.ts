'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getAuth } from '@/lib/better-auth/auth';

type WatchlistRecord = {
    symbol: string;
    company: string;
    addedAt: Date;
};

// This resolves the signed-in user from Better Auth so watchlist actions stay server-trusted.
async function getCurrentUserContext() {
    const auth = await getAuth();

    if (!auth) return null;

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) return null;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({
        email: session.user.email,
    });

    if (!user) return null;

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return null;

    return { userId, email: session.user.email };
}

// This finds a user's watchlist symbols by first locating the user from their email.
export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((item) => String(item.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail:', err);
        return [];
    }
}

// This loads the signed-in user's watchlist symbols for route rendering.
export async function getWatchlistSymbolsForCurrentUser(): Promise<string[]> {
    try {
        const context = await getCurrentUserContext();
        if (!context) return [];

        const items = await Watchlist.find({ userId: context.userId }, { symbol: 1 }).lean();
        return items.map((item) => String(item.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsForCurrentUser:', err);
        return [];
    }
}

// This loads the signed-in user's saved watchlist records for the watchlist page.
export async function getWatchlistItemsForCurrentUser(): Promise<WatchlistRecord[]> {
    try {
        const context = await getCurrentUserContext();
        if (!context) return [];

        const items = await Watchlist.find(
            { userId: context.userId },
            { symbol: 1, company: 1, addedAt: 1, _id: 0 }
        )
            .sort({ addedAt: -1 })
            .lean();

        return items.map((item) => ({
            symbol: String(item.symbol),
            company: String(item.company),
            addedAt: item.addedAt instanceof Date ? item.addedAt : new Date(item.addedAt),
        }));
    } catch (err) {
        console.error('getWatchlistItemsForCurrentUser:', err);
        return [];
    }
}

// This adds a stock to the signed-in user's watchlist and refreshes the relevant pages.
export async function addToWatchlist({
                                         symbol,
                                         company,
                                     }: {
    symbol: string;
    company: string;
}) {
    const trimmedSymbol = symbol.trim().toUpperCase();
    const trimmedCompany = company.trim();

    if (!trimmedSymbol || !trimmedCompany) {
        return { success: false, error: 'Stock information is missing.' };
    }

    try {
        const context = await getCurrentUserContext();
        if (!context) {
            return { success: false, error: 'You must be signed in to update your watchlist.' };
        }

        await Watchlist.updateOne(
            { userId: context.userId, symbol: trimmedSymbol },
            {
                $setOnInsert: {
                    userId: context.userId,
                    symbol: trimmedSymbol,
                    company: trimmedCompany,
                    addedAt: new Date(),
                },
            },
            { upsert: true }
        );

        revalidatePath('/search');
        revalidatePath('/watchlist');

        return { success: true, symbol: trimmedSymbol, isInWatchlist: true };
    } catch (err) {
        console.error('addToWatchlist:', err);
        return { success: false, error: 'Could not add this stock to your watchlist.' };
    }
}

// This removes a stock from the signed-in user's watchlist and refreshes the relevant pages.
export async function removeFromWatchlist(symbol: string) {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol) {
        return { success: false, error: 'Stock symbol is missing.' };
    }

    try {
        const context = await getCurrentUserContext();
        if (!context) {
            return { success: false, error: 'You must be signed in to update your watchlist.' };
        }

        await Watchlist.deleteOne({ userId: context.userId, symbol: trimmedSymbol });

        revalidatePath('/search');
        revalidatePath('/watchlist');

        return { success: true, symbol: trimmedSymbol, isInWatchlist: false };
    } catch (err) {
        console.error('removeFromWatchlist:', err);
        return { success: false, error: 'Could not remove this stock from your watchlist.' };
    }
}