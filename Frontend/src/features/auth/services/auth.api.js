import axios from "axios";

const TOKEN_KEY = "lazycv_token";

const api = axios.create({
    baseURL: "https://lazycv.onrender.com",
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export async function register(username, email, password) {
    const response = await api.post("/api/auth/register", { username, email, password });
    if (response.data?.token) localStorage.setItem(TOKEN_KEY, response.data.token);
    return response.data;
}

export async function login(email, password) {
    const response = await api.post("/api/auth/login", { email, password });
    if (response.data?.token) localStorage.setItem(TOKEN_KEY, response.data.token);
    return response.data;
}

export async function logout() {
    const response = await api.get("/api/auth/logout");
    localStorage.removeItem(TOKEN_KEY);
    return response.data;
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me");
    return response.data;
}
