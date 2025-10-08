import axios, { AxiosInstance } from 'axios';
import { Agency } from '../interfaces/Models';

class ApiService {
    private api: AxiosInstance;
    private edgeFunctionsUrl: string;
    private supabaseAnonKey: string;

    constructor() {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        this.edgeFunctionsUrl = `${supabaseUrl}/functions/v1`;

        const baseURL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000/api';
        this.api = axios.create({
            baseURL,
        });
    }

    // Helper method to get JWT token from localStorage
    private getAuthToken(): string | null {
        return localStorage.getItem('token');
    }

    // Helper method to get stefanmars API token from localStorage
    private getStefanmarsToken(): string | null {
        return localStorage.getItem('stefanmars_token');
    }

    // URL utility functions
    static urls = {

        properties: () => '/properties',
        GetMyHome: () => '/myhome',
        GetAcquaint: () => '/acquaint',
        GetDaft: () => '/daft', //change to /daft
        field_mappings: () => '/field_mappings',

        agencies: () => '/agencies',
        agency: () => '/agency/',
        verifyToken: () => '/verify_token',
        login: () => '/login',
        UpdateAgency: () => '/agencies/',
    };



    getProperties(key: string, sync: boolean = false) {
        const token = this.getStefanmarsToken();
        return axios.get(`${this.edgeFunctionsUrl}/properties`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            },
            params: {
                key: key,
                sync: sync ? 'true' : 'false'
            }
        });
    }

    refreshProperties(key: string) {
        return this.getProperties(key, true);
    }

    getAgencies(sync: boolean = false) {
        const token = this.getStefanmarsToken();
        return axios.get(`${this.edgeFunctionsUrl}/agencies`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            },
            params: {
                sync: sync ? 'true' : 'false'
            }
        });
    }

    getAgency(key: string) {
        return this.api.get(ApiService.urls.agency(), {
            headers: {
                'key': key
            }
        });
    }

    verifyToken(token: string) {
        return this.api.get(ApiService.urls.verifyToken(), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    login(email: string, password: string) {
        return axios.post(`${this.edgeFunctionsUrl}/login`, { email, password }, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`
            }
        });
    }


    getMyHome(apiKey: string, Listreff: string) {
        const token = this.getStefanmarsToken();
        return axios.get(`${this.edgeFunctionsUrl}/myhome`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            },
            params: {
                key: apiKey,
                id: Listreff
            }
        });
    }

    getDaft(apiKey: string, Listreff: string) {
        const token = this.getStefanmarsToken();
        return axios.get(`${this.edgeFunctionsUrl}/daft`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            },
            params: {
                key: apiKey,
                id: Listreff
            }
        });
    }

    GetAcquaint(apiKey: string, Listreff: string) {
        const token = this.getStefanmarsToken();
        return axios.get(`${this.edgeFunctionsUrl}/acquaint`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            },
            params: {
                key: apiKey,
                id: Listreff
            }
        });
    }
    updateAgency(id: number, data: Partial<Agency>) {
        const token = this.getAuthToken();

        return this.api.put(ApiService.urls.UpdateAgency() + id, data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
    GetFieldMappings() {
        const token = this.getStefanmarsToken();
        return axios.get(`${this.edgeFunctionsUrl}/field-mappings`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            }
        });
    }

    // Add Field Mapping CRUD
    addFieldMapping(data: any) {
        const token = this.getStefanmarsToken();
        return axios.post(`${this.edgeFunctionsUrl}/field-mappings`, data, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            }
        });
    }

    updateFieldMapping(id: number, data: any) {
        const token = this.getStefanmarsToken();
        return axios.put(`${this.edgeFunctionsUrl}/field-mappings/${id}`, data, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            }
        });
    }

    deleteFieldMapping(id: number) {
        const token = this.getStefanmarsToken();
        return axios.delete(`${this.edgeFunctionsUrl}/field-mappings/${id}`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            }
        });
    }

    // Add recount properties endpoints
    recountAllAgencyProperties() {
        const token = this.getAuthToken();
        return this.api.post('/agencies/recount-properties', {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    recountAgencyProperties(id: number) {
        const token = this.getAuthToken();
        return this.api.post(`/agencies/${id}/recount-properties`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    // Add method to refresh agencies
    refreshAgencies() {
        const stefanmarsToken = this.getStefanmarsToken();
        console.log('[API SERVICE] ======================');
        console.log('[API SERVICE] Stefanmars Token from localStorage:', stefanmarsToken);
        console.log('[API SERVICE] Token present?:', stefanmarsToken ? 'YES' : 'NO');
        console.log('[API SERVICE] Token value:', stefanmarsToken);
        console.log('[API SERVICE] Edge Functions URL:', this.edgeFunctionsUrl);
        console.log('[API SERVICE] Full URL:', `${this.edgeFunctionsUrl}/agencies?sync=true`);

        const headers = {
            'apikey': this.supabaseAnonKey,
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
            'token': stefanmarsToken || ''
        };

        console.log('[API SERVICE] Headers being sent:', JSON.stringify(headers, null, 2));
        console.log('[API SERVICE] ======================');

        return axios.get(`${this.edgeFunctionsUrl}/agencies`, {
            headers,
            params: {
                sync: 'true'
            },
            timeout: 300000 // 5 minute timeout
        });
    }

    // Add this method to fetch all Daft properties
    getAllDaftProperties(apiKey: string) {
        return this.api.get('/daft/all', { params: { apiKey } });
    }

    // Remove this method to fetch all Acquaint properties
    // getAllAcquaintProperties(key: string) {
    //     return this.api.get('/acquaint/all', { params: { key } });
    // }

    // Add agency creation endpoint
    createAgency(data: Partial<Agency>) {
        const token = this.getAuthToken();
        return this.api.post(ApiService.urls.agencies(), data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    // Get all property sources data in one request
    getPropertySources(listReff: string, daftKey?: string, myhomeKey?: string, fourpmKey?: string) {
        const token = this.getStefanmarsToken();
        const params = new URLSearchParams({ id: listReff });
        if (daftKey) params.append('daft_key', daftKey);
        if (myhomeKey) params.append('myhome_key', myhomeKey);
        if (fourpmKey) params.append('fourpm_key', fourpmKey);

        return axios.get(`${this.edgeFunctionsUrl}/property-sources?${params.toString()}`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'token': token
            }
        });
    }
}

const apiService = new ApiService();
export default apiService;
export { ApiService };