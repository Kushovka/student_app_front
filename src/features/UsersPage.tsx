import { useEffect, useMemo, useState } from "react";
import { IoArrowBackOutline, IoPeopleOutline } from "react-icons/io5";
import { useNavigate } from "react-router";
import { getUsers, type UserListItem } from "../api/users";
import { useAuth } from "../context/authContext";
import Toast from "../components/Toast";

const UsersPage = () => {
  const navigate = useNavigate();
  const { user, isUserLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalCount = users.length;
  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users],
  );

  useEffect(() => {
    if (isUserLoading) return;

    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getUsers();
        setUsers(data);
      } catch {
        setError("Не удалось загрузить пользователей.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, isUserLoading]);

  if (!isUserLoading && !isAdmin) {
    return (
      <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => navigate("/")}
            className="mb-6 inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <IoArrowBackOutline className="h-5 w-5" />
            Назад
          </button>

          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/70 p-8 text-center">
            <IoPeopleOutline className="h-10 w-10 text-zinc-400" />
            <h1 className="mt-4 text-lg font-bold text-zinc-950">
              Доступ запрещён
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Список пользователей доступен только для роли admin.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      {error && <Toast type="error" message={error} onClose={() => setError(null)} />}

      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/")}
              className="mb-4 inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <IoArrowBackOutline className="h-5 w-5" />
              Главная
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Админ-панель
            </p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-950 sm:text-4xl">
              Пользователи
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Всего
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">
                {isLoading ? "—" : totalCount}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Админы
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">
                {isLoading ? "—" : adminCount}
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm font-medium text-zinc-500 shadow-sm">
            Загружаем пользователей...
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/70 p-8 text-center">
            <IoPeopleOutline className="h-10 w-10 text-zinc-400" />
            <h2 className="mt-4 text-lg font-bold text-zinc-950">
              Пользователей пока нет
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Как только появятся зарегистрированные пользователи, они будут
              отображаться здесь.
            </p>
          </div>
        )}

        {!isLoading && users.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      ФИО
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Email
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Роль
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Школа
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/70">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-zinc-900">
                          {u.last_name} {u.first_name} {u.middle_name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-zinc-700">
                        {u.email}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                            u.role === "admin"
                              ? "bg-cyan-50 text-cyan-700"
                              : "bg-zinc-100 text-zinc-700",
                          ].join(" ")}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {u.school ? (
                          <div>
                            <div className="text-sm font-semibold text-zinc-900">
                              {u.school.name}
                            </div>
                            <div className="text-xs font-medium text-zinc-500">
                              {u.school.city}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-zinc-500">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UsersPage;

