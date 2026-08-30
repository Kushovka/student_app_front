import { useEffect, useMemo, useState } from "react";
import {
  IoAddOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoClose,
  IoCopyOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoSchoolOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router";
import { getClassOptions, getStudents, type ClassOption } from "../api/student";
import {
  createSchoolUser,
  createTeacherAssignment,
  deleteTeacherAssignment,
  deleteUser,
  getTeacherAssignments,
  getUserById,
  getUsers,
  updateUserBlockStatus,
  updateUserRole,
  type CreateSchoolUserPayload,
  type TeacherAssignment,
  type TeacherAssignmentPayload,
  type UserListItem,
} from "../api/users";
import { useAuth } from "../context/authContext";
import type { StudentResponce } from "../types/student.type";
import { gradeOptions, sortClassLetters } from "../utils/classOptions";
import { formatRole } from "../utils/formatRole";
import { toastBus } from "../utils/toastBus";

type TabId = "all" | "students" | "admin" | "teacher" | "parent";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "all", label: "Все" },
  { id: "students", label: "Ученики" },
  { id: "admin", label: "Админы" },
  { id: "teacher", label: "Учителя" },
  { id: "parent", label: "Родители" },
];

const emptyCreateForm: CreateSchoolUserPayload = {
  last_name: "",
  first_name: "",
  middle_name: "",
  email: "",
  password: "",
  role: "teacher",
};

const roleOptions: Array<{ value: CreateSchoolUserPayload["role"]; label: string }> = [
  { value: "admin", label: "Администратор" },
  { value: "teacher", label: "Учитель" },
  { value: "parent", label: "Родитель" },
];

const schoolSubjects = [
  "Русский язык",
  "Литература",
  "Математика",
  "Алгебра",
  "Геометрия",
  "Информатика",
  "Физика",
  "Химия",
  "Биология",
  "История",
  "Обществознание",
  "География",
  "Английский язык",
  "Немецкий язык",
  "Французский язык",
  "ОБЖ",
  "Физкультура",
  "Технология",
  "Музыка",
  "ИЗО",
];

const emptyAssignmentForm: TeacherAssignmentPayload = {
  grade: 7,
  class_letter: "__all__",
  subject: "Математика",
};

const allClassLettersValue = "__all__";

const fullName = (item: Pick<UserListItem | StudentResponce, "last_name" | "first_name" | "middle_name">) =>
  [item.last_name, item.first_name, item.middle_name].filter(Boolean).join(" ");

const getClassName = (student: StudentResponce) =>
  `${student.grade}${student.class_letter}`;

const MaxLogoMark = () => (
  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#00A3FF] via-[#4A6CFF] to-[#8A3FFC] text-[8px] font-black leading-none text-white shadow-sm">
    MAX
  </span>
);

const MaxConnectionBadge = ({
  connected,
  compact = false,
}: {
  connected?: boolean;
  compact?: boolean;
}) => (
  <span
    className={[
      "inline-flex items-center gap-2 rounded-lg font-bold",
      compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
      connected
        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
        : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300",
    ].join(" ")}
  >
    <MaxLogoMark />
    {connected ? "Привязан" : "Не привязан"}
  </span>
);

const fetchAllStudents = async () => {
  const firstPage = await getStudents(undefined, undefined, undefined, 1, 100);
  if (firstPage.pages <= 1) return firstPage.items;

  const restPages = await Promise.all(
    Array.from({ length: firstPage.pages - 1 }, (_, index) =>
      getStudents(undefined, undefined, undefined, index + 2, 100),
    ),
  );

  return [
    ...firstPage.items,
    ...restPages.flatMap((page) => page.items),
  ];
};

const generatePassword = () => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = new Uint32Array(16);
  window.crypto.getRandomValues(values);

  return Array.from(values, (value) => chars[value % chars.length]).join("");
};

const UsersPage = () => {
  const navigate = useNavigate();
  const { user, isUserLoading } = useAuth();
  const canManageUsers = user?.role === "admin" || user?.role === "superadmin";
  const isSchoolAdmin = user?.role === "admin";

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [students, setStudents] = useState<StudentResponce[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [selectedClassName, setSelectedClassName] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserModalLoading, setIsUserModalLoading] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>(
    [],
  );
  const [assignmentForm, setAssignmentForm] =
    useState<TeacherAssignmentPayload>(emptyAssignmentForm);
  const [schoolClasses, setSchoolClasses] = useState<ClassOption[]>([]);
  const [isAssignmentLoading, setIsAssignmentLoading] = useState(false);
  const [assignmentActionId, setAssignmentActionId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] =
    useState<CreateSchoolUserPayload>(emptyCreateForm);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    variant: "danger" | "neutral";
    action: "delete" | "block" | "unblock";
    user: UserListItem;
  } | null>(null);

  const counts = useMemo(
    () => ({
      all: users.length,
      students: students.length,
      admin: users.filter((u) => u.role === "admin").length,
      teacher: users.filter((u) => u.role === "teacher").length,
      parent: users.filter((u) => u.role === "parent").length,
      blocked: users.filter((u) => u.is_blocked).length,
    }),
    [students.length, users],
  );

  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    const byRole =
      activeTab === "all" || activeTab === "students"
        ? users
        : users.filter((u) => u.role === activeTab);

    if (!normalizedSearch) return byRole;
    return byRole.filter((u) =>
      `${fullName(u)} ${u.email} ${formatRole(u.role)}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [activeTab, normalizedSearch, users]);

  const filteredStudents = useMemo(() => {
    if (!normalizedSearch) return students;
    return students.filter((student) =>
      `${fullName(student)} ${student.grade}${student.class_letter} ${student.email}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [normalizedSearch, students]);

  const studentClassGroups = useMemo(() => {
    const groups = new Map<string, StudentResponce[]>();
    filteredStudents.forEach((student) => {
      const className = getClassName(student);
      groups.set(className, [...(groups.get(className) ?? []), student]);
    });

    return Array.from(groups.entries())
      .map(([className, items]) => ({
        className,
        items: items.sort((a, b) => fullName(a).localeCompare(fullName(b))),
      }))
      .sort((a, b) => {
        const gradeA = Number.parseInt(a.className, 10);
        const gradeB = Number.parseInt(b.className, 10);
        if (gradeA !== gradeB) return gradeA - gradeB;
        return a.className.localeCompare(b.className);
      });
  }, [filteredStudents]);

  const selectedClassStudents = useMemo(() => {
    const activeGroup = studentClassGroups.find(
      (group) => group.className === selectedClassName,
    );
    return activeGroup?.items ?? [];
  }, [selectedClassName, studentClassGroups]);

  const availableAssignmentLetters = useMemo(
    () =>
      sortClassLetters(
        schoolClasses
          .filter((item) => item.grade === Number(assignmentForm.grade))
          .map((item) => item.class_letter),
      ),
    [assignmentForm.grade, schoolClasses],
  );

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersData, studentsData, classOptions] = await Promise.all([
        getUsers(),
        isSchoolAdmin ? fetchAllStudents() : null,
        isSchoolAdmin ? getClassOptions() : null,
      ]);
      setUsers(usersData);
      setStudents(studentsData ?? []);
      setSchoolClasses(classOptions?.classes ?? []);
    } catch {
      toastBus.error("Не удалось загрузить данные.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoading) return;

    if (!canManageUsers) {
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [canManageUsers, isSchoolAdmin, isUserLoading]);

  useEffect(() => {
    if (activeTab !== "students") return;
    if (studentClassGroups.length === 0) {
      setSelectedClassName("");
      return;
    }
    if (!studentClassGroups.some((group) => group.className === selectedClassName)) {
      setSelectedClassName(studentClassGroups[0].className);
    }
  }, [activeTab, selectedClassName, studentClassGroups]);

  useEffect(() => {
    if (availableAssignmentLetters.length === 0) {
      if (!assignmentForm.class_letter) return;
      setAssignmentForm((prev) => ({
        ...prev,
        class_letter: "",
      }));
      return;
    }
    if (
      assignmentForm.class_letter === allClassLettersValue ||
      availableAssignmentLetters.includes(assignmentForm.class_letter)
    ) {
      return;
    }
    setAssignmentForm((prev) => ({
      ...prev,
      class_letter: allClassLettersValue,
    }));
  }, [assignmentForm.class_letter, availableAssignmentLetters]);

  useEffect(() => {
    if (!isSchoolAdmin) return;

    const openCreateUserModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener("open-create-user-modal", openCreateUserModal);
    return () => {
      window.removeEventListener("open-create-user-modal", openCreateUserModal);
    };
  }, [isSchoolAdmin]);

  const updateUserInList = (updated: UserListItem) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const openUserModal = async (userId: string) => {
    setIsUserModalOpen(true);
    setSelectedUser(null);
    setTeacherAssignments([]);

    try {
      setIsUserModalLoading(true);
      const loadedUser = await getUserById(userId);
      setSelectedUser(loadedUser);
      if (loadedUser.role === "teacher") {
        setIsAssignmentLoading(true);
        setTeacherAssignments(await getTeacherAssignments(loadedUser.id));
      }
    } catch {
      toastBus.error("Не удалось загрузить пользователя.");
      setIsUserModalOpen(false);
    } finally {
      setIsUserModalLoading(false);
      setIsAssignmentLoading(false);
    }
  };

  const closeUserModal = () => {
    if (actionUserId) return;
    setIsUserModalOpen(false);
    setSelectedUser(null);
    setTeacherAssignments([]);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateModalOpen(false);
    setCreatedUserCredentials(null);
    setCreateForm(emptyCreateForm);
  };

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastBus.success(`${label} скопирован`);
    } catch {
      toastBus.error("Не удалось скопировать.");
    }
  };

  const refreshTeacherAssignments = async (teacherId: string) => {
    setIsAssignmentLoading(true);
    try {
      setTeacherAssignments(await getTeacherAssignments(teacherId));
    } catch {
      toastBus.error("Не удалось загрузить назначения учителя.");
    } finally {
      setIsAssignmentLoading(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedUser || selectedUser.role !== "teacher") return;
    const subject = assignmentForm.subject.trim();
    const targetLetters =
      assignmentForm.class_letter === allClassLettersValue
        ? availableAssignmentLetters
        : [assignmentForm.class_letter];

    if (
      !gradeOptions.includes(Number(assignmentForm.grade)) ||
      targetLetters.length === 0 ||
      targetLetters.some((letter) => !availableAssignmentLetters.includes(letter)) ||
      !subject
    ) {
      toastBus.error("Укажите класс и предмет.");
      return;
    }

    const newLetters = targetLetters.filter(
      (letter) =>
        !teacherAssignments.some(
          (assignment) =>
            assignment.grade === Number(assignmentForm.grade) &&
            assignment.class_letter === letter &&
            assignment.subject === subject,
        ),
    );

    if (newLetters.length === 0) {
      toastBus.error("Такие назначения уже есть.");
      return;
    }

    try {
      setAssignmentActionId("new");
      const created = await Promise.all(
        newLetters.map((letter) =>
          createTeacherAssignment(selectedUser.id, {
            grade: Number(assignmentForm.grade),
            class_letter: letter,
            subject,
          }),
        ),
      );
      setTeacherAssignments((prev) => [...prev, ...created]);
      toastBus.success(
        created.length === 1
          ? "Назначение добавлено"
          : `Добавлено назначений: ${created.length}`,
      );
    } catch {
      toastBus.error("Не удалось добавить назначение.");
    } finally {
      setAssignmentActionId(null);
    }
  };

  const handleDeleteAssignment = async (assignment: TeacherAssignment) => {
    if (!selectedUser || selectedUser.role !== "teacher") return;

    try {
      setAssignmentActionId(assignment.id);
      await deleteTeacherAssignment(selectedUser.id, assignment.id);
      setTeacherAssignments((prev) =>
        prev.filter((item) => item.id !== assignment.id),
      );
      toastBus.success("Назначение удалено");
    } catch {
      toastBus.error("Не удалось удалить назначение.");
    } finally {
      setAssignmentActionId(null);
    }
  };

  const handleCreateUser = async () => {
    if (
      !createForm.last_name.trim() ||
      !createForm.first_name.trim() ||
      !createForm.email.trim()
    ) {
      toastBus.error("Заполните фамилию, имя и email.");
      return;
    }

    const password = generatePassword();

    try {
      setIsCreating(true);
      const created = await createSchoolUser({
        ...createForm,
        last_name: createForm.last_name.trim(),
        first_name: createForm.first_name.trim(),
        middle_name: createForm.middle_name.trim(),
        email: createForm.email.trim(),
        password,
      });
      setUsers((prev) => [...prev, created]);
      setActiveTab(created.role as TabId);
      setCreateForm(emptyCreateForm);
      setCreatedUserCredentials({
        email: created.email,
        password,
      });
      toastBus.success("Пользователь создан");
    } catch {
      toastBus.error("Не удалось создать пользователя.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRoleChange = async (target: UserListItem, nextRole: string) => {
    if (actionUserId) return;
    if (target.id === user?.id) {
      toastBus.error("Нельзя менять роль самому себе.");
      return;
    }

    try {
      setActionUserId(target.id);
      const updated = await updateUserRole(target.id, nextRole);
      updateUserInList(updated);
      setSelectedUser((prev) => (prev?.id === updated.id ? updated : prev));
      if (updated.role === "teacher") {
        await refreshTeacherAssignments(updated.id);
      } else {
        setTeacherAssignments([]);
      }
      toastBus.success("Роль обновлена");
    } catch {
      toastBus.error("Не удалось обновить роль пользователя.");
    } finally {
      setActionUserId(null);
    }
  };

  const handleToggleBlock = (target: UserListItem) => {
    if (actionUserId) return;
    if (target.id === user?.id) {
      toastBus.error("Нельзя заблокировать самого себя.");
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
      toastBus.error("Нельзя удалить самого себя.");
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

      if (confirm.action === "delete") {
        await deleteUser(target.id);
        setUsers((prev) => prev.filter((u) => u.id !== target.id));
        if (selectedUser?.id === target.id) closeUserModal();
        toastBus.success("Пользователь удалён");
      } else {
        const next = confirm.action === "block";
        const updated = await updateUserBlockStatus(target.id, next);
        updateUserInList(updated);
        setSelectedUser((prev) => (prev?.id === updated.id ? updated : prev));
        toastBus.success(
          next ? "Пользователь заблокирован" : "Пользователь разблокирован",
        );
      }
    } catch {
      toastBus.error("Не удалось выполнить действие.");
    } finally {
      setActionUserId(null);
      setConfirm(null);
    }
  };

  if (!isUserLoading && !canManageUsers) {
    return (
      <section className="min-h-[calc(100vh-4rem)]">
        <div className="page-shell">
          <button onClick={() => navigate("/")} className="button-secondary mb-6">
            <IoArrowBackOutline className="h-5 w-5" />
            Назад
          </button>
          <div className="surface flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <IoPeopleOutline className="h-10 w-10 text-slate-400" />
            <h1 className="mt-4 text-xl font-extrabold text-slate-950 dark:text-white">
              Доступ запрещён
            </h1>
            <p className="mt-2 max-w-md text-base font-medium leading-7 text-slate-500">
              Список пользователей доступен только администратору школы.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-4rem)]">
      <div className="page-shell">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button onClick={() => navigate("/")} className="button-secondary mb-4">
              <IoArrowBackOutline className="h-5 w-5" />
              Главная
            </button>
            <p className="page-kicker">Админ-панель</p>
            <h1 className="page-title mt-2">Пользователи школы</h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              {user?.school
                ? `${user.school.name}, ${user.school.city}`
                : "Управление пользователями"}
            </p>
          </div>

          {isSchoolAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="button-primary"
            >
              <IoAddOutline className="h-5 w-5" />
              Создать пользователя
            </button>
          )}
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="surface px-4 py-3">
            <div className="text-sm font-bold text-slate-500">Пользователей</div>
            <div className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
              {isLoading ? "—" : counts.all}
            </div>
          </div>
          <div className="surface px-4 py-3">
            <div className="text-sm font-bold text-slate-500">Учеников</div>
            <div className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
              {isLoading ? "—" : counts.students}
            </div>
          </div>
          <div className="surface px-4 py-3">
            <div className="text-sm font-bold text-slate-500">Админов</div>
            <div className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
              {isLoading ? "—" : counts.admin}
            </div>
          </div>
          <div className="surface px-4 py-3">
            <div className="text-sm font-bold text-slate-500">Учителей</div>
            <div className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
              {isLoading ? "—" : counts.teacher}
            </div>
          </div>
          <div className="surface px-4 py-3">
            <div className="text-sm font-bold text-slate-500">Заблок.</div>
            <div className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
              {isLoading ? "—" : counts.blocked}
            </div>
          </div>
        </div>

        <section className="surface mb-4 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                const count = counts[tab.id as keyof typeof counts] ?? 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "inline-flex h-12 shrink-0 items-center justify-center rounded-lg border px-4 text-base font-extrabold transition",
                      isActive
                        ? "border-blue-700 bg-blue-700 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200",
                    ].join(" ")}
                  >
                    {tab.label}
                    <span
                      className={[
                        "ml-2 rounded-md px-2 py-0.5 text-sm",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="relative block min-w-0 xl:w-[420px]">
              <IoSearchOutline className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="field w-full pl-12"
                placeholder="Поиск по ФИО или email"
              />
            </label>
          </div>
        </section>

        {isLoading && (
          <div className="surface p-8 text-center text-base font-medium text-slate-500">
            Загружаем данные...
          </div>
        )}

        {!isLoading && activeTab === "students" && (
          <section className="surface overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-950 dark:text-white">
                <IoSchoolOutline className="h-6 w-6 text-blue-700" />
                Ученики
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Сначала выберите класс, затем смотрите учеников внутри него.
              </p>
            </div>

            {studentClassGroups.length > 0 && (
              <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <div className="flex gap-2 overflow-x-auto">
                  {studentClassGroups.map((group) => {
                    const isActive = group.className === selectedClassName;
                    return (
                      <button
                        key={group.className}
                        type="button"
                        onClick={() => setSelectedClassName(group.className)}
                        className={[
                          "inline-flex h-12 shrink-0 items-center justify-center rounded-lg border px-4 text-base font-extrabold transition",
                          isActive
                            ? "border-blue-700 bg-blue-700 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200",
                        ].join(" ")}
                      >
                        {group.className}
                        <span
                          className={[
                            "ml-2 rounded-md px-2 py-0.5 text-sm",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
                          ].join(" ")}
                        >
                          {group.items.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {studentClassGroups.length === 0 && (
              <div className="border-t border-slate-100 px-5 py-8 text-center text-base font-medium text-slate-500 dark:border-white/10">
                Ученики не найдены.
              </div>
            )}

            {studentClassGroups.length > 0 && (
              <>
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-base font-extrabold text-slate-950 dark:text-white">
                    {selectedClassName} класс
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-500">
                    {selectedClassStudents.length} учеников
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-base">
                    <thead className="border-b border-slate-200 bg-slate-50 text-sm font-bold uppercase tracking-[0.06em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                      <tr>
                        <th className="px-5 py-4">ФИО</th>
                        <th className="px-5 py-4">Класс</th>
                        <th className="px-5 py-4">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                      {selectedClassStudents.map((student) => (
                        <tr key={student.id}>
                          <td className="px-5 py-5 font-bold text-slate-950 dark:text-white">
                            {fullName(student)}
                          </td>
                          <td className="px-5 py-5">
                            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                              {getClassName(student)}
                            </span>
                          </td>
                          <td className="px-5 py-5 font-medium text-slate-500">
                            {student.email || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {!isLoading && activeTab !== "students" && (
          <section className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-base">
                <thead className="border-b border-slate-200 bg-slate-50 text-sm font-bold uppercase tracking-[0.06em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">ФИО</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Роль</th>
                    <th className="px-5 py-4">MAX</th>
                    <th className="px-5 py-4">Статус</th>
                    <th className="px-5 py-4">Школа</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                      onClick={() => openUserModal(u.id)}
                    >
                      <td className="px-5 py-5 font-bold text-slate-950 dark:text-white">
                        {fullName(u)}
                      </td>
                      <td className="px-5 py-5 font-medium text-slate-600 dark:text-slate-300">
                        {u.email}
                      </td>
                      <td className="px-5 py-5">
                        <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                          {formatRole(u.role)}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        {u.role === "parent" ? (
                          <MaxConnectionBadge
                            connected={u.max_connected}
                            compact
                          />
                        ) : (
                          <span className="text-sm font-semibold text-slate-400">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-5">
                        {u.is_blocked ? (
                          <span className="inline-flex rounded-lg bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">
                            blocked
                          </span>
                        ) : (
                          <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                            active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-5">
                        <p className="font-bold text-slate-950 dark:text-white">
                          {u.school?.name || "—"}
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                          {u.school?.city || ""}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="border-t border-slate-100 px-5 py-8 text-center text-base font-medium text-slate-500 dark:border-white/10">
                Пользователи не найдены.
              </div>
            )}
          </section>
        )}
      </div>

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={closeCreateModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[calc(100vh-48px)] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#151515]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <p className="page-kicker">Новый пользователь</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">
                  Создать для этой школы
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isCreating}
                className="button-secondary h-10 w-10 px-0"
                aria-label="Закрыть"
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            {createdUserCredentials ? (
              <>
                <div className="px-5 py-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <IoCheckmarkCircleOutline className="h-9 w-9" />
                  </div>
                  <h3 className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">
                    Пользователь создан
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                    Скопируйте email и пароль и передайте пользователю. После
                    закрытия этого окна пароль больше нельзя будет посмотреть.
                  </p>
                </div>

                <div className="grid gap-3 px-5 pb-5">
                  {[
                    ["Email", createdUserCredentials.email],
                    ["Пароль", createdUserCredentials.password],
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
                  <button type="button" onClick={closeCreateModal} className="button-primary">
                    Готово
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  <input
                    value={createForm.last_name}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        last_name: event.target.value,
                      }))
                    }
                    className="field"
                    placeholder="Фамилия"
                  />
                  <input
                    value={createForm.first_name}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        first_name: event.target.value,
                      }))
                    }
                    className="field"
                    placeholder="Имя"
                  />
                  <input
                    value={createForm.middle_name}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        middle_name: event.target.value,
                      }))
                    }
                    className="field"
                    placeholder="Отчество"
                  />
                  <input
                    value={createForm.email}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="field"
                    placeholder="Email"
                  />
                  <select
                    value={createForm.role}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        role: event.target.value as CreateSchoolUserPayload["role"],
                      }))
                    }
                    className="field sm:col-span-2"
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.04] sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={isCreating}
                    className="button-secondary"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateUser}
                    disabled={isCreating}
                    className="button-primary"
                  >
                    <IoAddOutline className="h-5 w-5" />
                    {isCreating ? "Создаём..." : "Создать"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={closeUserModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[calc(100vh-48px)] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#151515]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <p className="page-kicker">Пользователь</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">
                  {isUserModalLoading || !selectedUser
                    ? "Загрузка..."
                    : fullName(selectedUser)}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeUserModal}
                disabled={!!actionUserId}
                className="button-secondary h-10 w-10 px-0"
                aria-label="Закрыть"
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-170px)] overflow-y-auto p-5">
              {isUserModalLoading && (
                <div className="rounded-xl border border-slate-200 p-6 text-center text-base font-medium text-slate-500 dark:border-white/10">
                  Загружаем пользователя...
                </div>
              )}

              {!isUserModalLoading && selectedUser && (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                          <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                            Email
                          </div>
                          <div className="mt-1 break-words text-base font-extrabold text-slate-950 dark:text-white">
                            {selectedUser.email}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                            Роль
                          </div>
                          <div className="mt-1 text-base font-extrabold text-slate-950 dark:text-white">
                            {formatRole(selectedUser.role)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                            Статус
                          </div>
                          <div className="mt-1 text-base font-extrabold text-slate-950 dark:text-white">
                            {selectedUser.is_blocked ? "blocked" : "active"}
                          </div>
                        </div>
                        {selectedUser.role === "parent" && (
                          <div className="md:col-span-4">
                            <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                              MAX
                            </div>
                            <div className="mt-2">
                              <MaxConnectionBadge
                                connected={selectedUser.max_connected}
                              />
                            </div>
                          </div>
                        )}
                        <div className="md:col-span-4">
                          <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                            Школа
                          </div>
                          <div className="mt-1 text-base font-extrabold text-slate-950 dark:text-white">
                            {selectedUser.school
                              ? `${selectedUser.school.name}, ${selectedUser.school.city}`
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSchoolAdmin && selectedUser.role === "teacher" && (
                      <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                            Классы и предметы
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-500">
                            Доступ учителя к классам и предметам.
                          </div>
                        </div>
                        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-slate-100 px-3 text-sm font-extrabold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                          {teacherAssignments.length}
                        </span>
                      </div>

                      <div className="mt-4">
                        {isAssignmentLoading && (
                          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-4 text-center text-sm font-semibold text-slate-500 dark:border-white/10">
                            Загружаем назначения...
                          </div>
                        )}

                        {!isAssignmentLoading && teacherAssignments.length === 0 && (
                          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-4 text-center text-sm font-semibold text-slate-500 dark:border-white/10">
                            Пока нет назначений.
                          </div>
                        )}

                        {!isAssignmentLoading && teacherAssignments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {teacherAssignments.map((assignment) => (
                              <span
                                key={assignment.id}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                              >
                                {assignment.grade}
                                {assignment.class_letter} · {assignment.subject}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(assignment)}
                                  disabled={!!assignmentActionId}
                                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-500/10"
                                  aria-label="Удалить назначение"
                                >
                                  <IoTrashOutline className="h-4 w-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid min-w-0 gap-3 border-t border-slate-200 pt-4 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-[8rem_8rem_minmax(0,1fr)]">
                        <label className="grid min-w-0 gap-1 text-sm font-bold text-slate-500">
                          Класс
                          <select
                            value={assignmentForm.grade}
                            onChange={(event) =>
                              setAssignmentForm((prev) => ({
                                ...prev,
                                grade: Number(event.target.value),
                                class_letter: allClassLettersValue,
                              }))
                            }
                            className="field w-full min-w-0"
                          >
                            {gradeOptions.map((grade) => (
                              <option key={grade} value={grade}>
                                {grade}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid min-w-0 gap-1 text-sm font-bold text-slate-500">
                          Буква
                          <select
                            value={assignmentForm.class_letter}
                            onChange={(event) =>
                              setAssignmentForm((prev) => ({
                                ...prev,
                                class_letter: event.target.value,
                              }))
                            }
                            className="field w-full min-w-0"
                            disabled={availableAssignmentLetters.length === 0}
                          >
                            {availableAssignmentLetters.length === 0 && (
                              <option value="">Нет букв</option>
                            )}
                            {availableAssignmentLetters.length > 0 && (
                              <option value={allClassLettersValue}>
                                Все параллели
                              </option>
                            )}
                            {availableAssignmentLetters.map((letter) => (
                              <option key={letter} value={letter}>
                                {letter}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid min-w-0 gap-1 text-sm font-bold text-slate-500 sm:col-span-2 lg:col-span-1">
                          Предмет
                          <select
                            value={assignmentForm.subject}
                            onChange={(event) =>
                              setAssignmentForm((prev) => ({
                                ...prev,
                                subject: event.target.value,
                              }))
                            }
                            className="field w-full min-w-0"
                          >
                            {schoolSubjects.map((subject) => (
                              <option key={subject} value={subject}>
                                {subject}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={handleAddAssignment}
                          disabled={!!assignmentActionId}
                          className="button-primary sm:col-span-2 lg:col-span-3"
                        >
                          <IoAddOutline className="h-5 w-5" />
                          {assignmentActionId === "new"
                            ? "Добавляем..."
                            : "Добавить назначение"}
                        </button>
                      </div>
                    </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                    <div className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                      Действия
                    </div>

                    <label className="mt-4 block">
                      <span className="text-sm font-bold text-slate-500">Роль</span>
                      <select
                        value={selectedUser.role}
                        onChange={(event) =>
                          handleRoleChange(selectedUser, event.target.value)
                        }
                        disabled={!!actionUserId || selectedUser.id === user?.id}
                        className="field mt-2 w-full"
                      >
                        <option value="admin">Администратор</option>
                        <option value="teacher">Учитель</option>
                        <option value="parent">Родитель</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleToggleBlock(selectedUser)}
                      disabled={!!actionUserId || selectedUser.id === user?.id}
                      className="button-secondary mt-3 w-full"
                    >
                      {selectedUser.is_blocked ? "Разблокировать" : "Заблокировать"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(selectedUser)}
                      disabled={!!actionUserId || selectedUser.id === user?.id}
                      className="button-danger mt-3 w-full"
                    >
                      Удалить
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            if (!actionUserId) setConfirm(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#151515]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div className="text-xl font-extrabold text-slate-950 dark:text-white">
                {confirm.title}
              </div>
              <div className="mt-2 text-base font-medium leading-7 text-slate-500">
                {confirm.message}
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-slate-50 px-5 py-4 dark:bg-white/[0.04] sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={!!actionUserId}
                className="button-secondary"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={runConfirmedAction}
                disabled={!!actionUserId}
                className={
                  confirm.variant === "danger" ? "button-danger" : "button-primary"
                }
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
