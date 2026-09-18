import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  IoAddOutline,
  IoBusinessOutline,
  IoCheckmarkCircleOutline,
  IoClose,
  IoCopyOutline,
  IoPencilOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoTrashOutline,
} from "react-icons/io5";
import {
  createSchool,
  deleteSchool,
  getSchools,
  updateSchool,
  type School,
} from "../api/schools";
import {
  createSchoolAdmin,
  deleteUser,
  getUsers,
  type UserListItem,
} from "../api/users";
import { formatRole } from "../utils/formatRole";
import { toastBus } from "../utils/toastBus";
import { DATA_CHANGED_EVENT, notifyDataChanged } from "../utils/dataRefresh";

const emptySchool = { name: "", city: "" };
const emptyAdmin = {
  first_name: "",
  last_name: "",
  middle_name: "",
  login: "",
  school_id: "",
};

const generatePassword = () => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = new Uint32Array(16);
  window.crypto.getRandomValues(values);

  return Array.from(values, (value) => chars[value % chars.length]).join("");
};

const getCreateAdminErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (detail === "User with this login already exists") {
      return "Пользователь с таким логином уже существует.";
    }
  }

  return "Не удалось создать администратора школы. Попробуйте ещё раз.";
};

const roleTabs = [
  { role: "admin", label: "Администраторы" },
  { role: "teacher", label: "Учителя" },
  { role: "parent", label: "Родители" },
] as const;

const getUserDeletionCopy = (user: UserListItem) => {
  if (user.role === "teacher") {
    return {
      title: "Удалить учителя",
      confirmation: "Учебные назначения учителя также будут удалены.",
      success: "Учитель удалён",
      error: "Не удалось удалить учителя.",
      action: "Удалить учителя",
    };
  }

  if (user.role === "parent") {
    return {
      title: "Удалить родителя",
      confirmation: "Привязки родителя к ученикам также будут удалены.",
      success: "Родитель удалён",
      error: "Не удалось удалить родителя.",
      action: "Удалить родителя",
    };
  }

  return {
    title: "Удалить администратора",
    confirmation: "Доступ к школе будет прекращён.",
    success: "Администратор удалён",
    error: "Не удалось удалить администратора.",
    action: "Удалить администратора",
  };
};

const MaxLogoMark = () => (
  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#00A3FF] via-[#4A6CFF] to-[#8A3FFC] text-[8px] font-black leading-none text-white shadow-sm">
    MAX
  </span>
);

const MaxConnectionBadge = ({ connected }: { connected?: boolean }) => (
  <span
    className={[
      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold",
      connected
        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
        : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300",
    ].join(" ")}
  >
    <MaxLogoMark />
    {connected ? "Привязан" : "Не привязан"}
  </span>
);

const PlatformPage = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<(typeof roleTabs)[number]["role"]>("admin");
  const [schoolForm, setSchoolForm] = useState(emptySchool);
  const [adminForm, setAdminForm] = useState(emptyAdmin);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const [isSavingSchoolChanges, setIsSavingSchoolChanges] = useState(false);
  const [isDeletingSchool, setIsDeletingSchool] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);
  const [schoolEditForm, setSchoolEditForm] = useState(emptySchool);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
  const [createdAdminCredentials, setCreatedAdminCredentials] = useState<{
    login: string;
    password: string;
  } | null>(null);

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId) ?? null,
    [schools, selectedSchoolId],
  );

  const usersInSelectedSchool = useMemo(
    () => users.filter((user) => user.school_id === selectedSchoolId),
    [selectedSchoolId, users],
  );

  const selectedRoleUsers = useMemo(
    () => usersInSelectedSchool.filter((user) => user.role === selectedRole),
    [selectedRole, usersInSelectedSchool],
  );

  const roleCounts = useMemo(
    () =>
      roleTabs.reduce<Record<string, number>>((acc, tab) => {
        acc[tab.role] = usersInSelectedSchool.filter(
          (user) => user.role === tab.role,
        ).length;
        return acc;
      }, {}),
    [usersInSelectedSchool],
  );

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [schoolsData, usersData] = await Promise.all([
        getSchools(),
        getUsers(),
      ]);
      setSchools(schoolsData);
      setUsers(usersData);
      setSelectedSchoolId((prev) => prev || schoolsData[0]?.id || "");
      setAdminForm((prev) => ({
        ...prev,
        school_id: prev.school_id || schoolsData[0]?.id || "",
      }));
    } catch {
      if (!silent) toastBus.error("Не удалось загрузить данные платформы.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const refreshId = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchData(true);
    }, 3_000);

    return () => window.clearInterval(refreshId);
  }, []);

  useEffect(() => {
    const refreshOnDataChange = () => fetchData(true);
    window.addEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, refreshOnDataChange);
  }, []);

  useEffect(() => {
    if (!selectedSchoolId) return;
    setAdminForm((prev) => ({ ...prev, school_id: selectedSchoolId }));
  }, [selectedSchoolId]);

  const handleCreateSchool = async () => {
    if (!schoolForm.name.trim()) return;
    try {
      setIsSavingSchool(true);
      const school = await createSchool({
        name: schoolForm.name.trim(),
        city: schoolForm.city.trim(),
      });
      setSchools((prev) =>
        [...prev, school].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedSchoolId(school.id);
      setSchoolForm(emptySchool);
      notifyDataChanged();
      toastBus.success("Школа создана");
    } catch {
      toastBus.error("Не удалось создать школу.");
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handleDeleteSchool = (school: School) => {
    if (isDeletingSchool) return;
    setSchoolToDelete(school);
  };

  const openSchoolEditor = (school: School) => {
    setSelectedSchoolId(school.id);
    setSchoolToEdit(school);
    setSchoolEditForm({ name: school.name, city: school.city || "" });
  };

  const saveSchoolChanges = async () => {
    if (!schoolToEdit || !schoolEditForm.name.trim()) return;

    try {
      setIsSavingSchoolChanges(true);
      const updatedSchool = await updateSchool(schoolToEdit.id, {
        name: schoolEditForm.name.trim(),
        city: schoolEditForm.city.trim(),
      });
      setSchools((prev) =>
        prev
          .map((school) =>
            school.id === updatedSchool.id ? updatedSchool : school,
          )
          .sort((left, right) => left.name.localeCompare(right.name)),
      );
      setSchoolToEdit(null);
      notifyDataChanged();
      toastBus.success("Данные школы обновлены");
    } catch {
      toastBus.error("Не удалось обновить данные школы.");
    } finally {
      setIsSavingSchoolChanges(false);
    }
  };

  const runConfirmedSchoolDeletion = async () => {
    if (!schoolToDelete) return;

    try {
      setIsDeletingSchool(true);
      await deleteSchool(schoolToDelete.id);
      const remainingSchools = schools.filter(
        (school) => school.id !== schoolToDelete.id,
      );
      setSchools(remainingSchools);
      setUsers((prev) =>
        prev.filter((user) => user.school_id !== schoolToDelete.id),
      );
      setSelectedSchoolId(remainingSchools[0]?.id || "");
      notifyDataChanged();
      toastBus.success("Школа удалена");
    } catch {
      toastBus.error("Не удалось удалить школу.");
    } finally {
      setIsDeletingSchool(false);
      setSchoolToDelete(null);
    }
  };

  const runConfirmedUserDeletion = async () => {
    if (!userToDelete) return;

    const deletionCopy = getUserDeletionCopy(userToDelete);

    try {
      setIsDeletingUser(true);
      await deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
      notifyDataChanged();
      toastBus.success(deletionCopy.success);
      setUserToDelete(null);
    } catch {
      toastBus.error(deletionCopy.error);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (
      !adminForm.first_name.trim() ||
      !adminForm.last_name.trim() ||
      !adminForm.login.trim() ||
      !adminForm.school_id
    ) {
      return;
    }

    const password = generatePassword();

    try {
      setIsSavingAdmin(true);
      const created = await createSchoolAdmin({
        ...adminForm,
        first_name: adminForm.first_name.trim(),
        last_name: adminForm.last_name.trim(),
        middle_name: adminForm.middle_name.trim(),
        login: adminForm.login.trim(),
        password,
      });
      setUsers((prev) => [...prev, created]);
      notifyDataChanged();
      setSelectedRole("admin");
      setAdminForm({ ...emptyAdmin, school_id: adminForm.school_id });
      setCreatedAdminCredentials({
        login: created.login,
        password,
      });
      toastBus.success("Администратор школы создан");
    } catch (error) {
      toastBus.error(getCreateAdminErrorMessage(error));
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastBus.success(`${label} скопирован`);
    } catch {
      toastBus.error("Не удалось скопировать.");
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)]">
      <div className="page-shell">
        <section className="mb-7 border-b border-slate-200 pb-7 dark:rounded-2xl dark:border dark:border-white/10 dark:bg-[#071225] dark:px-5 dark:py-7 dark:text-white dark:shadow-xl dark:shadow-slate-900/10 sm:dark:px-7 lg:dark:px-8">
          <div className="hidden dark:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-blue-200">
            <IoBusinessOutline className="h-4 w-4" />
            Платформа
          </div>
          <h1 className="text-3xl font-extrabold tracking-normal text-slate-950 dark:mt-5 dark:text-white sm:text-4xl">
            Школы и команды
          </h1>
          <p className="mt-2 max-w-3xl text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
            Выберите школу, затем смотрите администраторов, учителей и родителей внутри
            этой школы. Новую школу и школьного администратора можно создать здесь же.
          </p>
        </section>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface px-4 py-3">
              <div className="text-sm font-bold text-slate-500">Школ</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">
                {schools.length}
              </div>
            </div>
            <div className="surface px-4 py-3">
              <div className="text-sm font-bold text-slate-500">В выбранной</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">
                {usersInSelectedSchool.length}
              </div>
            </div>
            <div className="surface px-4 py-3">
              <div className="text-sm font-bold text-slate-500">Всего людей</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">
                {users.length}
              </div>
            </div>
          </div>
        </div>

        <section className="surface mb-4 overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-950 dark:text-white">
              <IoSchoolOutline className="h-6 w-6 text-blue-600" />
              Школы
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 py-4">
            {isLoading && (
              <div className="text-base font-medium text-slate-500">
                Загружаем школы...
              </div>
            )}
            {!isLoading &&
              schools.map((school) => {
                const isActive = school.id === selectedSchoolId;
                const schoolUsers = users.filter(
                  (user) => user.school_id === school.id,
                ).length;
                return (
                  <div key={school.id} className="group relative min-w-64">
                    <button
                      type="button"
                      onClick={() => setSelectedSchoolId(school.id)}
                      className={[
                        "w-full rounded-xl border px-4 py-3 pr-20 text-left transition",
                        isActive
                          ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                          : "border-slate-200 bg-white text-slate-900 hover:border-blue-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
                      ].join(" ")}
                    >
                      <span className="block truncate text-base font-extrabold">
                        {school.name}
                      </span>
                      <span
                        className={[
                          "mt-1 block text-sm font-semibold",
                          isActive ? "text-blue-100" : "text-slate-500",
                        ].join(" ")}
                      >
                        {school.city || "Город не указан"} · {schoolUsers} чел.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openSchoolEditor(school)}
                      disabled={isSavingSchoolChanges || isDeletingSchool}
                      aria-label={`Открыть настройки школы ${school.name}`}
                      title="Открыть настройки школы"
                      className={[
                        "absolute right-11 top-2 inline-flex h-9 w-9 items-center justify-center transition duration-200",
                        "text-slate-400 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-300",
                        "focus-visible:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      ].join(" ")}
                    >
                      <IoPencilOutline className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSchool(school)}
                      disabled={isDeletingSchool}
                      aria-label={`Удалить школу ${school.name}`}
                      title="Удалить школу"
                      className={[
                        "absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center transition duration-200",
                        "text-slate-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-500",
                        "focus-visible:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      ].join(" ")}
                    >
                      <IoTrashOutline className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="surface overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-950 dark:text-white">
                <IoAddOutline className="h-6 w-6 text-blue-600" />
                Новая школа
              </h2>
            </div>
            <div className="grid gap-3 p-5">
              <input
                value={schoolForm.name}
                onChange={(event) =>
                  setSchoolForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Название школы"
                className="field w-full"
              />
              <input
                value={schoolForm.city}
                onChange={(event) =>
                  setSchoolForm((prev) => ({
                    ...prev,
                    city: event.target.value,
                  }))
                }
                placeholder="Город"
                className="field w-full"
              />
              <button
                type="button"
                onClick={handleCreateSchool}
                disabled={isSavingSchool || !schoolForm.name.trim()}
                className="button-primary"
              >
                <IoAddOutline className="h-5 w-5" />
                {isSavingSchool ? "Создаем..." : "Создать школу"}
              </button>
            </div>
          </section>

          <section className="surface overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-950 dark:text-white">
                <IoPeopleOutline className="h-6 w-6 text-blue-600" />
                Новый администратор школы
              </h2>
              {selectedSchool && (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Будет привязан к школе: {selectedSchool.name}
                </p>
              )}
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <input
                value={adminForm.last_name}
                onChange={(event) =>
                  setAdminForm((prev) => ({
                    ...prev,
                    last_name: event.target.value,
                  }))
                }
                placeholder="Фамилия"
                className="field w-full"
              />
              <input
                value={adminForm.first_name}
                onChange={(event) =>
                  setAdminForm((prev) => ({
                    ...prev,
                    first_name: event.target.value,
                  }))
                }
                placeholder="Имя"
                className="field w-full"
              />
              <input
                value={adminForm.middle_name}
                onChange={(event) =>
                  setAdminForm((prev) => ({
                    ...prev,
                    middle_name: event.target.value,
                  }))
                }
                placeholder="Отчество"
                className="field w-full"
              />
              <input
                value={adminForm.login}
                onChange={(event) =>
                  setAdminForm((prev) => ({ ...prev, login: event.target.value }))
                }
                placeholder="Логин"
                className="field w-full"
              />
              <select
                value={adminForm.school_id}
                onChange={(event) =>
                  setAdminForm((prev) => ({
                    ...prev,
                    school_id: event.target.value,
                  }))
                }
                className="field w-full"
              >
                <option value="">Выберите школу</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}, {school.city}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCreateAdmin}
                disabled={isSavingAdmin || !adminForm.school_id}
                className="button-primary sm:col-span-2"
              >
                <IoAddOutline className="h-5 w-5" />
                {isSavingAdmin ? "Создаем..." : "Создать администратора школы"}
              </button>
            </div>
          </section>
        </div>

        <section className="surface mt-4 overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
                  {selectedSchool?.name || "Выберите школу"}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {selectedSchool?.city || "Команда школы"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {roleTabs.map((tab) => {
                  const isActive = tab.role === selectedRole;
                  return (
                    <button
                      key={tab.role}
                      type="button"
                      onClick={() => setSelectedRole(tab.role)}
                      className={[
                        "inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-extrabold transition",
                        isActive
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200",
                      ].join(" ")}
                    >
                      {tab.label}
                      <span
                        className={[
                          "ml-2 rounded-md px-2 py-0.5 text-xs",
                          isActive
                            ? "bg-white/18 text-white"
                            : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {roleCounts[tab.role] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-base">
              <thead className="border-b border-slate-200 bg-slate-50 text-sm font-bold uppercase tracking-[0.06em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">ФИО</th>
                  <th className="px-5 py-4">Логин</th>
                  <th className="px-5 py-4">Роль</th>
                  {selectedRole === "parent" && (
                    <th className="px-5 py-4">MAX</th>
                  )}
                  <th className="px-5 py-4">Статус</th>
                  <th className="px-5 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {selectedRoleUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-5">
                      <p className="font-bold text-slate-950 dark:text-white">
                        {user.last_name} {user.first_name} {user.middle_name}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-slate-600 dark:text-slate-300">
                      {user.login}
                    </td>
                    <td className="px-5 py-5">
                      <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        {formatRole(user.role)}
                      </span>
                    </td>
                    {selectedRole === "parent" && (
                      <td className="px-5 py-5">
                        <MaxConnectionBadge connected={user.max_connected} />
                      </td>
                    )}
                    <td className="px-5 py-5">
                      {user.is_blocked ? (
                        <span className="inline-flex rounded-lg bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">
                          Заблокирован
                        </span>
                      ) : (
                        <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        disabled={isDeletingUser}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/30 dark:bg-white/[0.04] dark:text-red-300 dark:hover:border-red-400/60 dark:hover:bg-red-500/10"
                      >
                        <IoTrashOutline className="h-5 w-5" />
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && selectedRoleUsers.length === 0 && (
            <div className="border-t border-slate-100 px-5 py-8 text-center text-base font-medium text-slate-500 dark:border-white/10">
              В этой вкладке пока нет пользователей.
            </div>
          )}
        </section>
      </div>

      {schoolToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            if (!isDeletingSchool) setSchoolToDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-school-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#151515]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2
                id="delete-school-title"
                className="text-xl font-extrabold text-slate-950 dark:text-white"
              >
                Удалить школу
              </h2>
              <p className="mt-2 text-base font-medium leading-7 text-slate-500">
                Удалить школу «{schoolToDelete.name}»? Это действие необратимо.
              </p>
            </div>

            <div className="flex flex-col gap-2 bg-slate-50 px-5 py-4 dark:bg-white/[0.04] sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSchoolToDelete(null)}
                disabled={isDeletingSchool}
                className="button-secondary"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={runConfirmedSchoolDeletion}
                disabled={isDeletingSchool}
                className="button-danger"
              >
                {isDeletingSchool ? "Удаляем..." : "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {schoolToEdit && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            if (!isSavingSchoolChanges) setSchoolToEdit(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-school-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#151515]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2
                id="edit-school-title"
                className="text-xl font-extrabold text-slate-950 dark:text-white"
              >
                Настройки школы
              </h2>
              <p className="mt-2 text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
                Измените название или город. Состав классов и пользователей не изменится.
              </p>
            </div>

            <div className="grid gap-4 px-5 py-5">
              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                Название школы
                <input
                  value={schoolEditForm.name}
                  onChange={(event) =>
                    setSchoolEditForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="field w-full"
                  disabled={isSavingSchoolChanges}
                  autoFocus
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                Город
                <input
                  value={schoolEditForm.city}
                  onChange={(event) =>
                    setSchoolEditForm((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }
                  className="field w-full"
                  disabled={isSavingSchoolChanges}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.04] sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSchoolToEdit(null)}
                disabled={isSavingSchoolChanges}
                className="button-secondary"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={saveSchoolChanges}
                disabled={isSavingSchoolChanges || !schoolEditForm.name.trim()}
                className="button-primary"
              >
                {isSavingSchoolChanges ? "Сохраняем..." : "Сохранить изменения"}
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            if (!isDeletingUser) setUserToDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#151515]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 id="delete-user-title" className="text-xl font-extrabold text-slate-950 dark:text-white">
                {getUserDeletionCopy(userToDelete).title}
              </h2>
              <p className="mt-2 text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
                Удалить {formatRole(userToDelete.role).toLowerCase()} «{userToDelete.last_name} {userToDelete.first_name}»? {getUserDeletionCopy(userToDelete).confirmation}
              </p>
            </div>
            <div className="flex flex-col gap-2 bg-slate-50 px-5 py-4 dark:bg-white/[0.04] sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="button-secondary"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={runConfirmedUserDeletion}
                disabled={isDeletingUser}
                className="button-danger"
              >
                {isDeletingUser ? "Удаляем..." : getUserDeletionCopy(userToDelete).action}
              </button>
            </div>
          </div>
        </div>
      )}

      {createdAdminCredentials && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => setCreatedAdminCredentials(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="created-admin-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#151515]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2
                id="created-admin-title"
                className="text-xl font-extrabold text-slate-950 dark:text-white"
              >
                Администратор школы создан
              </h2>
              <button
                type="button"
                onClick={() => setCreatedAdminCredentials(null)}
                className="button-secondary h-10 w-10 px-0"
                aria-label="Закрыть"
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <IoCheckmarkCircleOutline className="h-9 w-9" />
              </div>
              <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-6 text-slate-500">
                Скопируйте логин и пароль и передайте администратору. После
                закрытия этого окна пароль больше нельзя будет посмотреть.
              </p>
            </div>

            <div className="grid gap-3 px-5 pb-5">
              {[
                ["Логин", createdAdminCredentials.login],
                ["Пароль", createdAdminCredentials.password],
              ].map(([label, value]) => (
                <label
                  key={label}
                  className="grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"
                >
                  {label}
                  <span className="relative block">
                    <input readOnly value={value} className="field w-full pr-12" />
                    <button
                      type="button"
                      onClick={() => copyValue(value, label)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-white/10"
                      aria-label={`Скопировать ${label}`}
                    >
                      <IoCopyOutline className="h-5 w-5" />
                    </button>
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setCreatedAdminCredentials(null)}
                className="button-primary"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlatformPage;
