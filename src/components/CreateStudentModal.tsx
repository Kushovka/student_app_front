import { motion } from "framer-motion";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import {
  IoAddOutline,
  IoCheckmarkCircleOutline,
  IoClose,
  IoCopyOutline,
  IoPersonAddOutline,
  IoSearchOutline,
} from "react-icons/io5";
import {
  attachParentToStudent,
  getClassOptions,
  type ClassOption,
} from "../api/student";
import { createSchoolUser, getUsers, type UserListItem } from "../api/users";
import type { StudentForm, StudentResponce } from "../types/student.type";
import { toastBus } from "../utils/toastBus";
import { notifyDataChanged } from "../utils/dataRefresh";

interface Props {
  form: StudentForm;
  setForm: Dispatch<SetStateAction<StudentForm>>;
  setOpenCreateModal: (v: boolean) => void;
  addStudent: () => Promise<StudentResponce>;
}

const emptyParentForm = {
  first_name: "",
  last_name: "",
  middle_name: "",
  login: "",
  relationship: "Родитель",
};

const generatePassword = () => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = new Uint32Array(16);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => chars[value % chars.length]).join("");
};

const CreateStudentModal = ({
  form,
  setOpenCreateModal,
  setForm,
  addStudent,
}: Props) => {
  const [parents, setParents] = useState<UserListItem[]>([]);
  const [parentSearch, setParentSearch] = useState("");
  const [selectedParent, setSelectedParent] = useState<UserListItem | null>(null);
  const [newParentForm, setNewParentForm] = useState(emptyParentForm);
  const [isCreatingParent, setIsCreatingParent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [createdCredentials, setCreatedCredentials] = useState<{
    login: string;
    password: string;
  } | null>(null);
  const gradeOptions = useMemo(
    () => [...new Set(classes.map((item) => item.grade))].sort((a, b) => a - b),
    [classes],
  );
  const classLetterOptions = useMemo(
    () =>
      classes
        .filter((item) => item.grade === Number(form.grade))
        .map((item) => item.class_letter)
        .sort(),
    [classes, form.grade],
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [users, classOptions] = await Promise.all([
          getUsers(),
          getClassOptions(),
        ]);
        setParents(users.filter((user) => user.role === "parent"));
        setClasses(classOptions.classes);
      } catch {
        setParents([]);
        setClasses([]);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!form.class_letter || classLetterOptions.includes(form.class_letter)) {
      return;
    }
    updateField("class_letter", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classLetterOptions, form.class_letter]);

  useEffect(() => {
    if (!form.grade || gradeOptions.includes(Number(form.grade))) return;
    setForm((prev) => ({ ...prev, grade: "", class_letter: "" }));
  }, [form.grade, gradeOptions, setForm]);

  const filteredParents = useMemo(() => {
    const query = parentSearch.trim().toLowerCase();
    if (!query) return parents.slice(0, 8);

    return parents
      .filter((parent) =>
        [
          parent.last_name,
          parent.first_name,
          parent.middle_name,
          parent.login,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 20);
  }, [parentSearch, parents]);

  const updateField = (field: keyof StudentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeModal = () => {
    if (isSaving) return;
    setOpenCreateModal(false);
  };

  const resetStudentForm = () => {
    setForm({
      first_name: "",
      last_name: "",
      middle_name: "",
      grade: "",
      class_letter: "",
    });
  };

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastBus.success(`${label} скопирован`);
    } catch {
      toastBus.error("Не удалось скопировать.");
    }
  };

  const validateStudent = () => {
    if (
      !form.last_name.trim() ||
      !form.first_name.trim() ||
      !form.middle_name.trim() ||
      !form.grade ||
      !form.class_letter ||
      !classLetterOptions.includes(form.class_letter)
    ) {
      toastBus.error("Заполните данные ученика.");
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validateStudent()) return;

    if (isCreatingParent) {
      if (
        !newParentForm.last_name.trim() ||
        !newParentForm.first_name.trim() ||
        !newParentForm.login.trim()
      ) {
      toastBus.error("Заполните фамилию, имя и логин родителя.");
        return;
      }
    }

    try {
      setIsSaving(true);
      let parent = selectedParent;
      let generatedPassword = "";

      if (isCreatingParent) {
        generatedPassword = generatePassword();
        parent = await createSchoolUser({
          first_name: newParentForm.first_name.trim(),
          last_name: newParentForm.last_name.trim(),
          middle_name: newParentForm.middle_name.trim(),
          login: newParentForm.login.trim(),
          password: generatedPassword,
          role: "parent",
        });
      }

      const student = await addStudent();

      if (parent) {
        await attachParentToStudent(
          student.id,
          parent.id,
          isCreatingParent
            ? newParentForm.relationship.trim() || "Родитель"
            : "Родитель",
        );
      }

      notifyDataChanged();

      if (isCreatingParent && parent) {
        setCreatedCredentials({
          login: parent.login,
          password: generatedPassword,
        });
        resetStudentForm();
        return;
      }

      toastBus.success(parent ? "Ученик создан и родитель привязан" : "Ученик создан");
      resetStudentForm();
      setOpenCreateModal(false);
    } catch {
      toastBus.error("Не удалось создать ученика.");
    } finally {
      setIsSaving(false);
    }
  };

  if (createdCredentials) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl shadow-slate-950/20"
        >
          <div className="border-b border-slate-200 px-5 py-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <IoCheckmarkCircleOutline className="h-9 w-9" />
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-950">
              Ученик и родитель созданы
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Скопируйте доступы и отправьте родителю. После закрытия пароль
              больше нельзя будет посмотреть.
            </p>
          </div>
          <div className="grid gap-3 p-5">
            {[
              ["Логин", createdCredentials.login],
              ["Пароль", createdCredentials.password],
            ].map(([label, value]) => (
              <label key={label} className="grid gap-2 text-sm font-bold text-slate-600">
                {label}
                <span className="relative block">
                  <input readOnly value={value} className="field w-full pr-12" />
                  <button
                    type="button"
                    onClick={() => copyValue(value, label)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
                  >
                    <IoCopyOutline className="h-5 w-5" />
                  </button>
                </span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setOpenCreateModal(false)}
              className="button-primary mt-2 w-full"
            >
              Готово
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl shadow-slate-950/20"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <IoPersonAddOutline className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                Новый ученик
              </h2>
              <p className="mt-1 text-base text-slate-500">
                Заполните данные ученика и при необходимости привяжите родителя.
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            aria-label="Закрыть"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-13rem)] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["last_name", "Фамилия", "Иванов"],
              ["first_name", "Имя", "Иван"],
              ["middle_name", "Отчество", "Иванович"],
            ].map(([field, label, placeholder]) => (
              <label
                key={field}
                className="grid gap-2 text-base font-bold text-slate-700"
              >
                {label}
                <input
                  type="text"
                  value={form[field as keyof StudentForm]}
                  onChange={(e) =>
                    updateField(field as keyof StudentForm, e.target.value)
                  }
                  placeholder={placeholder}
                  className="field"
                />
              </label>
            ))}

            <label className="grid gap-2 text-base font-bold text-slate-700">
              Класс
              <select
                value={form.grade}
                onChange={(e) => {
                  updateField("grade", e.target.value);
                  updateField("class_letter", "");
                }}
                className="field"
              >
                <option value="">
                  {gradeOptions.length ? "Выберите класс" : "Сначала создайте класс"}
                </option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-base font-bold text-slate-700">
              Буква
              <select
                value={form.class_letter}
                onChange={(e) => updateField("class_letter", e.target.value)}
                disabled={!form.grade}
                className="field"
              >
                <option value="">
                  Выберите букву
                </option>
                {classLetterOptions.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-950">
                  Родитель
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Можно пропустить и привязать позже в карточке ученика.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingParent(false);
                    setSelectedParent(null);
                  }}
                  className={[
                    "button-secondary h-11 px-3 text-sm",
                    !isCreatingParent && !selectedParent ? "border-blue-500" : "",
                  ].join(" ")}
                >
                  Пропустить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingParent(true);
                    setSelectedParent(null);
                  }}
                  className={[
                    "button-secondary h-11 px-3 text-sm",
                    isCreatingParent ? "border-blue-500" : "",
                  ].join(" ")}
                >
                  <IoAddOutline className="h-5 w-5" />
                  Новый
                </button>
              </div>
            </div>

            {!isCreatingParent && (
              <div className="mt-4">
                {selectedParent ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-white px-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-slate-950">
                        {selectedParent.last_name} {selectedParent.first_name}{" "}
                        {selectedParent.middle_name}
                      </div>
                      <div className="mt-1 truncate text-sm font-medium text-slate-500">
                        {selectedParent.login}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedParent(null)}
                      className="text-sm font-bold text-blue-700"
                    >
                      Сменить
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="relative block">
                      <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={parentSearch}
                        onChange={(e) => setParentSearch(e.target.value)}
                        placeholder="Найти существующего родителя"
                        className="field w-full pl-10"
                      />
                    </label>
                    <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
                      {filteredParents.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-center text-sm font-semibold text-slate-500">
                          Родители не найдены
                        </div>
                      ) : (
                        filteredParents.map((parent) => (
                          <button
                            key={parent.id}
                            type="button"
                            onClick={() => setSelectedParent(parent)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-400"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-extrabold text-slate-950">
                                {parent.last_name} {parent.first_name}{" "}
                                {parent.middle_name}
                              </span>
                              <span className="mt-1 block truncate text-sm font-medium text-slate-500">
                                {parent.login}
                              </span>
                            </span>
                            <IoAddOutline className="h-5 w-5 shrink-0 text-blue-700" />
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {isCreatingParent && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["last_name", "Фамилия"],
                  ["first_name", "Имя"],
                  ["middle_name", "Отчество"],
                  ["login", "Логин"],
                  ["relationship", "Кем приходится"],
                ].map(([field, label]) => (
                  <input
                    key={field}
                    value={newParentForm[field as keyof typeof newParentForm]}
                    onChange={(e) =>
                      setNewParentForm((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    placeholder={label}
                    className={[
                      "field w-full",
                      field === "relationship" ? "sm:col-span-2" : "",
                    ].join(" ")}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button onClick={closeModal} type="button" className="button-secondary">
            Отмена
          </button>
          <button
            onClick={submit}
            type="button"
            disabled={isSaving}
            className="button-primary"
          >
            {isSaving ? "Создаем..." : "Добавить ученика"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateStudentModal;
