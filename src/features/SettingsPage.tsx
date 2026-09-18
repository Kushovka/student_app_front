import {
  IoArrowBackOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router";
import ThemeToggle from "../components/ThemeToggle";

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex h-11 items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300"
          >
            <IoArrowBackOutline className="h-5 w-5" />
            Назад
          </button>
          <p className="page-kicker">Настройки</p>
          <h1 className="page-title mt-2 dark:text-white">
            Параметры приложения
          </h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600 dark:text-slate-400">
            Настройте тему оформления для текущего браузера.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
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

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.03]">
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                Другие настройки — в разработке
              </h3>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                Здесь появятся дополнительные параметры, когда они будут готовы к использованию.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsPage;
