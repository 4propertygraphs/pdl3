import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FourPMAgency {
    Name: string;
    OfficeName: string;
    Address1: string;
    Address2: string;
    Logo: string;
    Site: string;
    DaftApiKey: string;
    Key: string;
    AcquiantCustomer?: {
        SiteName: string;
        SitePrefix: string;
        FourPMBranchID: number;
    };
    MyhomeApi?: {
        ApiKey: string;
        GroupID: number;
    };
}

export class ScraperService {
    private static readonly FOURPM_API_URL = 'https://api2.4pm.ie/api/Agency/GetAgency';
    private static readonly API_KEY = 'RDlaeFVPN004a0hvJTJmWUJIQTN3TVdnJTNkJTNk0';
    private static readonly SYNC_INTERVAL = 60 * 60 * 1000;
    private static intervalId: number | null = null;
    private static isRunning = false;

    static removeDuplicates<T>(items: T[], key: keyof T): T[] {
        const seen = new Set();
        const result: T[] = [];

        for (const item of items) {
            const value = item[key];
            if (!seen.has(value)) {
                seen.add(value);
                result.push(item);
            }
        }

        return result;
    }

    static async scrapeAndSaveAgencies(): Promise<void> {
        try {
            console.log('[Scraper] Fetching agencies from 4PM API...');
            const response = await axios.get(`${this.FOURPM_API_URL}?Key=${this.API_KEY}`);
            const agencies = response.data as FourPMAgency[];
            const uniqueAgencies = this.removeDuplicates(agencies, 'Name');

            console.log(`[Scraper] Found ${uniqueAgencies.length} unique agencies`);

            let successCount = 0;
            let failedCount = 0;

            for (const agency of uniqueAgencies) {
                try {
                    const { data: existingAgency } = await supabase
                        .from('agencies')
                        .select('id')
                        .eq('unique_key', agency.Key)
                        .maybeSingle();

                    const agencyData = {
                        name: agency.Name,
                        office_name: agency.OfficeName,
                        address1: agency.Address1,
                        address2: agency.Address2,
                        logo: agency.Logo,
                        site_name: agency.AcquiantCustomer?.SiteName || null,
                        site_prefix: agency.AcquiantCustomer?.SitePrefix || null,
                        daft_api_key: agency.DaftApiKey,
                        fourpm_branch_id: agency.AcquiantCustomer?.FourPMBranchID || null,
                        myhome_api_key: agency.MyhomeApi?.ApiKey || null,
                        myhome_group_id: agency.MyhomeApi?.GroupID || null,
                        unique_key: agency.Key,
                        updated_at: new Date().toISOString()
                    };

                    if (existingAgency) {
                        const { error } = await supabase
                            .from('agencies')
                            .update(agencyData)
                            .eq('id', existingAgency.id);

                        if (error) throw error;
                    } else {
                        const { error } = await supabase
                            .from('agencies')
                            .insert([agencyData]);

                        if (error) throw error;
                    }

                    successCount++;
                } catch (error: any) {
                    failedCount++;
                    console.error(`[Scraper] Error saving agency ${agency.Name}:`, error.message);
                }
            }

            console.log(`[Scraper] Agencies sync complete: ${successCount} success, ${failedCount} failed`);
            await this.scrapeAndSaveProperties();

        } catch (error: any) {
            console.error('[Scraper] Error fetching agencies:', error.message);
        }
    }

    static async scrapeAndSaveProperties(): Promise<void> {
        try {
            console.log('[Scraper] Fetching agencies from database...');
            const { data: agencies } = await supabase
                .from('agencies')
                .select('id, unique_key, name')
                .not('unique_key', 'is', null);

            if (!agencies || agencies.length === 0) {
                console.log('[Scraper] No agencies found in database');
                return;
            }

            console.log(`[Scraper] Processing properties for ${agencies.length} agencies`);

            let totalSuccess = 0;
            let totalFailed = 0;

            for (const agency of agencies) {
                try {
                    console.log(`[Scraper] Fetching properties for ${agency.name}...`);
                    const response = await axios.get(`https://api2.4pm.ie/api/property/json?Key=${agency.unique_key}`);
                    const properties = response.data;

                    let successCount = 0;
                    let failedCount = 0;

                    for (const property of properties) {
                        try {
                            const { data: existingProperty } = await supabase
                                .from('properties')
                                .select('id')
                                .eq('external_id', property.ListReff)
                                .eq('agency_id', agency.id)
                                .maybeSingle();

                            const propertyData = {
                                agency_id: agency.id,
                                source: '4pm',
                                external_id: property.ListReff,
                                data: property,
                                updated_at: new Date().toISOString()
                            };

                            if (existingProperty) {
                                const { error } = await supabase
                                    .from('properties')
                                    .update(propertyData)
                                    .eq('id', existingProperty.id);

                                if (error) throw error;
                            } else {
                                const { error } = await supabase
                                    .from('properties')
                                    .insert([propertyData]);

                                if (error) throw error;
                            }

                            successCount++;
                        } catch (error: any) {
                            failedCount++;
                            console.error(`[Scraper] Error saving property ${property.ListReff}:`, error.message);
                        }
                    }

                    await supabase
                        .from('agencies')
                        .update({ total_properties: successCount })
                        .eq('id', agency.id);

                    totalSuccess += successCount;
                    totalFailed += failedCount;

                    console.log(`[Scraper] ${agency.name}: ${successCount} properties saved, ${failedCount} failed`);

                } catch (error: any) {
                    console.error(`[Scraper] Error fetching properties for ${agency.name}:`, error.message);
                }
            }

            console.log(`[Scraper] Properties sync complete: ${totalSuccess} success, ${totalFailed} failed`);

        } catch (error: any) {
            console.error('[Scraper] Error in property scraping:', error.message);
        }
    }

    static async runScraper(): Promise<void> {
        if (this.isRunning) {
            console.log('[Scraper] Already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = new Date();
        console.log(`[Scraper] Starting scrape at ${startTime.toLocaleString()}`);

        try {
            await this.scrapeAndSaveAgencies();
            localStorage.setItem('lastScrapeTime', startTime.toISOString());
        } catch (error) {
            console.error('[Scraper] Scrape failed:', error);
        } finally {
            this.isRunning = false;
            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 1000;
            console.log(`[Scraper] Completed in ${duration.toFixed(2)}s`);
        }
    }

    static startAutoScraper(): void {
        if (this.intervalId !== null) {
            console.log('[Scraper] Auto-scraper already running');
            return;
        }

        console.log('[Scraper] Starting auto-scraper (runs every hour)');

        this.runScraper();

        this.intervalId = window.setInterval(() => {
            this.runScraper();
        }, this.SYNC_INTERVAL);
    }

    static stopAutoScraper(): void {
        if (this.intervalId !== null) {
            console.log('[Scraper] Stopping auto-scraper');
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    static getLastScrapeTime(): Date | null {
        const lastScrape = localStorage.getItem('lastScrapeTime');
        return lastScrape ? new Date(lastScrape) : null;
    }
}
