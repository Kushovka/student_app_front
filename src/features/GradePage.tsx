import { useEffect, useState } from "react";
import {
  IoArrowBackOutline,
  IoChevronForwardOutline,
  IoLayersOutline,
} from "react-icons/io5";
import { useNavigate, useParams } from "react-router";
import { getStudents } from "../api/student";

const GradePage = () => {
  const { grade } = useParams();
  const navigate = useNavigate();
  const [letters, setLetters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!grade) return;

    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getStudents(Number(grade));

        const uniqueLetters = [
          ...new Set(
            data.items.map((s) => s.class_letter.trim().toUpperCase()),
          ),
        ].sort();

        setLetters(uniqueLetters);
      } catch {
        setError("Не удалось загрузить список классов.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [grade]);

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

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Найдено классов
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-950">
              {letters.length} {letters.length === 1 ? "буква" : "букв"}
            </p>
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

        {!isLoading && !error && letters.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <IoLayersOutline className="h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              В этом классе пока нет учеников
            </h2>
            <p className="mt-2 max-w-md text-base leading-7 text-slate-500">
              Добавь первого ученика через кнопку в правом нижнем углу, и буква
              класса появится здесь.
            </p>
          </div>
        )}

        {!isLoading && !error && letters.length > 0 && (
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
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-white/[0.06] dark:text-slate-300">
                  <IoChevronForwardOutline className="h-6 w-6" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default GradePage;
