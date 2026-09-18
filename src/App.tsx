import { useEffect, useRef, useState } from "react";
import {
  IoAdd,
  IoBarChartOutline,
  IoBookOutline,
  IoBusinessOutline,
  IoChevronForwardOutline,
  IoLogOutOutline,
  IoMenuOutline,
  IoNotificationsOutline,
  IoPersonCircleOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoSettingsOutline,
  IoCloseOutline,
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
import {
  getSystemUpdates,
  markSystemUpdatesRead,
  type SystemUpdate,
} from "./api/systemUpdates";
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
import { notifyDataChanged } from "./utils/dataRefresh";
import { formatRole } from "./utils/formatRole";

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
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdate[]>([]);
  const [unreadSystemUpdates, setUnreadSystemUpdates] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationsMounted, setIsNotificationsMounted] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const notificationAreaRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<StudentForm>({
    first_name: "",
    last_name: "",
    middle_name: "",
    grade: "",
    class_letter: "",
  });

  const refreshMe = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) setIsUserLoading(true);
      const data = await getMe();
      setUser(data);
    } catch {
      clearAccessToken();
      navigate("/login", { replace: true });
    } finally {
      if (!silent) setIsUserLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (isUserLoading || !user) return;

    let isActive = true;
    const refreshSystemUpdates = async () => {
      try {
        const data = await getSystemUpdates();
        if (!isActive) return;
        setSystemUpdates(data.items);
        setUnreadSystemUpdates(data.unread_count);
      } catch {
        // A notification check must not interrupt the user's current work.
      }
    };

    refreshSystemUpdates();
    const timer = window.setInterval(refreshSystemUpdates, 15_000);
    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, [isUserLoading, user?.id]);

  useEffect(() => {
    if (isNotificationsOpen) {
      setIsNotificationsMounted(true);
      const frame = window.requestAnimationFrame(() => {
        setIsNotificationsVisible(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    setIsNotificationsVisible(false);
    const timer = window.setTimeout(() => setIsNotificationsMounted(false), 160);
    return () => window.clearTimeout(timer);
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const closeOnOutsidePress = (event: MouseEvent | TouchEvent) => {
      if (!notificationAreaRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsNotificationsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsidePress);
    document.addEventListener("touchstart", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePress);
      document.removeEventListener("touchstart", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isNotificationsOpen]);

  const toggleNotifications = async () => {
    const willOpen = !isNotificationsOpen;
    setIsNotificationsOpen(willOpen);

    if (!willOpen || unreadSystemUpdates === 0) return;

    try {
      const data = await markSystemUpdatesRead();
      setSystemUpdates(data.items);
      setUnreadSystemUpdates(0);
    } catch {
      // The badge will be retried silently on the next background refresh.
    }
  };

  const formatUpdateDate = (value: string) =>
    new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));

  const addStudent = async () => {
    try {
      const created = await createStudents({
        ...form,
        grade: Number(form.grade),
      });

      notifyDataChanged();

      setForm({
        first_name: "",
        last_name: "",
        middle_name: "",
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
    location.pathname === "/" || /^\/grade\/[^/]+\/[^/]+$/.test(location.pathname);
  const showFloatingAction = isAdmin && (isUsersPage || isClassesSection);
  const navItems = isSuperadmin
    ? [
        { label: "Платформа", icon: IoBusinessOutline, path: "/platform" },
        { label: "Сводка", icon: IoBarChartOutline, path: "/dashboard" },
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
              { label: "Сводка", icon: IoBarChartOutline, path: "/dashboard" },
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
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileNavOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMobileNavOpen]);

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
                {formatRole(user?.role)}
              </span>
            </span>
            <IoChevronForwardOutline className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </aside>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню навигации">
          <button
            type="button"
            aria-label="Закрыть меню"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-[min(19rem,calc(100vw-3rem))] flex-col bg-[#071225] px-4 py-4 text-white shadow-2xl shadow-black/35">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 text-left"
              >
                <AppLogo className="h-11 w-11 shrink-0" />
                <span className="min-w-0 text-sm font-extrabold leading-5">
                  Школьный<br />контроль
                </span>
              </button>
              <button
                type="button"
                aria-label="Закрыть меню"
                onClick={() => setIsMobileNavOpen(false)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <IoCloseOutline className="h-6 w-6" />
              </button>
            </div>

            <nav className="mt-7 grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item.path);
                return (
                  <button
                    key={`mobile-${item.label}-${item.path}`}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={[
                      "flex h-12 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Тема</p>
              <ThemeToggle />
            </div>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="mt-auto flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-700 text-base font-extrabold">
                {user?.first_name?.[0] ?? "А"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">
                  {isUserLoading ? "Загрузка..." : `${user?.last_name ?? ""} ${user?.first_name ?? ""}`}
                </span>
                <span className="block truncate text-xs font-medium text-slate-400">{formatRole(user?.role)}</span>
              </span>
              <IoChevronForwardOutline className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-300 bg-white/95 text-slate-900 shadow-md shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-[#071225] dark:text-white dark:shadow-xl dark:shadow-slate-950/10">
          <div className="flex h-16 items-center justify-between gap-2 px-3 sm:h-20 sm:gap-3 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate("/")}
              className="hidden items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:opacity-85 sm:flex lg:hidden"
            >
              <span className="flex h-12 w-12 items-center justify-center">
                <AppLogo className="h-12 w-12" />
              </span>
              <span>
                <span className="block text-base font-extrabold leading-5 text-slate-950 dark:text-white">
                  Школьный контроль
                </span>
                <span className="block text-sm font-medium text-slate-600 dark:text-slate-400">
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
                    placeholder="Поиск ученика по ФИО"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-500 shadow-sm shadow-slate-200/70 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-400 dark:shadow-none dark:focus:bg-white/[0.1]"
                  />
                </label>

              {isHeaderSearchOpen && normalizedHeaderSearch.length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-950 shadow-2xl shadow-slate-400/30 dark:border-white/10 dark:bg-[#0f1b2d] dark:text-white dark:shadow-black/30">
                  <div className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-600 dark:border-white/10 dark:text-slate-400">
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
                      <div className="px-4 py-5 text-sm font-semibold text-slate-600 dark:text-slate-400">
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
                        className="flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.06]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white">
                          {student.last_name[0]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold text-slate-950 dark:text-white">
                            {student.last_name} {student.first_name}{" "}
                            {student.middle_name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {student.grade}
                            {student.class_letter} класс
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

            <div
              className={`flex items-center gap-2 sm:gap-3${isSuperadmin ? " ml-auto" : ""}`}
            >
              <button
                type="button"
                aria-label="Открыть меню"
                aria-expanded={isMobileNavOpen}
                onClick={() => setIsMobileNavOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm shadow-slate-200/70 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-none dark:hover:bg-white/[0.1] dark:hover:text-white sm:hidden"
              >
                <IoMenuOutline className="h-6 w-6" />
              </button>
              <div className="hidden sm:block">
                <ThemeToggle compact />
              </div>
              <div ref={notificationAreaRef} className="relative">
                <button
                  type="button"
                  onClick={toggleNotifications}
                  aria-expanded={isNotificationsOpen}
                  aria-label={
                    unreadSystemUpdates > 0
                      ? `Уведомления: ${unreadSystemUpdates} непрочитанных`
                      : "Уведомления"
                  }
                  className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm shadow-slate-200/70 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-none dark:hover:bg-white/[0.1] dark:hover:text-white"
                  title="Уведомления"
                >
                  <IoNotificationsOutline className="h-5 w-5" />
                  {unreadSystemUpdates > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#071225] bg-blue-500 px-1 text-[10px] font-extrabold text-white">
                      {unreadSystemUpdates > 9 ? "9+" : unreadSystemUpdates}
                    </span>
                  )}
                </button>

                {isNotificationsMounted && (
                  <div
                    aria-hidden={!isNotificationsVisible}
                    className={[
                      "absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-2xl shadow-slate-400/35 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-opacity dark:border-white/10 dark:bg-[#0f1b2d] dark:text-white dark:shadow-black/35",
                      isNotificationsVisible
                        ? "translate-y-0 scale-100 opacity-100"
                        : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0",
                    ].join(" ")}
                  >
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                      <div className="text-sm font-extrabold">Обновления системы</div>
                      <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                        Здесь появляются новые возможности и важные изменения.
                      </div>
                    </div>

                    {systemUpdates.length === 0 ? (
                      <div className="px-4 py-7 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Пока нет обновлений.
                      </div>
                    ) : (
                      <div className="max-h-[min(28rem,calc(100vh-8rem))] overflow-y-auto">
                        {systemUpdates.map((update) => (
                          <article
                            key={update.id}
                            className="border-b border-slate-200 px-4 py-4 last:border-b-0 dark:border-white/10"
                          >
                            <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                              {update.title}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-blue-300">
                              {formatUpdateDate(update.published_at)}
                            </div>
                            <p className="mt-2 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
                              {update.description}
                            </p>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={logout}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm shadow-slate-200/70 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:shadow-none dark:hover:bg-white/[0.1] dark:hover:text-white sm:px-4"
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
