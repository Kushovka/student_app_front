import { type FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router";
import {
  IoCheckmarkCircleOutline,
  IoLogInOutline,
  IoPersonAddOutline,
  IoSchoolOutline,
} from "react-icons/io5";
import { loginUser, registerUser } from "../api/auth";
import { getSchools, type School } from "../api/schools";
import { getAccessToken, setAccessToken } from "../utils/authToken";

type AuthMode = "login" | "register";

interface AuthPageProps {
  mode: AuthMode;
}

interface LocationState {
  from?: {
    pathname?: string;
  };
  email?: string;
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
    email: locationState?.email || "",
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
          email: form.email,
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
        state: { email: form.email },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm lg:block">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <IoSchoolOutline className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-bold text-zinc-950">School List</p>
              <p className="text-sm font-medium text-zinc-500">
                Панель для школы
              </p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Быстрый доступ
            </p>
            <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight text-zinc-950">
              Ученики, классы и уведомления в одном месте
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-600">
              После входа открывается защищенная рабочая зона: список классов,
              ученики и отправка уведомлений родителям.
            </p>
          </div>

          <div className="mt-10 grid gap-3">
            {["Защищенный вход", "Единый список учеников", "История замечаний"].map(
              (item) => (
                <div key={item} className="flex items-center gap-3">
                  <IoCheckmarkCircleOutline className="h-5 w-5 text-cyan-700" />
                  <span className="text-sm font-semibold text-zinc-700">
                    {item}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-lg">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <IoSchoolOutline className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-bold text-zinc-950">School List</p>
              <p className="text-sm font-medium text-zinc-500">
                Панель для школы
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
              {isLogin ? "Авторизация" : "Новый аккаунт"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-950">
              {isLogin ? "Вход в систему" : "Регистрация"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {isLogin
                ? "Введи email и пароль, чтобы открыть приложение."
                : "Заполни данные, затем войди по email и паролю."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
          >
            {!isLogin && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-zinc-700">
                  Фамилия
                  <input
                    value={form.last_name}
                    onChange={(event) =>
                      updateField("last_name", event.target.value)
                    }
                    className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-zinc-700">
                  Имя
                  <input
                    value={form.first_name}
                    onChange={(event) =>
                      updateField("first_name", event.target.value)
                    }
                    className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-zinc-700 sm:col-span-2">
                  Отчество
                  <input
                    value={form.middle_name}
                    onChange={(event) =>
                      updateField("middle_name", event.target.value)
                    }
                    className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-zinc-700 sm:col-span-2">
                  Школа
                  <select
                    value={form.school_id}
                    onChange={(event) =>
                      updateField("school_id", event.target.value)
                    }
                    disabled={isSchoolsLoading || schools.length === 0}
                    className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
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
                </label>
              </div>
            )}

            <div
              className={
                isLogin
                  ? "grid gap-4"
                  : "mt-4 grid gap-4 sm:grid-cols-2"
              }
            >
              <label className="grid gap-2 text-sm font-medium text-zinc-700 sm:col-span-2">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-zinc-700 sm:col-span-2">
                Пароль
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  required
                />
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (!isLogin && isSchoolsLoading)}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 active:scale-[0.98]"
            >
              {isLogin ? (
                <IoLogInOutline className="h-5 w-5" />
              ) : (
                <IoPersonAddOutline className="h-5 w-5" />
              )}
              {isSubmitting
                ? "Подожди..."
                : isLogin
                  ? "Войти"
                  : "Зарегистрироваться"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-600">
            {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <Link
              to={isLogin ? "/register" : "/login"}
              className="font-bold text-cyan-700 hover:text-cyan-800"
            >
              {isLogin ? "Зарегистрироваться" : "Войти"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
