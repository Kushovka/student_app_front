import { useEffect, useMemo, useState } from "react";
import {
  IoArrowBackOutline,
  IoBarChartOutline,
  IoMailOutline,
  IoPieChartOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router";
import { getDashboard, type DashboardResponse } from "../api/reports";
import { sendPendingDigests } from "../api/student";
import { toastBus } from "../utils/toastBus";

const severityLabels: Record<"green" | "yellow" | "red", string> = {
  green: "Зелёный",
  yellow: "Жёлтый",
  red: "Красный",
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDigestSending, setIsDigestSending] = useState(false);

  const maxClassTotal = useMemo(
    () => Math.max(...(dashboard?.top_classes.map((item) => item.total) ?? [1])),
    [dashboard],
  );
  const maxReasonTotal = useMemo(
    () => Math.max(...(dashboard?.top_reasons.map((item) => item.total) ?? [1])),
    [dashboard],
  );

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setDashboard(await getDashboard());
    } catch {
      toastBus.error("Не удалось загрузить дашборд.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDigest = async () => {
    try {
      setIsDigestSending(true);
      const result = await sendPendingDigests();
      toastBus.success(`Дайджест: ${result.sent_records} записей`);
    } catch {
      toastBus.error("Не удалось отправить дайджест.");
    } finally {
      setIsDigestSending(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/")}
              className="mb-4 inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <IoArrowBackOutline className="h-5 w-5" />
              Главная
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Администрирование
            </p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-950 sm:text-4xl">
              Dashboard MVP
            </h1>
          </div>

          <button
            type="button"
            onClick={handleDigest}
            disabled={isDigestSending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IoMailOutline className="h-5 w-5" />
            {isDigestSending ? "Отправляем..." : "Отправить дайджест"}
          </button>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm font-medium text-zinc-500 shadow-sm">
            Загружаем dashboard...
          </div>
        )}

        {!isLoading && dashboard && (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <IoBarChartOutline className="h-6 w-6 text-cyan-700" />
                  <div className="text-sm font-semibold text-zinc-500">
                    За 7 дней
                  </div>
                </div>
                <div className="mt-4 text-3xl font-bold text-zinc-950">
                  {dashboard.total_7_days}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <IoBarChartOutline className="h-6 w-6 text-cyan-700" />
                  <div className="text-sm font-semibold text-zinc-500">
                    За 30 дней
                  </div>
                </div>
                <div className="mt-4 text-3xl font-bold text-zinc-950">
                  {dashboard.total_30_days}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <IoPieChartOutline className="h-6 w-6 text-cyan-700" />
                  <div className="text-sm font-semibold text-zinc-500">
                    Всего по уровням
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {(["green", "yellow", "red"] as const).map((severity) => (
                    <div
                      key={severity}
                      className="flex items-center justify-between text-sm font-semibold"
                    >
                      <span>{severityLabels[severity]}</span>
                      <span>{dashboard.severity[severity] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Топ классов
                </h2>
                <div className="mt-4 grid gap-3">
                  {dashboard.top_classes.length === 0 && (
                    <div className="text-sm font-medium text-zinc-500">
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
                          className="h-2 rounded-full bg-cyan-600"
                          style={{
                            width: `${Math.max(8, (item.total / maxClassTotal) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Топ причин
                </h2>
                <div className="mt-4 grid gap-3">
                  {dashboard.top_reasons.length === 0 && (
                    <div className="text-sm font-medium text-zinc-500">
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
                          className="h-2 rounded-full bg-zinc-950"
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
      </div>
    </section>
  );
};

export default DashboardPage;
