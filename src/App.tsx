import { useEffect, useState } from "react";
import {
  IoAdd,
  IoBarChartOutline,
  IoBookOutline,
  IoBusinessOutline,
  IoChevronForwardOutline,
  IoLogOutOutline,
  IoNotificationsOutline,
  IoPersonCircleOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import {
  BrowserRouter,
  useLocation,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router";
import { getMe, type AuthUser } from "./api/profile";
import { createStudents, getStudents } from "./api/student";
import AppLogo from "./components/AppLogo";
import CreateStudentModal from "./components/CreateStudentModal";
import ProtectedRoute from "./components/ProtectedRoute";
import ThemeToggle from "./components/ThemeToggle";
import ToastHost from "./components/ToastHost";
import { AuthProvider } from "./context/authContext";
import { ThemeProvider } from "./context/themeContext";
import AuthPage from "./features/AuthPage";
import ClassPage from "./features/ClassPage";
import DashboardPage from "./features/DashboardPage";
import GradePage from "./features/GradePage";
import ParentCabinetPage from "./features/ParentCabinetPage";
import PlatformPage from "./features/PlatformPage";
import ProfilePage from "./features/ProfilePage";
import SettingsPage from "./features/SettingsPage";
import TableGrades from "./features/TableGrades";
import UsersPage from "./features/UsersPage";
import type { StudentForm, StudentResponce } from "./types/student.type";
import { clearAccessToken } from "./utils/authToken";

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [headerSearch, setHeaderSearch] = useState("");
  const [headerResults, setHeaderResults] = useState<StudentResponce[]>([]);
  const [isHeaderSearching, setIsHeaderSearching] = useState(false);
  const [headerSearchError, setHeaderSearchError] = useState<string | null>(
    null,
  );
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [form, setForm] = useState<StudentForm>({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    grade: "",
    class_letter: "",
  });

  const refreshMe = async () => {
    try {
      setIsUserLoading(true);
      const data = await getMe();
      setUser(data);
    } catch {
      clearAccessToken();
      navigate("/login", { replace: true });
    } finally {
      setIsUserLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const addStudent = async (parentEmail?: string) => {
    try {
      const created = await createStudents({
        ...form,
        email: parentEmail || form.email || "",
        grade: Number(form.grade),
      });

      setForm({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        grade: "",
        class_letter: "",
      });
      return created as StudentResponce;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  const logout = () => {
    clearAccessToken();
    navigate("/login", { replace: true });
  };

  const normalizedHeaderSearch = headerSearch.trim();
  const isAdmin = user?.role === "admin";
  const isParent = user?.role === "parent";
  const isSuperadmin = user?.role === "superadmin";
  const isUsersPage = location.pathname === "/users";
  const isClassesSection =
    location.pathname === "/" || location.pathname.startsWith("/grade/");
  const showFloatingAction = isAdmin && (isUsersPage || isClassesSection);
  const navItems = isSuperadmin
    ? [
        { label: "Платформа", icon: IoBusinessOutline, path: "/platform" },
        { label: "Dashboard", icon: IoBarChartOutline, path: "/dashboard" },
        { label: "Профиль", icon: IoPersonCircleOutline, path: "/profile" },
        { label: "Настройки", icon: IoSettingsOutline, path: "/settings" },
      ]
    : isParent
    ? [
        { label: "Мои дети", icon: IoPeopleOutline, path: "/parent" },
        { label: "Профиль", icon: IoPersonCircleOutline, path: "/profile" },
        { label: "Настройки", icon: IoSettingsOutline, path: "/settings" },
      ]
    : [
        { label: "Классы", icon: IoBookOutline, path: "/" },
        ...(isAdmin
          ? [
              { label: "Dashboard", icon: IoBarChartOutline, path: "/dashboard" },
              { label: "Пользователи", icon: IoPeopleOutline, path: "/users" },
            ]
          : []),
        { label: "Профиль", icon: IoPersonCircleOutline, path: "/profile" },
        { label: "Настройки", icon: IoSettingsOutline, path: "/settings" },
      ];

  const isNavItemActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname.startsWith("/grade/");
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    if (normalizedHeaderSearch.length < 2) {
      setHeaderResults([]);
      setHeaderSearchError(null);
      setIsHeaderSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      const run = async () => {
        try {
          setIsHeaderSearching(true);
          setHeaderSearchError(null);
          const data = await getStudents(
            undefined,
            undefined,
            normalizedHeaderSearch,
            1,
            6,
          );
          setHeaderResults(data.items);
        } catch {
          setHeaderSearchError("Не удалось выполнить поиск.");
          setHeaderResults([]);
        } finally {
          setIsHeaderSearching(false);
        }
      };

      run();
    }, 250);

    return () => clearTimeout(timer);
  }, [normalizedHeaderSearch]);

  const openStudentClass = (student: StudentResponce) => {
    setHeaderSearch("");
    setHeaderResults([]);
    setIsHeaderSearchOpen(false);
    navigate(
      isParent || isSuperadmin
        ? isParent
          ? "/parent"
          : "/platform"
        : `/grade/${student.grade}/${student.class_letter}`,
    );
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-950 dark:bg-[#06101f] dark:text-slate-100">
      <ToastHost />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#071225]/95 px-4 py-5 text-white shadow-2xl shadow-black/20 lg:flex lg:flex-col">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/5"
        >
          <AppLogo className="h-11 w-11" />
          <span>
            <span className="block text-sm font-extrabold leading-5">
              Школьный
              <br />
              контроль
            </span>
          </span>
        </button>

        <nav className="mt-8 grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item.path);
            return (
              <button
                key={`${item.label}-${item.path}`}
                type="button"
                onClick={() => navigate(item.path)}
                className={[
                  "flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold transition",
                  isActive
                    ? "border border-blue-500/50 bg-white/12 text-white shadow-[0_0_0_3px_rgba(37,99,235,0.18)]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-base font-extrabold">
              {user?.first_name?.[0] ?? "А"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold">
                {isUserLoading
                  ? "Загрузка..."
                  : `${user?.last_name ?? ""} ${user?.first_name ?? ""}`}
              </span>
              <span className="block truncate text-xs font-medium text-slate-400">
                {user?.role === "admin"
                  ? "Администратор"
                  : user?.role === "superadmin"
                    ? "Владелец платформы"
                  : user?.role === "parent"
                    ? "Родитель"
                    : "Учитель"}
              </span>
            </span>
            <IoChevronForwardOutline className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071225]/94 text-white shadow-xl shadow-slate-950/10 backdrop-blur">
          <div className="flex h-20 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:opacity-85 lg:hidden"
            >
              <span className="flex h-12 w-12 items-center justify-center">
                <AppLogo className="h-12 w-12" />
              </span>
              <span>
                <span className="block text-base font-extrabold leading-5 text-white">
                  Школьный контроль
                </span>
                <span className="block text-sm font-medium text-slate-400">
                  Классы, ученики, замечания
                </span>
              </span>
            </button>

            {!isSuperadmin && (
              <div className="relative hidden w-full max-w-xl lg:block">
                <label className="relative block">
                  <IoSearchOutline className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={headerSearch}
                    onChange={(event) => {
                      setHeaderSearch(event.target.value);
                      setIsHeaderSearchOpen(true);
                    }}
                    onFocus={() => setIsHeaderSearchOpen(true)}
                    onBlur={() => {
                      window.setTimeout(() => setIsHeaderSearchOpen(false), 120);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setIsHeaderSearchOpen(false);
                      }
                    }}
                    placeholder="Поиск ученика по ФИО или email"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-12 pr-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white/[0.1] focus:ring-4 focus:ring-blue-500/20"
                  />
                </label>

              {isHeaderSearchOpen && normalizedHeaderSearch.length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0f1b2d] text-white shadow-2xl shadow-black/30">
                  <div className="border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                    {isHeaderSearching
                      ? "Ищем..."
                      : headerSearchError
                        ? "Ошибка поиска"
                        : `Результаты: ${headerResults.length}`}
                  </div>

                  {headerSearchError && (
                    <div className="px-4 py-4 text-sm font-semibold text-red-300">
                      {headerSearchError}
                    </div>
                  )}

                  {!isHeaderSearching &&
                    !headerSearchError &&
                    headerResults.length === 0 && (
                      <div className="px-4 py-5 text-sm font-semibold text-slate-400">
                        Ученики не найдены.
                      </div>
                    )}

                  <div className="max-h-80 overflow-y-auto">
                    {headerResults.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openStudentClass(student)}
                        className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.06]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white">
                          {student.last_name[0]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold text-white">
                            {student.last_name} {student.first_name}{" "}
                            {student.middle_name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">
                            {student.grade}
                            {student.class_letter} класс
                            {isAdmin ? ` · ${student.email}` : ""}
                          </span>
                        </span>
                        <IoChevronForwardOutline className="h-4 w-4 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle compact />
              <button
                type="button"
                className="hidden h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-200 transition hover:bg-white/[0.1] sm:flex"
                title="Уведомления"
              >
                <IoNotificationsOutline className="h-5 w-5" />
              </button>

              <button
                onClick={logout}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1] sm:px-4"
              >
                <IoLogOutOutline className="h-5 w-5" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </div>
          </div>
        </header>

        {showFloatingAction && (
          <>
            <button
              onClick={() => {
                if (isUsersPage) {
                  window.dispatchEvent(new Event("open-create-user-modal"));
                  return;
                }
                setOpenCreateModal((prev) => !prev);
              }}
              aria-label={isUsersPage ? "Добавить пользователя" : "Добавить ученика"}
              className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-700 active:scale-95 sm:bottom-8 sm:right-8"
            >
              <IoAdd className="w-7 h-7" />
            </button>
            {isClassesSection && openCreateModal && (
              <CreateStudentModal
                form={form}
                setForm={setForm}
                setOpenCreateModal={setOpenCreateModal}
                addStudent={addStudent}
              />
            )}
          </>
        )}

        <AuthProvider value={{ user, isUserLoading, refreshMe }}>
          <Outlet />
        </AuthProvider>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<TableGrades />} />
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/parent" element={<ParentCabinetPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/grade/:grade" element={<GradePage />} />
              <Route path="/grade/:grade/:letter" element={<ClassPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
