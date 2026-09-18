import { useEffect, useMemo, useState } from "react";
import {
  IoArrowBackOutline,
  IoClose,
  IoDownloadOutline,
  IoCloudUploadOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { useNavigate, useParams } from "react-router";
import {
  deleteClassroom,
  exportStudents,
  getStudents,
  importStudents,
} from "../api/student";
import { exportBehaviorReport, type ReportFormat } from "../api/reports";
import type { StudentResponce } from "../types/student.type";
import StudentModal from "../components/StudentModal";
import { useAuth } from "../context/authContext";
import { toastBus } from "../utils/toastBus";
import { DATA_CHANGED_EVENT } from "../utils/dataRefresh";

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
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isStudentExporting, setIsStudentExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleteClassOpen, setIsDeleteClassOpen] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [exportFormat, setExportFormat] = useState<ReportFormat>("xlsx");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const fetchStudents = async (silent = false) => {
    if (!grade || !letter) return;

    try {
      if (!silent) {
        setIsLoading(true);
        setError("");
      }
      const data = await getStudents(Number(grade), letter, undefined, 1, 100);
      setStudents(data.items);
    } catch {
      if (!silent) setError("Не удалось загрузить учеников.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    const refreshId = window.setInterval(() => {
      if (document.visibilityState === "visible" && !selectedId) fetchStudents(true);
    }, 3_000);
    const refreshOnDataChange = () => {
      if (!selectedId) fetchStudents(true);
    };
    window.addEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    return () => {
      window.clearInterval(refreshId);
      window.removeEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, letter, selectedId]);

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

      toastBus.success("Отчёт скачан");
      setIsExportOpen(false);
    } catch {
      toastBus.error("Не удалось выгрузить отчёт.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleStudentExport = async (format: "csv" | "xlsx") => {
    if (!grade || !letter) return;

    try {
      setIsStudentExporting(true);
      const data = await exportStudents(Number(grade), letter, format);
      downloadBlob(
        data,
        `students_${grade}${String(letter).toUpperCase()}.${format}`,
      );
      toastBus.success("Список учеников скачан");
    } catch {
      toastBus.error("Не удалось выгрузить список учеников.");
    } finally {
      setIsStudentExporting(false);
    }
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;

    try {
      setIsImporting(true);
      const result = await importStudents(file, Number(grade), letter);
      await fetchStudents();
      toastBus.success(`Добавлено из файла: ${result.created}`);
      if (result.skipped > 0) {
        toastBus.error(`Пропущено строк: ${result.skipped}`);
      }
    } catch {
      toastBus.error("Не удалось загрузить список учеников из файла.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!grade || !letter || students.length > 0) return;

    try {
      setIsDeletingClass(true);
      await deleteClassroom(Number(grade), letter);
      toastBus.success(`Класс ${grade}${letter} удалён`);
      setIsDeleteClassOpen(false);
      navigate(`/grade/${grade}`);
    } catch (requestError: unknown) {
      const status =
        typeof requestError === "object" && requestError !== null && "response" in requestError
          ? (requestError as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 409) {
        toastBus.error("Сначала удалите или переведите всех учеников.");
      } else {
        toastBus.error("Не удалось удалить класс.");
      }
    } finally {
      setIsDeletingClass(false);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.last_name} ${student.first_name} ${student.middle_name}`.toLowerCase();

    if (!normalizedSearch) return true;

    return fullName.includes(normalizedSearch);
  });

  return (
    <section className="min-h-[calc(100vh-4rem)]">
      <div className="page-shell">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(`/grade/${grade}`)}
              className="button-secondary mb-4 h-10 w-10 !p-0"
              aria-label="Назад к классам"
              title="Назад"
            >
              <IoArrowBackOutline className="h-5 w-5" />
            </button>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Класс {grade}
              {letter}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white">
              {grade}
              {letter} класс
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-12 min-w-40 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100">
              <IoPeopleOutline className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <span className="text-base font-bold text-slate-500 dark:text-slate-400">
                Учеников
              </span>
              <span className="text-base font-extrabold text-slate-950 dark:text-white">
                {students.length}
              </span>
            </div>

            {isAdmin && (
              <>
                <label className="button-secondary shrink-0 cursor-pointer whitespace-nowrap">
                  <IoCloudUploadOutline className="h-5 w-5" />
                  {isImporting ? "Загружаем..." : "Загрузить"}
                  <input
                    type="file"
                    accept=".csv,.xlsx,.doc,.docx"
                    className="hidden"
                    disabled={isImporting}
                    onChange={(event) => {
                      handleImport(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                </label>
                <div className="flex h-12 shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100">
                  <button
                    type="button"
                    onClick={() => handleStudentExport("xlsx")}
                    disabled={isStudentExporting}
                    className="inline-flex items-center gap-2 px-4 text-base font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/10"
                    aria-label="Скачать список учеников"
                    title="Скачать список учеников"
                  >
                    <IoDownloadOutline className="h-5 w-5" />
                    Список
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(true)}
                    className="inline-flex items-center gap-2 border-l border-slate-300 px-4 text-base font-bold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
                    aria-label="Скачать отчёт о замечаниях"
                    title="Скачать отчёт о замечаниях"
                  >
                    <IoDownloadOutline className="h-5 w-5" />
                    Отчёт
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteClassOpen(true)}
                  disabled={students.length > 0}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-base font-bold text-red-700 transition hover:border-red-300 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-red-400/30 dark:bg-white/[0.04] dark:text-red-300 dark:hover:border-red-400/60 dark:disabled:border-white/10 dark:disabled:bg-white/[0.04] dark:disabled:text-slate-500"
                  title={students.length > 0 ? "Сначала удалите или переведите учеников" : "Удалить пустой класс"}
                >
                  <IoTrashOutline className="h-5 w-5" />
                  Удалить класс
                </button>
              </>
            )}

            <label className="relative block min-w-0 sm:w-80">
              <IoSearchOutline className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по ФИО"
                className="field w-full pl-12"
              />
            </label>
          </div>
        </div>

        {isAdmin && isExportOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
            onClick={() => {
              if (!isExporting) setIsExportOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                    Отчёт по нарушениям
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-950">
                    {grade}
                    {letter}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExportOpen(false)}
                  disabled={isExporting}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Закрыть"
                >
                  <IoClose className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                      С
                    </span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="field mt-2 w-full"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                      По
                    </span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="field mt-2 w-full"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                      Тип файла
                    </span>
                    <select
                      value={exportFormat}
                      onChange={(e) =>
                        setExportFormat(e.target.value as ReportFormat)
                      }
                      className="field mt-2 w-full"
                    >
                      <option value="xlsx">Excel (.xlsx)</option>
                      <option value="docx">Word (.docx)</option>
                      <option value="pdf">PDF</option>
                      <option value="json">Технический файл (.json)</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsExportOpen(false)}
                  disabled={isExporting}
                  className="button-secondary"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting || !dateFrom || !dateTo}
                  className="button-primary"
                >
                  {isExporting ? "Готовим..." : "Скачать"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isAdmin && isDeleteClassOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
            onClick={() => {
              if (!isDeletingClass) setIsDeleteClassOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-class-title"
              className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-5 pb-4 pt-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  <IoTrashOutline className="h-5 w-5" />
                </div>
                <h2 id="delete-class-title" className="mt-4 text-xl font-extrabold text-slate-950 dark:text-white">
                  Удалить {grade}{letter} класс?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Класс пустой. После удаления его нужно будет создать заново, чтобы загрузить учеников.
                </p>
              </div>
              <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end dark:border-white/10 dark:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setIsDeleteClassOpen(false)}
                  disabled={isDeletingClass}
                  className="button-secondary"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClass}
                  disabled={isDeletingClass}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-base font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <IoTrashOutline className="h-5 w-5" />
                  {isDeletingClass ? "Удаляем..." : "Удалить класс"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="surface p-8 text-center text-base font-medium text-slate-500">
            Загружаем учеников...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-base font-medium text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && students.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <IoPeopleOutline className="h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              В классе пока нет учеников
            </h2>
            <p className="mt-2 max-w-md text-base leading-7 text-slate-500">
              Добавьте ученика через кнопку в правом нижнем углу или загрузите
              файл Word, Excel либо CSV. Для Word подойдёт нумерованный список
              ФИО — система возьмёт учеников только для открытого класса.
            </p>
          </div>
        )}

        {!isLoading && !error && students.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-base">
                <thead className="border-b border-slate-200 bg-slate-50 text-sm font-bold uppercase tracking-[0.06em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                  <tr>
                    <th className="w-16 px-5 py-4">№</th>
                    <th className="px-5 py-4">Ученик</th>
                    <th className="px-5 py-4">Класс</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, index) => (
                    <tr
                      onClick={() => setSelectedId(student.id)}
                      key={student.id}
                      className="cursor-pointer transition hover:bg-blue-50 dark:hover:bg-blue-500/10"
                    >
                      <td className="px-5 py-5 font-medium text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-5 py-5">
                        <p className="font-bold text-slate-950 dark:text-white">
                          {student.last_name} {student.first_name}{" "}
                          {student.middle_name}
                        </p>
                      </td>
                      <td className="px-5 py-5">
                        <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
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
              <div className="border-t border-slate-100 px-5 py-8 text-center text-base font-medium text-slate-500">
                По запросу ничего не найдено
              </div>
            )}
          </div>
        )}

        {selectedId && (
          <StudentModal
            studentId={selectedId}
            onClose={() => setSelectedId(null)}
            onChanged={fetchStudents}
          />
        )}
      </div>
    </section>
  );
};

export default ClassPage;
