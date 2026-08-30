import axios from "axios";
import { useEffect, useState } from "react";
import {
  IoArrowBackOutline,
  IoChatbubbleEllipsesOutline,
  IoCopyOutline,
  IoKeyOutline,
  IoPersonCircleOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router";
import {
  changePassword,
  getMaxLinkCode,
  updateMe,
  type MaxLinkCodeResponse,
  type UpdateMePayload,
} from "../api/profile";
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
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [maxLink, setMaxLink] = useState<MaxLinkCodeResponse | null>(null);
  const [isMaxLoading, setIsMaxLoading] = useState(false);
  const [form, setForm] = useState<UpdateMePayload>({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
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

  const handlePasswordChange = async () => {
    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      toastBus.error("Заполните все поля пароля.");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toastBus.error("Новый пароль должен быть не короче 8 символов.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toastBus.error("Новый пароль и подтверждение не совпадают.");
      return;
    }

    try {
      setIsPasswordSaving(true);
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setIsPasswordModalOpen(false);
      toastBus.success("Пароль изменён");
    } catch {
      toastBus.error("Не удалось изменить пароль. Проверьте текущий пароль.");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const closePasswordModal = () => {
    if (isPasswordSaving) return;
    setIsPasswordModalOpen(false);
    setPasswordForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  };

  const loadMaxLinkCode = async () => {
    try {
      setIsMaxLoading(true);
      setMaxLink(await getMaxLinkCode());
    } catch {
      toastBus.error("Не удалось получить код MAX.");
    } finally {
      setIsMaxLoading(false);
    }
  };

  const copyMaxCommand = async () => {
    if (!maxLink) return;
    await navigator.clipboard.writeText(`/start ${maxLink.code}`);
    toastBus.success("Команда скопирована");
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
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="text-sm font-medium text-zinc-600">
                      Пароль
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    >
                      <IoKeyOutline className="h-4 w-4" />
                      Изменить пароль
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {user.role === "parent" && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <IoChatbubbleEllipsesOutline className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-950">
                        Уведомления в MAX
                      </h2>
                      <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
                        Подключите бота MAX, чтобы получать сообщения о новых
                        замечаниях дополнительно к почте.
                      </p>
                    </div>
                  </div>
                  <span
                    className={[
                      "inline-flex h-9 items-center rounded-lg px-3 text-sm font-bold",
                      user.max_connected
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-600",
                    ].join(" ")}
                  >
                    {user.max_connected ? "Подключено" : "Не подключено"}
                  </span>
                </div>

                <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  {maxLink ? (
                    <div className="grid gap-3">
                      <div className="text-sm font-semibold text-zinc-600">
                        Отправьте боту MAX эту команду:
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="flex min-h-11 flex-1 items-center rounded-lg border border-zinc-200 bg-white px-3 font-mono text-sm font-bold text-zinc-950">
                          /start {maxLink.code}
                        </div>
                        <button
                          type="button"
                          onClick={copyMaxCommand}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                        >
                          <IoCopyOutline className="h-5 w-5" />
                          Скопировать
                        </button>
                      </div>
                      {maxLink.bot_username && (
                        <div className="text-sm font-medium text-zinc-500">
                          Бот: @{maxLink.bot_username}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-medium leading-6 text-zinc-500">
                        Получите код подключения и отправьте его боту MAX.
                      </div>
                      <button
                        type="button"
                        onClick={loadMaxLinkCode}
                        disabled={isMaxLoading}
                        className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isMaxLoading ? "Получаем..." : "Получить код"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4 py-6 backdrop-blur-sm"
          onClick={closePasswordModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
                  <IoKeyOutline className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-950">
                    Изменить пароль
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                    Минимальная длина нового пароля — 8 символов.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-5 py-4">
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                Текущий пароль
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      current_password: e.target.value,
                    }))
                  }
                  disabled={isPasswordSaving}
                  autoComplete="current-password"
                  className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-50"
                  autoFocus
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                Новый пароль
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      new_password: e.target.value,
                    }))
                  }
                  disabled={isPasswordSaving}
                  autoComplete="new-password"
                  className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-50"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                Повторите новый пароль
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirm_password: e.target.value,
                    }))
                  }
                  disabled={isPasswordSaving}
                  autoComplete="new-password"
                  className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-50"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={isPasswordSaving}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={isPasswordSaving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <IoKeyOutline className="h-5 w-5" />
                {isPasswordSaving ? "Сохраняем..." : "Изменить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProfilePage;
