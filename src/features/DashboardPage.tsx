import { useEffect, useMemo, useState } from "react";
import {
  IoArrowBackOutline,
  IoBarChartOutline,
  IoChevronForwardOutline,
  IoPieChartOutline,
  IoSchoolOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router";
import {
  getDashboard,
  getPlatformDashboard,
  getPlatformSchoolDashboard,
  type DashboardResponse,
  type PlatformDashboardResponse,
  type PlatformSchoolDashboardResponse,
} from "../api/reports";
import { useAuth } from "../context/authContext";
import { toastBus } from "../utils/toastBus";
import { DATA_CHANGED_EVENT } from "../utils/dataRefresh";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [platformDashboard, setPlatformDashboard] =
    useState<PlatformDashboardResponse | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [schoolDashboard, setSchoolDashboard] =
    useState<PlatformSchoolDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSchoolLoading, setIsSchoolLoading] = useState(false);

  const maxClassTotal = useMemo(
    () => Math.max(...(dashboard?.top_classes.map((item) => item.total) ?? [1])),
    [dashboard],
  );
  const maxReasonTotal = useMemo(
    () => Math.max(...(dashboard?.top_reasons.map((item) => item.total) ?? [1])),
    [dashboard],
  );
  const maxSchoolClassTotal = useMemo(
    () =>
      Math.max(...(schoolDashboard?.top_classes.map((item) => item.total) ?? [1])),
    [schoolDashboard],
  );
  const maxSchoolReasonTotal = useMemo(
    () =>
      Math.max(...(schoolDashboard?.top_reasons.map((item) => item.total) ?? [1])),
    [schoolDashboard],
  );

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      if (isSuperadmin) {
        const data = await getPlatformDashboard();
        setPlatformDashboard(data);
        setDashboard(null);
        setSelectedSchoolId((prev) => prev || data.schools[0]?.school_id || "");
      } else {
        setDashboard(await getDashboard());
        setPlatformDashboard(null);
      }
    } catch {
      if (!silent) toastBus.error("Не удалось загрузить дашборд.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const refreshId = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchDashboard(true);
    }, 3_000);
    const refreshOnDataChange = () => fetchDashboard(true);
    window.addEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    return () => {
      window.clearInterval(refreshId);
      window.removeEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    };
  }, [isSuperadmin]);

  useEffect(() => {
    if (!isSuperadmin || !selectedSchoolId) {
      setSchoolDashboard(null);
      return;
    }

    const loadSchoolDashboard = async () => {
      try {
        setIsSchoolLoading(true);
        setSchoolDashboard(await getPlatformSchoolDashboard(selectedSchoolId));
      } catch {
        toastBus.error("Не удалось загрузить статистику школы.");
      } finally {
        setIsSchoolLoading(false);
      }
    };

    loadSchoolDashboard();
  }, [isSuperadmin, selectedSchoolId]);

  return (
    <section className="min-h-[calc(100vh-4rem)]">
      <div className="page-shell">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button onClick={() => navigate("/")} className="button-secondary mb-4">
              <IoArrowBackOutline className="h-5 w-5" />
              Главная
            </button>
            <p className="page-kicker">
              {isSuperadmin ? "Платформа" : "Администрирование"}
            </p>
            <h1 className="page-title mt-2">
              {isSuperadmin ? "Статистика школ" : "Сводка школы"}
            </h1>
          </div>

        </div>

        {isLoading && (
          <div className="surface p-8 text-center text-base font-medium text-slate-500">
            Загружаем сводку...
          </div>
        )}

        {!isLoading && dashboard && (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="surface p-5">
                <div className="flex items-center gap-3">
                  <IoBarChartOutline className="h-6 w-6 text-blue-700" />
                  <div className="text-base font-bold text-slate-500">Замечаний за 7 дней</div>
                </div>
                <div className="mt-4 text-3xl font-extrabold text-slate-950 dark:text-white">
                  {dashboard.total_7_days}
                </div>
              </div>
              <div className="surface p-5">
                <div className="flex items-center gap-3">
                  <IoBarChartOutline className="h-6 w-6 text-blue-700" />
                  <div className="text-base font-bold text-slate-500">Замечаний за 30 дней</div>
                </div>
                <div className="mt-4 text-3xl font-extrabold text-slate-950 dark:text-white">
                  {dashboard.total_30_days}
                </div>
              </div>
              <div className="surface p-5">
                <div className="flex items-center gap-3">
                  <IoPieChartOutline className="h-6 w-6 text-blue-700" />
                  <div className="text-base font-bold text-slate-500">
                    Причин в топе
                  </div>
                </div>
                <div className="mt-4 text-3xl font-extrabold text-slate-950 dark:text-white">
                  {dashboard.top_reasons.length}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="surface p-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                  Топ классов
                </h2>
                <div className="mt-4 grid gap-3">
                  {dashboard.top_classes.length === 0 && (
                    <div className="text-base font-medium text-slate-500">
                      Данных пока нет.
                    </div>
                  )}
                  {dashboard.top_classes.map((item) => (
                    <div key={item.class_name}>
                      <div className="mb-1 flex justify-between text-sm font-semibold">
                        <span>{item.class_name}</span>
                        <span>{item.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100">
                        <div
                          className="h-2 rounded-full bg-blue-700"
                          style={{
                            width: `${Math.max(8, (item.total / maxClassTotal) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface p-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                  Топ причин
                </h2>
                <div className="mt-4 grid gap-3">
                  {dashboard.top_reasons.length === 0 && (
                    <div className="text-base font-medium text-slate-500">
                      Данных пока нет.
                    </div>
                  )}
                  {dashboard.top_reasons.map((item) => (
                    <div key={item.reason}>
                      <div className="mb-1 flex justify-between gap-4 text-sm font-semibold">
                        <span>{item.reason}</span>
                        <span>{item.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100">
                        <div
                          className="h-2 rounded-full bg-slate-900"
                          style={{
                            width: `${Math.max(8, (item.total / maxReasonTotal) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && platformDashboard && (
          <div className="grid gap-5">
            <section className="border-b border-slate-200 pb-7 dark:rounded-2xl dark:border dark:border-white/10 dark:bg-[#071225] dark:p-6 dark:text-white dark:shadow-xl dark:shadow-slate-900/10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white sm:text-3xl">
                    Вся платформа
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">Школ</div>
                    <div className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
                      {platformDashboard.total_schools}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">Учеников</div>
                    <div className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
                      {platformDashboard.total_students}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">Замечаний за 30 дней</div>
                    <div className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
                      {platformDashboard.total_30_days}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">Всего замечаний</div>
                    <div className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
                      {platformDashboard.total_records}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <IoSchoolOutline className="h-6 w-6 text-blue-700" />
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
                    Выберите школу
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Нажмите на школу, чтобы открыть подробную статистику.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {platformDashboard.schools.map((school) => {
                  const isActive = school.school_id === selectedSchoolId;
                  return (
                    <button
                      key={school.school_id}
                      type="button"
                      onClick={() => setSelectedSchoolId(school.school_id)}
                      className={[
                        "flex min-h-32 items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left transition",
                        isActive
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                          : "border-slate-200 bg-white text-slate-900 hover:border-blue-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
                      ].join(" ")}
                    >
                      <span>
                        <span className="block text-xl font-extrabold">
                          {school.school_name}
                        </span>
                        <span
                          className={[
                            "mt-1 block text-sm font-semibold",
                            isActive ? "text-blue-100" : "text-slate-500",
                          ].join(" ")}
                        >
                          {school.city || "Город не указан"}
                        </span>
                        <span
                          className={[
                            "mt-4 block text-sm font-bold",
                            isActive ? "text-blue-100" : "text-slate-500",
                          ].join(" ")}
                        >
                          Учеников: {school.students}
                        </span>
                        <span
                          className={[
                            "mt-1 block text-sm font-bold",
                            isActive ? "text-blue-100" : "text-slate-500",
                          ].join(" ")}
                        >
                          Замечаний за 30 дней: {school.records_30_days}
                        </span>
                      </span>
                      <IoChevronForwardOutline className="h-7 w-7 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="surface overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <IoBarChartOutline className="h-6 w-6 text-blue-700" />
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
                      {schoolDashboard
                        ? schoolDashboard.school.name
                        : "Статистика школы"}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {schoolDashboard?.school.city || "Полная статистика выбранной школы"}
                    </p>
                  </div>
                </div>
              </div>

              {isSchoolLoading && (
                <div className="p-8 text-center text-base font-medium text-slate-500">
                  Загружаем статистику школы...
                </div>
              )}

              {!isSchoolLoading && schoolDashboard && (
                <div className="grid gap-5 p-5">
                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="text-sm font-bold text-slate-500">Ученики</div>
                      <div className="mt-2 text-3xl font-extrabold">
                        {schoolDashboard.students}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="text-sm font-bold text-slate-500">Администраторы</div>
                      <div className="mt-2 text-3xl font-extrabold">
                        {schoolDashboard.admins}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="text-sm font-bold text-slate-500">Учителя</div>
                      <div className="mt-2 text-3xl font-extrabold">
                        {schoolDashboard.teachers}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="text-sm font-bold text-slate-500">Родители</div>
                      <div className="mt-2 text-3xl font-extrabold">
                        {schoolDashboard.parents}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="text-sm font-bold text-slate-500">Замечаний за 7 дней</div>
                      <div className="mt-2 text-3xl font-extrabold">
                        {schoolDashboard.total_7_days}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="text-sm font-bold text-slate-500">Всего замечаний</div>
                      <div className="mt-2 text-3xl font-extrabold">
                        {schoolDashboard.records_total}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-5 dark:border-white/10">
                      <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                        Топ классов
                      </h3>
                      <div className="mt-4 grid gap-3">
                        {schoolDashboard.top_classes.length === 0 && (
                          <div className="text-base font-medium text-slate-500">
                            Данных пока нет.
                          </div>
                        )}
                        {schoolDashboard.top_classes.map((item) => (
                          <div key={item.class_name}>
                            <div className="mb-1 flex justify-between text-sm font-semibold">
                              <span>{item.class_name}</span>
                              <span>{item.total}</span>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-100">
                              <div
                                className="h-2 rounded-full bg-blue-700"
                                style={{
                                  width: `${Math.max(
                                    8,
                                    (item.total / maxSchoolClassTotal) * 100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5 dark:border-white/10">
                      <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                        Топ причин
                      </h3>
                      <div className="mt-4 grid gap-3">
                        {schoolDashboard.top_reasons.length === 0 && (
                          <div className="text-base font-medium text-slate-500">
                            Данных пока нет.
                          </div>
                        )}
                        {schoolDashboard.top_reasons.map((item) => (
                          <div key={item.reason}>
                            <div className="mb-1 flex justify-between gap-4 text-sm font-semibold">
                              <span>{item.reason}</span>
                              <span>{item.total}</span>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-100">
                              <div
                                className="h-2 rounded-full bg-slate-900 dark:bg-slate-200"
                                style={{
                                  width: `${Math.max(
                                    8,
                                    (item.total / maxSchoolReasonTotal) * 100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardPage;
