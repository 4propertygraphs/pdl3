import { useEffect } from 'react';
import { ScraperService } from '../services/ScraperService';

export function AutoScraper() {
    useEffect(() => {
        ScraperService.startAutoScraper();

        return () => {
            ScraperService.stopAutoScraper();
        };
    }, []);

    return null;
}
