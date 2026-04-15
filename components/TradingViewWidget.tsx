'use client';

import { memo } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import {cn} from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    eyebrow?: string;
    description?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

// This shows one TradingView widget and lets the hook mount the external script inside it.
const TradingViewWidget = ({
    title,
    eyebrow,
    description,
    scriptUrl,
    config,
    height= 600,
    className,
}: TradingViewWidgetProps)=> {
    const containerRef = useTradingViewWidget( scriptUrl, config, height);



    return (
        <section className="dashboard-card w-full">
            {(eyebrow || title || description) && (
                <div className="dashboard-card-header">
                    <div>
                        {eyebrow && <p className="dashboard-card-eyebrow">{eyebrow}</p>}
                        {title && <h3 className="dashboard-card-title">{title}</h3>}
                        {description && <p className="dashboard-card-description">{description}</p>}
                    </div>
                    <span className="dashboard-card-badge">Live</span>
                </div>
            )}
           <div className={cn('tradingview-widget-container dashboard-widget-frame', className)} ref={containerRef}>
              <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }}/>
           </div>
        </section>
    );
}

export default memo(TradingViewWidget);
