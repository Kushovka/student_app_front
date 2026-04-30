import { useEffect, useMemo, useState } from "react";
import {
  IoArrowBackOutline,
  IoClose,
  IoDownloadOutline,
  IoPeopleOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { useNavigate, useParams } from "react-router";
import { getStudents } from "../api/student";
import { exportBehaviorReport, type ReportFormat } from "../api/reports";
import type { StudentResponce } from "../types/student.type";
import StudentModal from "../components/StudentModal";
import { useAuth } from "../context/authContext";
import Toast from "../components/Toast";

const ClassPage = () => {
  const { grade, letter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [students, setStudents] = useState<StudentResponce[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportNotify, setExportNotify] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ReportFormat>("xlsx");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    if (!grade || !letter) return;

    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getStudents(Number(grade), letter, undefined, 1, 30);
        setStudents(data.items);
      } catch {
        setError("Не удалось загрузить учеников.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [grade, letter]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!grade || !letter) return;

    try {
      setIsExporting(true);
      setExportError(null);
      setExportNotify(null);

      const payload = {
        grade: Number(grade),
        class_letter: letter,
        date_from: dateFrom,
        date_to: dateTo,
      };

      const data = await exportBehaviorReport(payload, exportFormat);

      const safeLetter = String(letter).toUpperCase();
      const base = `behavior_report_${grade}${safeLetter}_${dateFrom}_${dateTo}`;

      if (exportFormat === "xlsx" || exportFormat === "docx" || exportFormat === "pdf") {
        downloadBlob(data as Blob, `${base}.${exportFormat}`);
      } else {
        const json = JSON.stringify(data, null, 2);
        downloadBlob(
          new Blob([json], { type: "application/json;charset=utf-8" }),
          `${base}.json`,
        );
      }

      setExportNotify("Отчёт скачан");
      setIsExportOpen(false);
    } catch {
      setExportError("Не удалось выгрузить отчёт.");
    } finally {
      setIsExporting(false);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.last_name} ${student.first_name} ${student.middle_name}`.toLowerCase();

    if (!normalizedSearch) return true;

    if (isAdmin) {
      return (
        fullName.includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch)
      );
    }

    return fullName.includes(normalizedSearch);
  });

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      {exportError && (
        <Toast
          type="error"
          message={exportError}
          onClose={() => setExportError(null)}
        />
      )}
      {exportNotify && (
        <Toast
          type="access"
          message={exportNotify}
          onClose={() => setExportNotify(null)}
        />
      )}
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              onClick={() => navigate(`/grade/${grade}`)}
              className="mb-4 inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <IoArrowBackOutline className="h-5 w-5" />
              К буквам класса
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Список учеников
            </p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-950 sm:text-4xl">
              {grade}
              {letter}
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-2 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Учеников
              </p>
              <p className="text-2xl font-bold text-zinc-950">
                {students.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99]"
            >
              <IoDownloadOutline className="h-5 w-5" />
              Выгрузка
            </button>

            <label className="relative block min-w-0 sm:w-80">
              <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={isAdmin ? "Поиск по ФИО или email" : "Поиск по ФИО"}
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          </div>
        </div>

        {isExportOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4 py-6 backdrop-blur-sm"
            onClick={() => {
              if (!isExporting) setIsExportOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Отчёт по нарушениям
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-zinc-950">
                    {grade}
                    {letter}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExportOpen(false)}
                  disabled={isExporting}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Закрыть"
                >
                  <IoClose className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      С
                    </span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm outline-none transition focus:border-cyan-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      По
                    </span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm outline-none transition focus:border-cyan-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Формат
                    </span>
                    <select
                      value={exportFormat}
                      onChange={(e) =>
                        setExportFormat(e.target.value as ReportFormat)
                      }
                      className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm outline-none transition focus:border-cyan-400"
                    >
                      <option value="xlsx">xlsx</option>
                      <option value="docx">docx</option>
                      <option value="pdf">pdf</option>
                      <option value="json">json</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsExportOpen(false)}
                  disabled={isExporting}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting || !dateFrom || !dateTo}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isExporting ? "Готовим..." : "Скачать"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm font-medium text-zinc-500 shadow-sm">
            Загружаем учеников...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && students.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/70 p-8 text-center">
            <IoPeopleOutline className="h-10 w-10 text-zinc-400" />
            <h2 className="mt-4 text-lg font-bold text-zinc-950">
              В классе пока нет учеников
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Добавь ученика через кнопку в правом нижнем углу. После этого он
              появится в таблице.
            </p>
          </div>
        )}

        {!isLoading && !error && students.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold uppercase tracking-[0.08em] text-zinc-500">
                  <tr>
                    <th className="w-16 px-5 py-4">№</th>
                    <th className="px-5 py-4">Ученик</th>
                    {isAdmin && <th className="px-5 py-4">Email</th>}
                    <th className="px-5 py-4">Класс</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStudents.map((student, index) => (
                    <tr
                      onClick={() => setSelectedId(student.id)}
                      key={student.id}
                      className="cursor-pointer transition hover:bg-cyan-50/60"
                    >
                      <td className="px-5 py-4 font-medium text-zinc-400">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-zinc-950">
                          {student.last_name} {student.first_name}{" "}
                          {student.middle_name}
                        </p>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4 text-zinc-600">
                          {student.email}
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700">
                          {student.grade}
                          {student.class_letter}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="border-t border-zinc-100 px-5 py-8 text-center text-sm font-medium text-zinc-500">
                По запросу ничего не найдено
              </div>
            )}
          </div>
        )}

        {selectedId && (
          <StudentModal
            studentId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </section>
  );
};

export default ClassPage;
