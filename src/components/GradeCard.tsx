import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { IoChevronForwardOutline, IoPeopleOutline } from "react-icons/io5";
import {
  getMyTeacherAssignments,
  type TeacherAssignment,
} from "../api/users";
import { useAuth } from "../context/authContext";
import { DATA_CHANGED_EVENT } from "../utils/dataRefresh";

const grades = [5, 6, 7, 8, 9];

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

    const loadAssignments = async (silent = false) => {
      try {
        if (!silent) setIsAssignmentsLoading(true);
        setAssignments(await getMyTeacherAssignments());
      } catch {
        setAssignments([]);
      } finally {
        if (!silent) setIsAssignmentsLoading(false);
      }
    };

    loadAssignments();
    const refreshId = window.setInterval(() => {
      if (document.visibilityState === "visible") loadAssignments(true);
    }, 3_000);
    const refreshOnDataChange = () => loadAssignments(true);
    window.addEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    return () => {
      window.clearInterval(refreshId);
      window.removeEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    };
  }, [user?.role]);

  const teachingGradeItems = useMemo(() => {
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

  const homeroom = user?.role === "teacher" && user.is_class_teacher
    ? { grade: user.homeroom_grade, classLetter: user.homeroom_class_letter }
    : null;

  return (
    <div className="page-shell">
      <section className="mb-8 border-b border-slate-200 pb-7 dark:border-white/10">
        <h1 className="text-3xl font-extrabold tracking-normal text-slate-950 sm:text-4xl dark:text-white">
          Добро пожаловать, {user?.first_name ?? "пользователь"}!
        </h1>
        <p className="mt-2 max-w-3xl text-base font-medium leading-7 text-slate-600 dark:text-slate-400">
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
            ? "Классное руководство и предметные назначения показаны отдельно."
            : "Переход к параллели, спискам учеников и журналу замечаний."}
        </p>
      </div>

      {user?.role === "teacher" &&
        !isAssignmentsLoading &&
        !homeroom &&
        teachingGradeItems.length === 0 && (
          <div className="surface p-8 text-center text-base font-medium text-slate-500">
            Администратор ещё не назначил вам классы и предметы.
          </div>
        )}

      {user?.role === "teacher" && homeroom && (
        <section className="mb-7">
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Классное руководство
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Ваш класс: ученики, родители и замечания.
          </p>
          <button
            onClick={() => navigate(`/grade/${homeroom.grade}/${homeroom.classLetter}`)}
            className="group mt-3 flex min-h-28 w-full max-w-md items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-left transition hover:border-blue-500 hover:bg-blue-100 active:scale-[0.99] dark:border-blue-500/30 dark:bg-blue-500/10 dark:hover:border-blue-400 dark:hover:bg-blue-500/15"
          >
            <span className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                <IoPeopleOutline className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold text-slate-950 dark:text-white">
                  {homeroom.grade}{homeroom.classLetter} класс
                </span>
                <span className="mt-1 block text-sm font-semibold text-blue-700 dark:text-blue-200">
                  Классный руководитель
                </span>
              </span>
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-white/10 dark:text-blue-200">
              <IoChevronForwardOutline className="h-5 w-5" />
            </span>
          </button>
        </section>
      )}

      {user?.role === "teacher" && teachingGradeItems.length > 0 && (
        <section>
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Преподавание по предметам
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Классы, в которых вам назначены уроки.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teachingGradeItems.map((item) => (
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
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#64748b] transition group-hover:bg-blue-600 group-hover:text-white dark:bg-white/[0.06] dark:text-[#cbd5e1]">
                  <IoChevronForwardOutline className="h-5 w-5" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {user?.role !== "teacher" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {teachingGradeItems.map((item) => (
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
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#64748b] transition group-hover:bg-blue-600 group-hover:text-white dark:bg-white/[0.06] dark:text-[#cbd5e1]">
              <IoChevronForwardOutline className="h-5 w-5" />
            </span>
          </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradeCard;
