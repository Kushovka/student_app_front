import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoPeopleOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { getStudents } from "../api/student";
import StudentModal from "./StudentModal";
import type { StudentResponce } from "../types/student.type";
import { useAuth } from "../context/authContext";

const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightMatches = (text: string, query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const pattern = new RegExp(`(${escapeRegExp(trimmed)})`, "ig");
  const parts = text.split(pattern);

  if (parts.length === 1) return text;

  return parts.map((part, idx) => {
    if (part.match(pattern)) {
      return (
        <mark
          key={`${idx}-m`}
          className="rounded bg-emerald-100 px-1 py-0.5 font-semibold text-emerald-800"
        >
          {part}
        </mark>
      );
    }
    return <span key={`${idx}-s`}>{part}</span>;
  });
};

const GradeCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<StudentResponce[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const normalizedSearch = search.trim();
  const hasNextPage = useMemo(() => {
    if (!normalizedSearch) return false;
    if (isSearching) return false;
    if (searchError) return false;
    return page < pages;
  }, [isSearching, normalizedSearch, page, pages, searchError]);

  useEffect(() => {
    if (!normalizedSearch) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      setPage(1);
      setPages(1);
      setTotal(0);
      return;
    }

    const timer = setTimeout(() => {
      const run = async () => {
        try {
          setIsSearching(true);
          setSearchError(null);
          const data = await getStudents(
            undefined,
            undefined,
            normalizedSearch,
            page,
            limit,
          );
          setResults(data.items);
          setPages(data.pages);
          setTotal(data.total);
        } catch {
          setSearchError("Не удалось выполнить поиск.");
        } finally {
          setIsSearching(false);
        }
      };

      run();
    }, 300);

    return () => clearTimeout(timer);
  }, [limit, normalizedSearch, page]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Журнал классов
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950 sm:text-4xl">
            Выберите параллель
          </h1>
        </div>
        <div className="flex w-full max-w-xl flex-col gap-3 sm:items-end">
          <p className="text-sm leading-6 text-zinc-600">
            Открой класс, выбери букву и работай со списком учеников без лишних
            переходов.
          </p>
          <label className="relative block w-full">
            <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Поиск учеников по ФИО"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </label>
        </div>
      </div>

      {!normalizedSearch && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {grades.map((grade) => (
            <button
              key={grade}
              onClick={() => navigate(`/grade/${grade}`)}
              className="group flex min-h-28 items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md active:scale-[0.99]"
            >
              <span>
                <span className="block text-3xl font-bold text-zinc-950">
                  {grade}
                </span>
                <span className="mt-1 block text-sm font-medium text-zinc-500">
                  {grade} класс
                </span>
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition group-hover:bg-cyan-50 group-hover:text-cyan-700">
                <IoChevronForwardOutline className="h-5 w-5" />
              </span>
            </button>
          ))}
        </div>
      )}

      {normalizedSearch && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Результаты поиска
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-800">
                {isSearching
                  ? "Ищем..."
                  : `Страница ${page}/${pages}, найдено: ${total}`}
              </div>
            </div>
          </div>

          {searchError && (
            <div className="border-b border-zinc-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
              {searchError}
            </div>
          )}

          {!isSearching && !searchError && results.length === 0 && (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
              <IoPeopleOutline className="h-10 w-10 text-zinc-400" />
              <div className="mt-3 text-sm font-semibold text-zinc-800">
                Ничего не найдено
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                Попробуйте изменить запрос.
              </div>
            </div>
          )}

          {results.length > 0 && (
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
                  {results.map((student, index) => (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedId(student.id)}
                      className="cursor-pointer transition hover:bg-cyan-50/60"
                    >
                      <td className="px-5 py-4 font-medium text-zinc-400">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-zinc-950">
                          {highlightMatches(
                            `${student.last_name} ${student.first_name} ${student.middle_name}`,
                            normalizedSearch,
                          )}
                        </p>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4 text-zinc-600">
                          {highlightMatches(student.email, normalizedSearch)}
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
          )}

          {!searchError && total > 0 && pages > 1 && (
            <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium text-zinc-600">
                Показано: {results.length} из {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isSearching}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <IoChevronBackOutline className="h-5 w-5" />
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNextPage || isSearching}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Вперёд
                  <IoChevronForwardOutline className="h-5 w-5" />
                </button>
              </div>
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
  );
};

export default GradeCard;
