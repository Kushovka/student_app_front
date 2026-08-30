import { useEffect, useMemo, useState } from "react";
import {
  IoAddOutline,
  IoBusinessOutline,
  IoPeopleOutline,
  IoRefreshOutline,
  IoSchoolOutline,
} from "react-icons/io5";
import { createSchool, getSchools, type School } from "../api/schools";
import {
  createSchoolAdmin,
  getUsers,
  type UserListItem,
} from "../api/users";
import { formatRole } from "../utils/formatRole";
import { toastBus } from "../utils/toastBus";

const emptySchool = { name: "", city: "" };
const emptyAdmin = {
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  password: "",
  school_id: "",
};

const roleTabs = [
  { role: "admin", label: "Админы" },
  { role: "teacher", label: "Учителя" },
  { role: "parent", label: "Родители" },
] as const;

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
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

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

  const fetchData = async () => {
    try {
      setIsLoading(true);
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
      toastBus.error("Не удалось загрузить данные платформы.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      toastBus.success("Школа создана");
    } catch {
      toastBus.error("Не удалось создать школу.");
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (
      !adminForm.first_name.trim() ||
      !adminForm.last_name.trim() ||
      !adminForm.email.trim() ||
      !adminForm.password.trim() ||
      !adminForm.school_id
    ) {
      return;
    }

    try {
      setIsSavingAdmin(true);
      const created = await createSchoolAdmin(adminForm);
      setUsers((prev) => [...prev, created]);
      setSelectedRole("admin");
      setAdminForm({ ...emptyAdmin, school_id: adminForm.school_id });
      toastBus.success("Админ школы создан");
    } catch {
      toastBus.error("Не удалось создать админа школы.");
    } finally {
      setIsSavingAdmin(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)]">
      <div className="page-shell">
        <section className="mb-7 rounded-2xl border border-slate-200 bg-[#071225] px-5 py-7 text-white shadow-xl shadow-slate-900/10 dark:border-white/10 sm:px-7 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-blue-200">
            <IoBusinessOutline className="h-4 w-4" />
            Платформа
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-normal sm:text-4xl">
            Школы и команды
          </h1>
          <p className="mt-2 max-w-3xl text-base font-medium leading-7 text-slate-300">
            Выберите школу, затем смотрите админов, учителей и родителей внутри
            этой школы. Новую школу и школьного админа можно создать здесь же.
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
          <button type="button" onClick={fetchData} className="button-secondary">
            <IoRefreshOutline className="h-5 w-5" />
            Обновить
          </button>
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
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => setSelectedSchoolId(school.id)}
                    className={[
                      "min-w-64 rounded-xl border px-4 py-3 text-left transition",
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
                Новый админ школы
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
                value={adminForm.email}
                onChange={(event) =>
                  setAdminForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="Email"
                className="field w-full"
              />
              <input
                value={adminForm.password}
                onChange={(event) =>
                  setAdminForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                placeholder="Пароль"
                type="password"
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
                {isSavingAdmin ? "Создаем..." : "Создать админа школы"}
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
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Роль</th>
                  {selectedRole === "parent" && (
                    <th className="px-5 py-4">MAX</th>
                  )}
                  <th className="px-5 py-4">Статус</th>
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
                      {user.email}
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
                          blocked
                        </span>
                      ) : (
                        <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                          active
                        </span>
                      )}
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
    </section>
  );
};

export default PlatformPage;
