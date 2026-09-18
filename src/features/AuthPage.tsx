import { type FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router";
import {
  IoLogInOutline,
  IoPersonAddOutline,
} from "react-icons/io5";
import { loginUser, registerUser } from "../api/auth";
import { getSchools, type School } from "../api/schools";
import AppLogo from "../components/AppLogo";
import ThemeToggle from "../components/ThemeToggle";
import { getAccessToken, setAccessToken } from "../utils/authToken";

type AuthMode = "login" | "register";

interface AuthPageProps {
  mode: AuthMode;
}

interface LocationState {
  from?: {
    pathname?: string;
  };
  login?: string;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join(". ");
    }

    if (typeof detail === "string") {
      return detail;
    }
  }

  return "Не получилось выполнить запрос. Проверь данные и попробуй еще раз.";
};

const AuthPage = ({ mode }: AuthPageProps) => {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const redirectPath = locationState?.from?.pathname || "/";

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    login: locationState?.login || "",
    password: "",
    school_id: "",
  });
  const [error, setError] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (isLogin) return;

    const fetchSchools = async () => {
      try {
        setIsSchoolsLoading(true);
        const data = await getSchools();
        setSchools(data);
        setForm((prev) => ({
          ...prev,
          school_id: prev.school_id || data[0]?.id || "",
        }));
      } catch {
        setError("Не удалось загрузить список школ.");
      } finally {
        setIsSchoolsLoading(false);
      }
    };

    fetchSchools();
  }, [isLogin]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const data = await loginUser({
          login: form.login,
          password: form.password,
        });

        setAccessToken(data.access_token);
        navigate(redirectPath, { replace: true });
        return;
      }

      if (!form.school_id) {
        setError("Выбери школу для регистрации.");
        return;
      }

      await registerUser(form);
      navigate("/login", {
        replace: true,
        state: { login: form.login },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 text-slate-950 transition-colors dark:bg-[#151515] dark:text-slate-100">
      <div className="fixed right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle compact />
      </div>

      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center py-12">
        <div className="mb-10 flex flex-col items-center text-center">
          <AppLogo className="h-24 w-24" />
          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
              Школьный контроль
            </h1>
          </div>
          <p className="mt-3 text-base font-medium text-slate-500 dark:text-slate-400">
            {isLogin
              ? "Войдите, чтобы открыть рабочий журнал"
              : "Создайте аккаунт сотрудника школы"}
          </p>
        </div>

        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="grid gap-3"
          >
            {!isLogin && (
              <div className="grid gap-3">
                <label className="sr-only" htmlFor="last_name">
                  Фамилия
                </label>
                <input
                  id="last_name"
                  value={form.last_name}
                  onChange={(event) =>
                    updateField("last_name", event.target.value)
                  }
                  placeholder="Фамилия"
                  className="auth-field"
                  required
                />

                <label className="sr-only" htmlFor="first_name">
                  Имя
                </label>
                <input
                  id="first_name"
                  value={form.first_name}
                  onChange={(event) =>
                    updateField("first_name", event.target.value)
                  }
                  placeholder="Имя"
                  className="auth-field"
                  required
                />

                <label className="sr-only" htmlFor="middle_name">
                  Отчество
                </label>
                  <input
                  id="middle_name"
                  value={form.middle_name}
                    onChange={(event) =>
                    updateField("middle_name", event.target.value)
                    }
                  placeholder="Отчество"
                  className="auth-field"
                    required
                  />

                <label className="sr-only" htmlFor="school_id">
                  Школа
                </label>
                  <select
                  id="school_id"
                    value={form.school_id}
                    onChange={(event) =>
                      updateField("school_id", event.target.value)
                    }
                    disabled={isSchoolsLoading || schools.length === 0}
                  className="auth-field"
                    required
                  >
                    <option value="">
                      {isSchoolsLoading ? "Загружаем школы..." : "Выберите школу"}
                    </option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}, {school.city}
                      </option>
                    ))}
                  </select>
              </div>
            )}

            <div
              className={
                isLogin
                  ? "grid gap-3"
                  : "grid gap-3"
              }
            >
              <label className="sr-only" htmlFor="login">
                Логин
              </label>
              <input
                id="login"
                type="text"
                autoComplete="username"
                value={form.login}
                onChange={(event) => updateField("login", event.target.value)}
                placeholder="Логин"
                className="auth-field"
                required
              />

              <label className="sr-only" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                placeholder="Пароль"
                className="auth-field"
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (!isLogin && isSchoolsLoading)}
              className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isLogin ? (
                <IoLogInOutline className="h-5 w-5" />
              ) : (
                <IoPersonAddOutline className="h-5 w-5" />
              )}
              {isSubmitting
                ? "Подождите..."
                : isLogin
                  ? "Войти"
                  : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm font-semibold">
            <span className="text-slate-500 dark:text-slate-500">
              {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}
            </span>
            <Link
              to={isLogin ? "/register" : "/login"}
              className="text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isLogin ? "Зарегистрироваться" : "Войти"}
            </Link>
          </div>

          {isLogin && (
            <p className="mt-6 text-center text-sm leading-6 text-slate-500 dark:text-slate-500">
              Используя систему, вы подтверждаете право доступа к данным своей
              школы.
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
