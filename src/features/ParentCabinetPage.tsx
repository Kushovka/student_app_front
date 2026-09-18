import { useEffect, useState } from "react";
import {
  IoArrowForwardOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
} from "react-icons/io5";
import { getStudents } from "../api/student";
import StudentModal from "../components/StudentModal";
import { useAuth } from "../context/authContext";
import type { StudentResponce } from "../types/student.type";
import { toastBus } from "../utils/toastBus";
import { DATA_CHANGED_EVENT } from "../utils/dataRefresh";

const ParentCabinetPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentResponce[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChildren = async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const data = await getStudents(undefined, undefined, undefined, 1, 100);
        setStudents(data.items);
      } catch {
        if (!silent) toastBus.error("Не удалось загрузить кабинет родителя.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    };

    fetchChildren();
    const refreshId = window.setInterval(() => {
      if (document.visibilityState === "visible" && !selectedId) fetchChildren(true);
    }, 3_000);
    const refreshOnDataChange = () => {
      if (!selectedId) fetchChildren(true);
    };
    window.addEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    return () => {
      window.clearInterval(refreshId);
      window.removeEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    };
  }, [selectedId]);

  return (
    <section className="min-h-[calc(100vh-4rem)]">
      <div className="page-shell">
        <section className="mb-7 border-b border-slate-200 pb-7 dark:rounded-2xl dark:border dark:border-white/10 dark:bg-[#071225] dark:px-5 dark:py-7 dark:text-white dark:shadow-xl dark:shadow-slate-900/10 sm:dark:px-7 lg:dark:px-8">
          <div className="hidden dark:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-blue-200">
            <IoPersonCircleOutline className="h-4 w-4" />
            Родительский кабинет
          </div>
          <h1 className="text-3xl font-extrabold tracking-normal text-slate-950 dark:mt-5 dark:text-white sm:text-4xl">
            Добро пожаловать, {user?.first_name ?? "родитель"}!
          </h1>
          <p className="mt-2 max-w-3xl text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
            Здесь доступны только ваши дети и история их замечаний.
          </p>
        </section>

        <div className="mb-4">
          <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">
            Мои дети
          </h2>
          <p className="mt-1 text-base font-medium text-slate-600 dark:text-slate-400">
            Доступ открыт только к ученикам, которых привязал администратор школы.
          </p>
        </div>

        {isLoading && (
          <div className="surface p-8 text-center text-base font-medium text-slate-500">
            Загружаем данные...
          </div>
        )}

        {!isLoading && students.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/10 dark:bg-white/[0.04]">
            <IoPeopleOutline className="h-10 w-10 text-slate-400" />
            <h3 className="mt-4 text-xl font-bold text-slate-950 dark:text-white">
              Ученики не привязаны
            </h3>
            <p className="mt-2 max-w-md text-base leading-7 text-slate-500 dark:text-slate-400">
              Попросите администратора школы привязать ваш аккаунт к карточке ученика.
            </p>
          </div>
        )}

        {!isLoading && students.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => setSelectedId(student.id)}
                className="group flex min-h-28 items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                    <IoPeopleOutline className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xl font-extrabold text-slate-950 dark:text-white">
                      {student.last_name} {student.first_name}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {student.grade}
                      {student.class_letter} класс
                    </span>
                  </span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#64748b] transition group-hover:bg-blue-600 group-hover:text-white dark:bg-white/[0.06] dark:text-[#cbd5e1]">
                  <IoArrowForwardOutline className="h-5 w-5" />
                </span>
              </button>
            ))}
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

export default ParentCabinetPage;
