'use client';

import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// This renders the nav links and highlights the current page.
const NavItems = () => {
    const pathname: string = usePathname();
    const [hoveredPath, setHoveredPath] = useState<string | null>(null);
    const [pendingPath, setPendingPath] = useState<string | null>(null);

    useEffect(() => {
        setPendingPath(null);
    }, [pathname]);

    // This checks whether a nav item should look active for the current route.
    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <ul className="nav-list">
            {NAV_ITEMS.map(({ href, label}) => (
                <li key={href}>
                    <Link
                        href={href}
                        onClick={() => {
                            if (pathname !== href) {
                                setPendingPath(href);
                            }
                        }}
                        onMouseEnter={() => setHoveredPath(href)}
                        onMouseLeave={() => setHoveredPath(null)}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 transition-colors duration-200 ${
                            hoveredPath === href ? 'text-yellow-500' : isActive(href) ? 'text-white' : 'text-gray-500'
                        }`}
                        aria-current={isActive(href) ? 'page' : undefined}
                    >
                        {label}
                        {pendingPath === href && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    </Link>
                </li>
            ))}
        </ul>
    );
};

export default NavItems;
