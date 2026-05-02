import axios from "axios";
import { useEffect, useState } from "react";
import { IoArrowBackOutline, IoPersonCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router";
import { updateMe, type UpdateMePayload } from "../api/profile";
import { useAuth } from "../context/authContext";
import { formatRole } from "../utils/formatRole";
import { toastBus } from "../utils/toastBus";

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isUserLoading, refreshMe } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<UpdateMePayload>({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
  });

  const resetFormFromUser = () => {
    if (!user) return;
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name,
      email: user.email,
    });
  };

  useEffect(() => {
    if (!isUserLoading && user) {
      resetFormFromUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading, user?.id]);

  const startEditing = () => {
    resetFormFromUser();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    resetFormFromUser();
  };

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      await updateMe(form);
      await refreshMe();
      setIsEditing(false);
      toastBus.success("Профиль обновлён");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        toastBus.error("Ошибка валидации. Проверьте введённые данные.");
        return;
      }
      toastBus.error("Не удалось обновить профиль.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
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
              Профиль
            </p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-950 sm:text-4xl">
              Мой аккаунт
            </h1>
          </div>

          {!isUserLoading && user && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {!isEditing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
                >
                  Редактировать
                </button>
              )}

              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isSaving ? "Сохраняем..." : "Сохранить"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {isUserLoading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm font-medium text-zinc-500 shadow-sm">
            Загружаем профиль...
          </div>
        )}

        {!isUserLoading && !user && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            Не удалось загрузить данные пользователя.
          </div>
        )}

        {!isUserLoading && user && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-1">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <IoPersonCircleOutline className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-bold text-zinc-950">
                    {user.last_name} {user.first_name} {user.middle_name}
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-zinc-600">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Роль
                  </div>
                  <div className="mt-1 text-sm font-bold text-zinc-900">
                    {formatRole(user.role)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Школа
              </h2>

              {user.school ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Название
                    </div>
                    <div className="mt-1 text-sm font-bold text-zinc-900">
                      {user.school.name}
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Город
                    </div>
                    <div className="mt-1 text-sm font-bold text-zinc-900">
                      {user.school.city}
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Создано
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-800">
                      {formatDateTime(user.school.created_at)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-500">
                  Информация о школе отсутствует.
                </div>
              )}

              <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Данные аккаунта
              </h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
                <div className="divide-y divide-zinc-200">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="text-sm font-medium text-zinc-600">
                      Фамилия
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {isEditing ? (
                        <input
                          value={form.last_name}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              last_name: e.target.value,
                            }))
                          }
                          disabled={isSaving}
                          className="h-9 w-56 max-w-full rounded-lg border border-zinc-200 bg-white px-3 text-right text-sm font-semibold text-zinc-900 shadow-sm outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-50"
                        />
                      ) : (
                        user.last_name
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="text-sm font-medium text-zinc-600">Имя</div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {isEditing ? (
                        <input
                          value={form.first_name}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              first_name: e.target.value,
                            }))
                          }
                          disabled={isSaving}
                          className="h-9 w-56 max-w-full rounded-lg border border-zinc-200 bg-white px-3 text-right text-sm font-semibold text-zinc-900 shadow-sm outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-50"
                        />
                      ) : (
                        user.first_name
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="text-sm font-medium text-zinc-600">
                      Отчество
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {isEditing ? (
                        <input
                          value={form.middle_name}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              middle_name: e.target.value,
                            }))
                          }
                          disabled={isSaving}
                          className="h-9 w-56 max-w-full rounded-lg border border-zinc-200 bg-white px-3 text-right text-sm font-semibold text-zinc-900 shadow-sm outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-50"
                        />
                      ) : (
                        user.middle_name
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="text-sm font-medium text-zinc-600">
                      Email
                    </div>
                    <div className="break-all text-sm font-semibold text-zinc-900">
                      {isEditing ? (
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          disabled={isSaving}
                          className="h-9 w-72 max-w-full rounded-lg border border-zinc-200 bg-white px-3 text-right text-sm font-semibold text-zinc-900 shadow-sm outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-50"
                        />
                      ) : (
                        user.email
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </section>
  );
};

export default ProfilePage;
