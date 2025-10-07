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

    // Helper method to get token from localStorage
    private getAuthToken(): string | null {
        return localStorage.getItem('token');
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



    getProperties(key: string) {
        const token = this.getAuthToken();
        return axios.get(`${this.edgeFunctionsUrl}/properties`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'x-api-token': token
            },
            params: {
                key: key
            }
        });
    }

    getAgencies() {
        const token = this.getAuthToken();
        return axios.get(`${this.edgeFunctionsUrl}/agencies`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'x-api-token': token
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
        const token = this.getAuthToken();
        return axios.get(`${this.edgeFunctionsUrl}/myhome`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'x-api-token': token
            },
            params: {
                key: apiKey,
                id: Listreff
            }
        });
    }

    getDaft(apiKey: string, Listreff: string) {
        const token = this.getAuthToken();
        return axios.get(`${this.edgeFunctionsUrl}/daft`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'x-api-token': token
            },
            params: {
                key: apiKey,
                id: Listreff
            }
        });
    }

    GetAcquaint(apiKey: string, Listreff: string) {
        const token = this.getAuthToken();
        return axios.get(`${this.edgeFunctionsUrl}/acquaint`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'x-api-token': token
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
        const token = this.getAuthToken();
        return axios.get(`${this.edgeFunctionsUrl}/field-mappings`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'x-api-token': token
            }
        });
    }

    // Add Field Mapping CRUD
    addFieldMapping(data: any) {
        const token = this.getAuthToken();
        return axios.post(`${this.edgeFunctionsUrl}/field-mappings`, data, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'x-api-token': token
            }
        });
    }

    updateFieldMapping(id: number, data: any) {
        const token = this.getAuthToken();
        return axios.put(`${this.edgeFunctionsUrl}/field-mappings/${id}`, data, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'x-api-token': token
            }
        });
    }

    deleteFieldMapping(id: number) {
        const token = this.getAuthToken();
        return axios.delete(`${this.edgeFunctionsUrl}/field-mappings/${id}`, {
            headers: {
                'apikey': this.supabaseAnonKey,
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'x-api-token': token
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
        const token = this.getAuthToken();
        return this.api.post('/agencies/refresh', {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
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
}

const apiService = new ApiService();
export default apiService;
export { ApiService };