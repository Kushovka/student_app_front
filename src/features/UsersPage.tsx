import { useEffect, useMemo, useState } from "react";
import {
  IoArrowBackOutline,
  IoClose,
  IoPeopleOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router";
import {
  deleteUser,
  getUserById,
  getUsers,
  updateUserBlockStatus,
  updateUserRole,
  type UserListItem,
} from "../api/users";
import { useAuth } from "../context/authContext";
import Toast from "../components/Toast";
import { formatRole } from "../utils/formatRole";

const UsersPage = () => {
  const navigate = useNavigate();
  const { user, isUserLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notify, setNotify] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserModalLoading, setIsUserModalLoading] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    variant: "danger" | "neutral";
    action: "delete" | "block" | "unblock";
    user: UserListItem;
  } | null>(null);

  const totalCount = users.length;
  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users],
  );
  const blockedCount = useMemo(
    () => users.filter((u) => u.is_blocked).length,
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

  const updateUserInList = (updated: UserListItem) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const openUserModal = async (userId: string) => {
    setIsUserModalOpen(true);
    setSelectedUserId(userId);
    setSelectedUser(null);
    setError(null);
    setNotify(null);

    try {
      setIsUserModalLoading(true);
      const data = await getUserById(userId);
      setSelectedUser(data);
    } catch {
      setError("Не удалось загрузить пользователя.");
      setIsUserModalOpen(false);
      setSelectedUserId(null);
    } finally {
      setIsUserModalLoading(false);
    }
  };

  const closeUserModal = () => {
    if (actionUserId) return;
    setIsUserModalOpen(false);
    setSelectedUserId(null);
    setSelectedUser(null);
  };

  const handleRoleChange = async (target: UserListItem, nextRole: string) => {
    if (actionUserId) return;
    if (target.id === user?.id) {
      setError("Нельзя менять роль самому себе.");
      return;
    }

    try {
      setActionUserId(target.id);
      setError(null);
      setNotify(null);
      const updated = await updateUserRole(target.id, nextRole);
      updateUserInList(updated);
      setSelectedUser((prev) => (prev?.id === updated.id ? updated : prev));
      setNotify("Роль обновлена");
    } catch {
      setError("Не удалось обновить роль пользователя.");
    } finally {
      setActionUserId(null);
    }
  };

  const handleToggleBlock = async (target: UserListItem) => {
    if (actionUserId) return;
    if (target.id === user?.id) {
      setError("Нельзя заблокировать самого себя.");
      return;
    }

    const next = !target.is_blocked;
    setConfirm({
      title: next ? "Заблокировать пользователя" : "Разблокировать пользователя",
      message: next
        ? "Пользователь не сможет войти в систему. Продолжить?"
        : "Пользователь снова сможет войти в систему. Продолжить?",
      variant: next ? "danger" : "neutral",
      action: next ? "block" : "unblock",
      user: target,
    });
  };

  const handleDelete = (target: UserListItem) => {
    if (actionUserId) return;
    if (target.id === user?.id) {
      setError("Нельзя удалить самого себя.");
      return;
    }

    setConfirm({
      title: "Удалить пользователя",
      message: "Удаление необратимо. Продолжить?",
      variant: "danger",
      action: "delete",
      user: target,
    });
  };

  const runConfirmedAction = async () => {
    if (!confirm) return;
    const target = confirm.user;

    try {
      setActionUserId(target.id);
      setError(null);
      setNotify(null);

      if (confirm.action === "delete") {
        await deleteUser(target.id);
        setUsers((prev) => prev.filter((u) => u.id !== target.id));
        if (selectedUserId === target.id) {
          closeUserModal();
        }
        setNotify("Пользователь удалён");
      } else {
        const next = confirm.action === "block";
        const updated = await updateUserBlockStatus(target.id, next);
        updateUserInList(updated);
        setSelectedUser((prev) => (prev?.id === updated.id ? updated : prev));
        setNotify(next ? "Пользователь заблокирован" : "Пользователь разблокирован");
      }
    } catch {
      if (confirm.action === "delete") {
        setError("Не удалось удалить пользователя.");
      } else {
        setError("Не удалось обновить статус блокировки.");
      }
    } finally {
      setActionUserId(null);
      setConfirm(null);
    }
  };

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
              Список пользователей доступен только для роли Администратор.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      {error && (
        <Toast type="error" message={error} onClose={() => setError(null)} />
      )}
      {notify && (
        <Toast
          type="access"
          message={notify}
          onClose={() => setNotify(null)}
        />
      )}

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
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Заблок.
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">
                {isLoading ? "—" : blockedCount}
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
                      Статус
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
                    <tr
                      key={u.id}
                      className="cursor-pointer hover:bg-zinc-50/70"
                      onClick={() => openUserModal(u.id)}
                      title="Открыть пользователя"
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-zinc-900">
                          {u.last_name} {u.first_name} {u.middle_name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-zinc-700">
                        {u.email}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {u.is_blocked ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            active
                          </span>
                        )}
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
                          {formatRole(u.role)}
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

      {isUserModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4 py-6 backdrop-blur-sm"
          onClick={closeUserModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Пользователь
                </p>
                <h2 className="mt-1 text-lg font-bold text-zinc-950">
                  {isUserModalLoading || !selectedUser
                    ? "Загрузка..."
                    : `${selectedUser.last_name} ${selectedUser.first_name} ${selectedUser.middle_name}`}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeUserModal}
                disabled={!!actionUserId}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Закрыть"
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {isUserModalLoading && (
                <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm font-medium text-zinc-500">
                  Загружаем пользователя...
                </div>
              )}

              {!isUserModalLoading && selectedUser && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          Email
                        </div>
                        <div className="mt-1 break-all text-sm font-semibold text-zinc-900">
                          {selectedUser.email}
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          Роль
                        </div>
                        <div className="mt-1 text-sm font-semibold text-zinc-900">
                          {formatRole(selectedUser.role)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          Статус
                        </div>
                        <div className="mt-1 text-sm font-semibold text-zinc-900">
                          {selectedUser.is_blocked ? "blocked" : "active"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-zinc-200 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Школа
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {selectedUser.school
                          ? `${selectedUser.school.name}, ${selectedUser.school.city}`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Действия
                    </div>

                    <label className="mt-4 block">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Роль
                      </span>
                      <select
                        value={selectedUser.role}
                        onChange={(e) =>
                          handleRoleChange(selectedUser, e.target.value)
                        }
                        disabled={
                          !!actionUserId || selectedUser.id === user?.id
                        }
                        className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="admin">Администратор</option>
                        <option value="teacher">Учитель</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleToggleBlock(selectedUser)}
                      disabled={!!actionUserId || selectedUser.id === user?.id}
                      className={[
                        "mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg border px-4 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                        selectedUser.is_blocked
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                      ].join(" ")}
                    >
                      {selectedUser.is_blocked ? "Unblock" : "Block"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(selectedUser)}
                      disabled={!!actionUserId || selectedUser.id === user?.id}
                      className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/45 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            if (!actionUserId) setConfirm(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-5 py-4">
              <div className="text-lg font-bold text-zinc-950">
                {confirm.title}
              </div>
              <div className="mt-2 text-sm font-medium leading-6 text-zinc-600">
                {confirm.message}
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={!!actionUserId}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={runConfirmedAction}
                disabled={!!actionUserId}
                className={[
                  "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70",
                  confirm.variant === "danger"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-zinc-950 text-white hover:bg-zinc-800",
                ].join(" ")}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UsersPage;
