import axios from "axios";
import { clearAccessToken, getAccessToken } from "../utils/authToken";
import { toastBus } from "../utils/toastBus";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAccessToken();
      toastBus.error("Сессия истекла. Войдите снова.");
    } else if (error.response?.status === 403) {
      toastBus.error("Доступ запрещён.");
    } else if (error.response?.status === 422) {
      toastBus.error("Ошибка валидации данных.");
    } else if (error.response?.status >= 500) {
      toastBus.error("Ошибка сервера. Попробуйте позже.");
    } else if (!error.response) {
      toastBus.error("Ошибка сети. Проверьте подключение.");
    }

    return Promise.reject(error);
  },
);
