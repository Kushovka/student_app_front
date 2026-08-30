import { useEffect, useState } from "react";
import {
  IoArrowBackOutline,
  IoBusinessOutline,
  IoMailOutline,
  IoNotificationsOutline,
  IoPersonCircleOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/authContext";
import { formatRole } from "../utils/formatRole";

const storageKey = "student_app_settings";

interface LocalSettings {
  instantRedAlerts: boolean;
  digestPreview: boolean;
  showHints: boolean;
}

const defaultSettings: LocalSettings = {
  instantRedAlerts: true,
  digestPreview: true,
  showHints: true,
};

const readSettings = (): LocalSettings => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<LocalSettings>(readSettings);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof LocalSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300"
          >
            <IoArrowBackOutline className="h-5 w-5" />
            Назад
          </button>
          <p className="page-kicker">Настройки</p>
          <h1 className="page-title mt-2 dark:text-white">
            Параметры приложения
          </h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600 dark:text-slate-400">
            Тема, уведомления и рабочие предпочтения для текущего браузера.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
        <section className="surface overflow-hidden dark:border-white/10 dark:bg-white/[0.04]">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <IoSettingsOutline className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
                  Интерфейс
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  По умолчанию используется системная тема.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-base font-extrabold text-slate-950 dark:text-white">
                  Тема оформления
                </div>
                <div className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Светлая, тёмная или как в системе.
                </div>
              </div>
              <ThemeToggle />
            </div>

            {[
              {
                key: "showHints" as const,
                title: "Показывать подсказки",
                text: "Короткие пояснения в рабочих разделах.",
              },
              {
                key: "digestPreview" as const,
                title: "Показывать дайджест",
                text: "Предпросмотр регулярной сводки по замечаниям.",
              },
              {
                key: "instantRedAlerts" as const,
                title: "Уведомления родителям",
                text: "Новые замечания можно отправить общей сводкой.",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <span>
                  <span className="block text-base font-extrabold text-slate-950 dark:text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm font-medium text-slate-500 dark:text-slate-400">
                    {item.text}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={() => updateSetting(item.key)}
                  className="h-6 w-6 accent-blue-600"
                />
              </label>
            ))}
          </div>
        </section>

        <aside className="surface h-fit overflow-hidden dark:border-white/10 dark:bg-white/[0.04]">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
              Аккаунт
            </h2>
          </div>
          <div className="grid gap-3 p-5">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.04]">
              <IoPersonCircleOutline className="mt-0.5 h-6 w-6 text-blue-600 dark:text-blue-300" />
              <div className="min-w-0">
                <div className="truncate text-base font-extrabold text-slate-950 dark:text-white">
                  {user?.last_name} {user?.first_name} {user?.middle_name}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {formatRole(user?.role)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.04]">
              <IoBusinessOutline className="mt-0.5 h-6 w-6 text-blue-600 dark:text-blue-300" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Школа
                </div>
                <div className="mt-1 truncate text-base font-extrabold text-slate-950 dark:text-white">
                  {user?.school
                    ? `${user.school.name}, ${user.school.city}`
                    : "Не указана"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.04]">
              <IoMailOutline className="mt-0.5 h-6 w-6 text-blue-600 dark:text-blue-300" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Email
                </div>
                <div className="mt-1 truncate text-base font-extrabold text-slate-950 dark:text-white">
                  {user?.email ?? "Не указан"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
              <IoNotificationsOutline className="mt-0.5 h-6 w-6" />
              <p className="text-sm font-semibold leading-6">
                Настройки уведомлений здесь локальные. Отправка писем и дайджесты
                управляются серверной логикой.
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default SettingsPage;
