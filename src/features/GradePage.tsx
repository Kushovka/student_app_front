import { useEffect, useMemo, useState } from "react";
import {
  IoAddOutline,
  IoArrowBackOutline,
  IoChevronForwardOutline,
  IoCloseOutline,
  IoCloudUploadOutline,
  IoLayersOutline,
} from "react-icons/io5";
import { useNavigate, useParams } from "react-router";
import {
  createClassroom,
  getClassOptions,
  importWordClassLists,
} from "../api/student";
import { useAuth } from "../context/authContext";
import { classLetterOptions, sortClassLetters } from "../utils/classOptions";
import { DATA_CHANGED_EVENT, notifyDataChanged } from "../utils/dataRefresh";
import { toastBus } from "../utils/toastBus";

const GradePage = () => {
  const { grade } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [letters, setLetters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLetterPickerOpen, setIsLetterPickerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const isAdmin = user?.role === "admin";
  const availableLetters = useMemo(
    () => classLetterOptions.filter((letter) => !letters.includes(letter)),
    [letters],
  );

  useEffect(() => {
    if (!grade) return;

    const fetchClasses = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
          setError("");
        }
        const data = await getClassOptions();
        setLetters(
          sortClassLetters(
            data.classes
              .filter((item) => item.grade === Number(grade))
              .map((item) => item.class_letter),
          ),
        );
      } catch {
        if (!silent) setError("Не удалось загрузить список классов.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    };

    fetchClasses();
    const refreshId = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchClasses(true);
    }, 3_000);
    const refreshOnDataChange = () => fetchClasses(true);
    window.addEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    return () => {
      window.clearInterval(refreshId);
      window.removeEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    };
  }, [grade]);

  const handleCreateClass = async (letter: string) => {
    if (!grade || isCreating) return;

    try {
      setIsCreating(true);
      await createClassroom({ grade: Number(grade), class_letter: letter });
      setLetters((current) => sortClassLetters([...current, letter]));
      setIsLetterPickerOpen(false);
      notifyDataChanged();
      toastBus.success(`Класс ${grade}${letter} создан`);
    } catch (requestError: unknown) {
      const status =
        typeof requestError === "object" && requestError !== null && "response" in requestError
          ? (requestError as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 409) {
        toastBus.error(`Класс ${grade}${letter} уже существует.`);
      } else {
        toastBus.error("Не удалось создать класс.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClassListsImport = async (file: File | null) => {
    if (!file || !grade || isImporting) return;

    try {
      setIsImporting(true);
      const result = await importWordClassLists(file, Number(grade));
      notifyDataChanged();
      const classes = result.created_classes.length
        ? ` Создано классов: ${result.created_classes.join(", ")}.`
        : "";
      toastBus.success(
        `Добавлено учеников: ${result.created_students}.${classes}`,
      );
      if (result.skipped_students > 0) {
        toastBus.error(`Пропущено повторов: ${result.skipped_students}`);
      }
    } catch (requestError: unknown) {
      const detail =
        typeof requestError === "object" && requestError !== null && "response" in requestError
          ? (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toastBus.error(detail || "Не удалось импортировать списки классов.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)]">
      <div className="page-shell">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/")}
              className="button-secondary mb-4"
            >
              <IoArrowBackOutline className="h-5 w-5" />
              Все классы
            </button>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Все классы
            </p>
            <h1 className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white">
              {grade} класс
            </h1>
            <p className="mt-2 text-base font-medium text-slate-600 dark:text-slate-400">
              Выберите нужный класс
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                Найдено классов
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
                {letters.length} {letters.length === 1 ? "буква" : "букв"}
              </p>
            </div>
            {isAdmin && (
              <label className="button-primary h-12 cursor-pointer whitespace-nowrap px-4 text-base">
                <IoCloudUploadOutline className="h-5 w-5" />
                {isImporting ? "Импортируем..." : "Импортировать списки"}
                <input
                  type="file"
                  accept=".doc,.docx"
                  className="hidden"
                  disabled={isImporting}
                  onChange={(event) => {
                    handleClassListsImport(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="surface p-8 text-center text-base font-medium text-slate-500">
            Загружаем классы...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-base font-medium text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && letters.length === 0 && !isAdmin && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <IoLayersOutline className="h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              Классы пока не созданы
            </h2>
            <p className="mt-2 max-w-md text-base leading-7 text-slate-500">
              Обратитесь к администратору школы, чтобы он добавил букву класса.
            </p>
          </div>
        )}

        {!isLoading && !error && (letters.length > 0 || isAdmin) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {letters.map((letter) => (
              <button
                key={letter}
                onClick={() => navigate(`/grade/${grade}/${letter}`)}
                className="group flex min-h-32 items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-5 text-left shadow-sm transition hover:border-blue-500 hover:bg-blue-50/40 active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-blue-500/80 dark:hover:bg-blue-500/10"
              >
                <span>
                  <span className="block text-3xl font-extrabold text-slate-950 dark:text-white">
                    {grade}
                    {letter}
                  </span>
                  <span className="mt-2 block text-base font-semibold text-slate-600 dark:text-slate-400">
                    Открыть список учеников
                  </span>
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:text-blue-700 dark:bg-white/[0.06] dark:text-slate-300 dark:group-hover:text-blue-300">
                  <IoChevronForwardOutline className="h-6 w-6" />
                </span>
              </button>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsLetterPickerOpen(true)}
                className="group flex min-h-32 items-center justify-between rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-5 py-5 text-left shadow-sm transition hover:border-blue-500 hover:bg-blue-50 active:scale-[0.99] dark:border-blue-400/40 dark:bg-blue-500/[0.06] dark:hover:border-blue-400 dark:hover:bg-blue-500/10"
              >
                <span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-900/25">
                    <IoAddOutline className="h-6 w-6" />
                  </span>
                  <span className="mt-3 block text-lg font-extrabold text-slate-950 dark:text-white">
                    Создать класс
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Выбрать букву
                  </span>
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/15 dark:text-blue-300">
                  <IoAddOutline className="h-6 w-6" />
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {isLetterPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-class-title"
          onMouseDown={() => !isCreating && setIsLetterPickerOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Новый класс</p>
                <h2 id="create-class-title" className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">
                  Выберите букву для {grade} класса
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Класс создастся пустым. Список учеников можно будет загрузить после создания.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLetterPickerOpen(false)}
                disabled={isCreating}
                aria-label="Закрыть выбор буквы"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <IoCloseOutline className="h-6 w-6" />
              </button>
            </div>

            {availableLetters.length > 0 ? (
              <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-7">
                {availableLetters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    disabled={isCreating}
                    onClick={() => handleCreateClass(letter)}
                    className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg font-extrabold text-slate-950 transition hover:border-blue-500 hover:text-blue-700 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:border-blue-400 dark:hover:text-blue-300"
                    aria-label={`Создать ${grade}${letter} класс`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-xl bg-slate-100 p-4 text-sm font-medium text-slate-600 dark:bg-white/[0.05] dark:text-slate-300">
                Все доступные буквы для {grade} класса уже созданы.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default GradePage;
