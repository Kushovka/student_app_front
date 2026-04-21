import { useEffect, useState } from "react";
import {
  IoArrowBackOutline,
  IoPeopleOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { useNavigate, useParams } from "react-router";
import { getStudents } from "../api/student";
import type { StudentResponce } from "../types/student.type";
import StudentModal from "../components/StudentModal";

const ClassPage = () => {
  const { grade, letter } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentResponce[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!grade || !letter) return;

    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getStudents(Number(grade), letter);
        setStudents(data);
      } catch {
        setError("Не удалось загрузить учеников.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [grade, letter]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.last_name} ${student.first_name} ${student.middle_name}`.toLowerCase();
    return (
      fullName.includes(normalizedSearch) ||
      student.email.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
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
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Учеников
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">
                {students.length}
              </p>
            </div>

            <label className="relative block min-w-0 sm:w-80">
              <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по ФИО или email"
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          </div>
        </div>

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
                    <th className="px-5 py-4">Email</th>
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
                      <td className="px-5 py-4 text-zinc-600">
                        {student.email}
                      </td>
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
