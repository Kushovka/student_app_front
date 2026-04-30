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
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/")}
              className="mb-4 inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <IoArrowBackOutline className="h-5 w-5" />
              Все классы
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Параллель
            </p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-950 sm:text-4xl">
              {grade} класс
            </h1>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Найдено
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-950">
              {letters.length} {letters.length === 1 ? "буква" : "букв"}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm font-medium text-zinc-500 shadow-sm">
            Загружаем классы...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && letters.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/70 p-8 text-center">
            <IoLayersOutline className="h-10 w-10 text-zinc-400" />
            <h2 className="mt-4 text-lg font-bold text-zinc-950">
              В этом классе пока нет учеников
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
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
                className="group flex min-h-24 items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md active:scale-[0.99]"
              >
                <span>
                  <span className="block text-3xl font-bold text-zinc-950">
                    {grade}
                    {letter}
                  </span>
                  <span className="mt-1 block text-sm font-medium text-zinc-500">
                    Открыть список учеников
                  </span>
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition group-hover:bg-cyan-50 group-hover:text-cyan-700">
                  <IoChevronForwardOutline className="h-5 w-5" />
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
