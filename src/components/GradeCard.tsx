import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  IoBookOutline,
  IoChevronForwardOutline,
  IoPeopleOutline,
} from "react-icons/io5";
import {
  getMyTeacherAssignments,
  type TeacherAssignment,
} from "../api/users";
import { useAuth } from "../context/authContext";

const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const GradeCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== "teacher") {
      setAssignments([]);
      return;
    }

    const loadAssignments = async () => {
      try {
        setIsAssignmentsLoading(true);
        setAssignments(await getMyTeacherAssignments());
      } catch {
        setAssignments([]);
      } finally {
        setIsAssignmentsLoading(false);
      }
    };

    loadAssignments();
  }, [user?.role]);

  const gradeItems = useMemo(() => {
    if (user?.role !== "teacher") {
      return grades.map((grade) => ({
        grade,
        subtitle: `Все классы ${grade} параллели`,
      }));
    }

    const groups = new Map<number, Set<string>>();
    assignments.forEach((assignment) => {
      const set = groups.get(assignment.grade) ?? new Set<string>();
      set.add(assignment.class_letter);
      groups.set(assignment.grade, set);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([grade, letters]) => ({
        grade,
        subtitle: `Назначено классов: ${letters.size}`,
      }));
  }, [assignments, user?.role]);

  return (
    <div className="page-shell">
      <section className="mb-7 rounded-2xl border border-slate-200 bg-[#071225] px-5 py-7 text-white shadow-xl shadow-slate-900/10 dark:border-white/10 sm:px-7 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-blue-200">
          <IoBookOutline className="h-4 w-4" />
          Рабочий кабинет
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-normal sm:text-4xl">
          Добро пожаловать, {user?.first_name ?? "пользователь"}!
        </h1>
        <p className="mt-2 max-w-3xl text-base font-medium leading-7 text-slate-300">
          {user?.school
            ? `${user.school.name}, ${user.school.city}.`
            : "Выберите класс."}
        </p>
      </section>

      <div className="mb-4">
        <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">
          {user?.role === "teacher" ? "Ваши классы" : "Выберите класс"}
        </h2>
        <p className="mt-1 text-base font-medium text-slate-600 dark:text-slate-400">
          {user?.role === "teacher"
            ? "Показаны только классы, где вам назначены уроки."
            : "Переход к параллели, спискам учеников и журналу замечаний."}
        </p>
      </div>

      {user?.role === "teacher" &&
        !isAssignmentsLoading &&
        gradeItems.length === 0 && (
          <div className="surface p-8 text-center text-base font-medium text-slate-500">
            Администратор ещё не назначил вам классы и предметы.
          </div>
        )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {gradeItems.map((item) => (
          <button
            key={item.grade}
            onClick={() => navigate(`/grade/${item.grade}`)}
            className="group flex min-h-28 items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-blue-500/80 dark:hover:bg-blue-500/10"
          >
            <span className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                <IoPeopleOutline className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold text-slate-950 dark:text-white">
                  {item.grade} класс
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {item.subtitle}
                </span>
              </span>
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-white/[0.06] dark:text-slate-300">
              <IoChevronForwardOutline className="h-5 w-5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GradeCard;
