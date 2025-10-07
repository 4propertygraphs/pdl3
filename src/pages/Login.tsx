import { useState } from 'react';
import apiService from '../services/ApiService'; // Gebruik de instantie, niet Axios zelf

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const basePath = import.meta.env.VITE_REACT_APP_FILE_LOCATION || '';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await apiService.login(email, password);
            console.log('[LOGIN] Full response:', response.data);

            const jwtToken = response.data.token;
            const stefanmarsToken = response.data.stefanmars_token || response.data.api_token;

            console.log('[LOGIN] JWT Token:', jwtToken);
            console.log('[LOGIN] Stefanmars Token:', stefanmarsToken);

            if (!jwtToken) {
                console.error('[LOGIN] No JWT token in response!');
                setError('Login failed - no token received');
                return;
            }

            localStorage.setItem('token', jwtToken);
            if (stefanmarsToken) {
                localStorage.setItem('stefanmars_token', stefanmarsToken);
                console.log('[LOGIN] Stefanmars token saved to localStorage');
            } else {
                console.warn('[LOGIN] No stefanmars token in response');
            }

            window.location.href = `${basePath}`;
        } catch (err) {
            console.error('Login failed:', err);
            setError('Invalid username or password');
        }
    };

    return (
        <div className="p-6 min-h-screen flex items-center justify-center dark:bg-gray-800">
            <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-300 mb-4 text-center">Login</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder='example@gmail.com'
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder='test1234'
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full cursor-pointer bg-purple-500 text-white font-semibold py-2 rounded hover:bg-purple-600"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
