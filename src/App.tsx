import { useEffect, useState } from "react";
import {
  IoAdd,
  IoLogOutOutline,
  IoPersonCircleOutline,
  IoPeopleOutline,
  IoSchoolOutline,
} from "react-icons/io5";
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router";
import { getMe, type AuthUser } from "./api/profile";
import { createStudents } from "./api/student";
import CreateStudentModal from "./components/CreateStudentModal";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastHost from "./components/ToastHost";
import { AuthProvider } from "./context/authContext";
import AuthPage from "./features/AuthPage";
import ClassPage from "./features/ClassPage";
import GradePage from "./features/GradePage";
import ProfilePage from "./features/ProfilePage";
import TableGrades from "./features/TableGrades";
import UsersPage from "./features/UsersPage";
import type { StudentForm } from "./types/student.type";
import { clearAccessToken } from "./utils/authToken";

const AppLayout = () => {
  const navigate = useNavigate();
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
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

  const addStudent = async () => {
    try {
      await createStudents({
        ...form,
        grade: Number(form.grade),
      });

      setOpenCreateModal(false);

      setForm({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        grade: "",
        class_letter: "",
      });
    } catch (err) {
      console.log(err);
    }
  };

  const logout = () => {
    clearAccessToken();
    navigate("/login", { replace: true });
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-transparent text-zinc-950">
      <ToastHost />
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:opacity-80"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <IoSchoolOutline className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold leading-5 text-zinc-950">
                School List
              </span>
              <span className="block text-xs font-medium text-zinc-500">
                Ученики и уведомления
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              disabled={isUserLoading || !user}
              className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 sm:px-3"
              title="Профиль"
            >
              <IoPersonCircleOutline className="h-6 w-6 text-cyan-700" />
              {isUserLoading ? (
                <span className="h-3 w-24 animate-pulse rounded-full bg-zinc-200" />
              ) : (
                <div className="hidden max-w-52 sm:block">
                  <div className="truncate text-sm font-semibold text-zinc-800">
                    {user?.last_name} {user?.first_name} {user?.middle_name}
                  </div>

                  {!isUserLoading && user?.school && (
                    <div className="truncate text-xs text-zinc-500">
                      {user.school.name}, {user.school.city}
                    </div>
                  )}
                </div>
              )}
            </button>

            {isAdmin && (
              <button
                onClick={() => navigate("/users")}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
              >
                <IoPeopleOutline className="h-5 w-5" />
                <span className="hidden sm:inline">Пользователи</span>
              </button>
            )}

            <button
              onClick={logout}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
            >
              <IoLogOutOutline className="h-5 w-5" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {isAdmin && (
        <>
          <button
            onClick={() => setOpenCreateModal((prev) => !prev)}
            aria-label="Добавить ученика"
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-900/20 transition hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-95 sm:bottom-8 sm:right-8"
          >
            <IoAdd className="w-7 h-7" />
          </button>
          {openCreateModal && (
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
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<TableGrades />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/grade/:grade" element={<GradePage />} />
            <Route path="/grade/:grade/:letter" element={<ClassPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
