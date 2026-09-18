import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  IoAddOutline,
  IoCheckmarkCircleOutline,
  IoClose,
  IoCopyOutline,
  IoCreateOutline,
  IoImageOutline,
  IoSaveOutline,
  IoSearchOutline,
  IoTrashOutline,
  IoPersonCircleOutline,
  IoTimeOutline,
} from "react-icons/io5";
import {
  addBehavior,
  attachParentToStudent,
  deleteStudent,
  detachParentFromStudent,
  getAvailableParents,
  getBehaviorHistory,
  getClassOptions,
  getStudentClassTeacher,
  getStudentById,
  getStudentParents,
  updateStudent,
  type ParentStudentLink,
} from "../api/student";
import {
  createSchoolUser,
  getMyTeacherAssignments,
  type TeacherAssignment,
  type UserListItem,
} from "../api/users";
import { api } from "../api/client";
import type { BehaviorRecord } from "../types/behavior.types";
import type { HomeroomTeacher, StudentResponce } from "../types/student.type";
import { useAuth } from "../context/authContext";
import { gradeOptions, sortClassLetters } from "../utils/classOptions";
import { toastBus } from "../utils/toastBus";
import { notifyDataChanged } from "../utils/dataRefresh";

interface Props {
  studentId: string;
  onClose: () => void;
  onChanged?: () => void;
}

const subjects = [
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
const CLASS_HOUR_SUBJECT = "Классный час";

const reasons = [
  "Невыполнение требований учителя",
  "Нарушение тишины и помехи классу",
  "Нарушение правил техники безопасности",
  "Использование гаджета без разрешения учителя",
  "Некорректные высказывания",
  "Мелкая порча имущества",
  "Опоздание на урок",
  "Не готов к уроку",
];

const getUploadUrl = (path: string) => {
  if (path.startsWith("http")) return path;

  return `${api.defaults.baseURL ?? ""}${path}`;
};

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

const StudentModal = ({ studentId, onClose, onChanged }: Props) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [student, setStudent] = useState<StudentResponce | null>(null);
  const canManageParents = isAdmin || (
    user?.is_class_teacher &&
    student?.grade === user.homeroom_grade &&
    student?.class_letter === user.homeroom_class_letter
  );
  const [classTeacher, setClassTeacher] = useState<HomeroomTeacher | null>(null);
  const [subject, setSubject] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BehaviorRecord[]>([]);
  const [parentLinks, setParentLinks] = useState<ParentStudentLink[]>([]);
  const [availableParents, setAvailableParents] = useState<UserListItem[]>([]);
  const [parentSearch, setParentSearch] = useState("");
  const [parentRelationship, setParentRelationship] = useState("Родитель");
  const [newParentForm, setNewParentForm] = useState(emptyParentForm);
  const [isCreateParentModalOpen, setIsCreateParentModalOpen] = useState(false);
  const [isAttachParentModalOpen, setIsAttachParentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [createdParentCredentials, setCreatedParentCredentials] = useState<{
    login: string;
    password: string;
  } | null>(null);
  const [isParentActionLoading, setIsParentActionLoading] = useState(false);
  const [brokenPhotoIds, setBrokenPhotoIds] = useState<Set<string>>(new Set());
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>(
    [],
  );
  const [isStudentLoading, setIsStudentLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [isDeleteStudentDialogOpen, setIsDeleteStudentDialogOpen] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    grade: "",
    class_letter: "",
  });
  const [schoolLetters, setSchoolLetters] = useState<string[]>([]);
  const canCreateBehavior = ["admin", "teacher"].includes(user?.role ?? "");

  const availableSubjects = useMemo(() => {
    if (user?.role !== "teacher" || !student) return subjects;
    const assignedSubjects = Array.from(
      new Set(
        teacherAssignments
          .filter(
            (assignment) =>
              assignment.grade === student.grade &&
              assignment.class_letter === student.class_letter,
          )
          .map((assignment) => assignment.subject),
      ),
    ).sort((a, b) => a.localeCompare(b));
    const isOwnHomeroom = user.is_class_teacher
      && user.homeroom_grade === student.grade
      && user.homeroom_class_letter === student.class_letter;

    return isOwnHomeroom
      ? [CLASS_HOUR_SUBJECT, ...assignedSubjects.filter((item) => item !== CLASS_HOUR_SUBJECT)]
      : assignedSubjects;
  }, [student, teacherAssignments, user?.homeroom_class_letter, user?.homeroom_grade, user?.is_class_teacher, user?.role]);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setIsStudentLoading(true);
        const [studentData, historyData, classOptions, homeroomTeacher] = await Promise.all([
          getStudentById(studentId),
          getBehaviorHistory(studentId),
          getClassOptions(),
          ["admin", "teacher"].includes(user?.role ?? "")
            ? getStudentClassTeacher(studentId)
            : Promise.resolve(null),
        ]);
        const canManageStudentParents = isAdmin || (
          user?.is_class_teacher &&
          studentData.grade === user.homeroom_grade &&
          studentData.class_letter === user.homeroom_class_letter
        );
        const parentData = canManageStudentParents
          ? await getStudentParents(studentId)
          : [];

        const letters = sortClassLetters(classOptions.letters);
        setStudent(studentData);
        setSchoolLetters(
          letters.includes(studentData.class_letter)
            ? letters
            : sortClassLetters([...letters, studentData.class_letter]),
        );
        setEditForm({
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          middle_name: studentData.middle_name,
          grade: String(studentData.grade),
          class_letter: studentData.class_letter,
        });
        setHistory(historyData);
        setParentLinks(parentData);
        setClassTeacher(homeroomTeacher);
      } catch {
        toastBus.error("Не удалось загрузить карточку ученика.");
      } finally {
        setIsStudentLoading(false);
      }
    };

    fetchStudent();
  }, [isAdmin, studentId, user?.homeroom_class_letter, user?.homeroom_grade, user?.is_class_teacher, user?.role]);

  useEffect(() => {
    if (user?.role !== "teacher") {
      setTeacherAssignments([]);
      return;
    }

    const loadAssignments = async () => {
      try {
        setTeacherAssignments(await getMyTeacherAssignments());
      } catch {
        setTeacherAssignments([]);
      }
    };

    loadAssignments();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === "teacher") {
      if (availableSubjects.length === 0) {
        if (subject) setSubject("");
        return;
      }

      if (!subject || !availableSubjects.includes(subject)) {
        setSubject(availableSubjects[0]);
      }
      return;
    }

    if (subject && !availableSubjects.includes(subject)) {
      setSubject("");
    }
  }, [availableSubjects, subject, user?.role]);

  useEffect(() => {
    if (!canManageParents || !student || !isAttachParentModalOpen) return;

    const timer = window.setTimeout(async () => {
      try {
        const data = await getAvailableParents(student.id, parentSearch);
        setAvailableParents(data);
      } catch {
        setAvailableParents([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [canManageParents, isAttachParentModalOpen, parentSearch, student]);

  const handleSend = async () => {
    if (!student || selectedReasons.length === 0 || !subject) return;

    try {
      setLoading(true);

      await addBehavior(student.id, {
        subject,
        reasons: selectedReasons,
        comment: comment || undefined,
        photo,
      });

      const updatedHistory = await getBehaviorHistory(student.id);
      setHistory(updatedHistory);
      notifyDataChanged();
      toastBus.success("Замечание сохранено");
      setSubject("");
      setSelectedReasons([]);
      setComment("");
      setPhoto(null);
    } catch {
      toastBus.error("Ошибка сохранения замечания.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudent = async () => {
    if (!student) return;

    try {
      setIsSavingStudent(true);
      const updated = await updateStudent(student.id, {
        ...editForm,
        grade: Number(editForm.grade),
      });
      setStudent(updated);
      setEditForm({
        first_name: updated.first_name,
        last_name: updated.last_name,
        middle_name: updated.middle_name,
        grade: String(updated.grade),
        class_letter: updated.class_letter,
      });
      setIsEditing(false);
      onChanged?.();
      notifyDataChanged();
      toastBus.success("Ученик обновлён");
    } catch {
      toastBus.error("Не удалось обновить ученика.");
    } finally {
      setIsSavingStudent(false);
    }
  };

  const runConfirmedStudentDeletion = async () => {
    if (!student) return;

    try {
      setIsDeletingStudent(true);
      await deleteStudent(student.id);
      toastBus.success("Ученик удалён");
      onChanged?.();
      notifyDataChanged();
      onClose();
    } catch {
      toastBus.error("Не удалось удалить ученика.");
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const refreshParents = async () => {
    if (!student) return;
    const [links, available] = await Promise.all([
      getStudentParents(student.id),
      getAvailableParents(student.id, parentSearch),
    ]);
    setParentLinks(links);
    setAvailableParents(available);
  };

  const handleAttachParent = async (parentId: string) => {
    if (!student) return;
    try {
      setIsParentActionLoading(true);
      await attachParentToStudent(student.id, parentId, parentRelationship);
      await refreshParents();
      notifyDataChanged();
      setParentRelationship("Родитель");
      setParentSearch("");
      setIsAttachParentModalOpen(false);
      toastBus.success("Родитель привязан");
    } catch {
      toastBus.error("Не удалось привязать родителя.");
    } finally {
      setIsParentActionLoading(false);
    }
  };

  const handleDetachParent = async (parentId: string) => {
    if (!student) return;
    try {
      setIsParentActionLoading(true);
      await detachParentFromStudent(student.id, parentId);
      await refreshParents();
      notifyDataChanged();
      toastBus.success("Родитель отвязан");
    } catch {
      toastBus.error("Не удалось отвязать родителя.");
    } finally {
      setIsParentActionLoading(false);
    }
  };

  const handleCreateAndAttachParent = async () => {
    if (!student) return;
    if (
      !newParentForm.first_name.trim() ||
      !newParentForm.last_name.trim() ||
      !newParentForm.login.trim()
    ) {
      toastBus.error("Заполните имя, фамилию и логин родителя.");
      return;
    }

    const password = generatePassword();

    try {
      setIsParentActionLoading(true);
      const parent = await createSchoolUser({
        first_name: newParentForm.first_name.trim(),
        last_name: newParentForm.last_name.trim(),
        middle_name: newParentForm.middle_name.trim(),
        login: newParentForm.login.trim(),
        password,
        role: "parent",
      });
      await attachParentToStudent(
        student.id,
        parent.id,
        newParentForm.relationship.trim() || "Родитель",
      );
      await refreshParents();
      notifyDataChanged();
      setCreatedParentCredentials({
        login: parent.login,
        password,
      });
      setNewParentForm(emptyParentForm);
    } catch {
      toastBus.error("Не удалось создать и привязать родителя.");
    } finally {
      setIsParentActionLoading(false);
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

  const closeCreateParentModal = () => {
    if (isParentActionLoading) return;
    setIsCreateParentModalOpen(false);
    setCreatedParentCredentials(null);
    setNewParentForm(emptyParentForm);
  };

  const openAttachParentModal = () => {
    setParentSearch("");
    setParentRelationship("Родитель");
    setAvailableParents([]);
    setIsAttachParentModalOpen(true);
  };

  const closeAttachParentModal = () => {
    if (isParentActionLoading) return;
    setIsAttachParentModalOpen(false);
    setParentSearch("");
    setParentRelationship("Родитель");
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl shadow-slate-950/20"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <IoPersonCircleOutline className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                {student
                  ? `${student.last_name} ${student.first_name}`
                  : "Карточка ученика"}
              </h2>
              <p className="mt-1 text-base text-slate-500">
                {student
                  ? `${student.grade}${student.class_letter} класс`
                  : "Загружаем данные..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>

        {isStudentLoading ? (
          <div className="p-8 text-center text-base font-medium text-slate-500">
            Загружаем карточку...
          </div>
        ) : (
          <div
            className={[
              "grid max-h-[calc(100vh-9rem)] overflow-y-auto",
              canCreateBehavior ? "lg:grid-cols-[0.95fr_1.05fr]" : "",
            ].join(" ")}
          >
            <div className="border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                    Данные ученика
                  </p>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={handleSaveStudent}
                          disabled={isSavingStudent}
                          className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-700 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                          title="Сохранить"
                        >
                          <IoSaveOutline className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          disabled={isSavingStudent}
                          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                          title="Редактировать"
                        >
                          <IoCreateOutline className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsDeleteStudentDialogOpen(true)}
                        disabled={isSavingStudent || isDeletingStudent}
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Удалить"
                      >
                        <IoTrashOutline className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {isEditing ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        ["last_name", "Фамилия"],
                        ["first_name", "Имя"],
                        ["middle_name", "Отчество"],
                      ].map(([field, label]) => (
                        <label
                          key={field}
                          className="grid gap-2 text-sm font-bold text-slate-600"
                        >
                          {label}
                          <input
                            value={editForm[field as keyof typeof editForm]}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                [field]: event.target.value,
                              }))
                            }
                            type="text"
                            className="field"
                          />
                        </label>
                      ))}
                      <label className="grid gap-2 text-sm font-bold text-slate-600">
                        Класс
                        <select
                          value={editForm.grade}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              grade: event.target.value,
                            }))
                          }
                          className="field"
                        >
                          {gradeOptions.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-bold text-slate-600">
                        Буква
                        <select
                          value={editForm.class_letter}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              class_letter: event.target.value,
                            }))
                          }
                          className="field"
                          disabled={schoolLetters.length === 0}
                        >
                          {schoolLetters.map((letter) => (
                            <option key={letter} value={letter}>
                              {letter}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-bold text-slate-500">ФИО</p>
                        <p className="mt-1 text-lg font-extrabold text-slate-950">
                          {student?.last_name} {student?.first_name}{" "}
                          {student?.middle_name}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {["admin", "teacher"].includes(user?.role ?? "") && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                    Классный руководитель
                  </p>
                  {classTeacher ? (
                    <p className="mt-2 text-base font-extrabold text-slate-950">
                      {classTeacher.last_name} {classTeacher.first_name}{" "}
                      {classTeacher.middle_name}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Пока не назначен
                    </p>
                  )}
                </div>
              )}

              {canManageParents && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                      Родители
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Явная привязка родителя к ученику
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">
                    {parentLinks.length}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {parentLinks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm font-semibold text-slate-500">
                      Родители пока не привязаны
                    </div>
                  ) : (
                    parentLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-950">
                            {link.parent.last_name} {link.parent.first_name}{" "}
                            {link.parent.middle_name}
                          </p>
                          <p className="mt-1 truncate text-sm font-medium text-slate-500">
                            {link.parent.login}
                            {link.relationship ? ` · ${link.relationship}` : ""}
                          </p>
                        </div>
                        {canManageParents && (
                          <button
                            type="button"
                            onClick={() => handleDetachParent(link.parent_id)}
                            disabled={isParentActionLoading}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Отвязать родителя"
                          >
                            <IoTrashOutline className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {canManageParents && (
                  <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={openAttachParentModal}
                      disabled={isParentActionLoading}
                      className="button-secondary h-12 w-full px-3 text-sm"
                    >
                      <IoSearchOutline className="h-5 w-5" />
                      Привязать
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedParentCredentials(null);
                        setIsCreateParentModalOpen(true);
                      }}
                      disabled={isParentActionLoading}
                      className="button-secondary h-12 w-full px-3 text-sm"
                    >
                      <IoAddOutline className="h-5 w-5" />
                      Создать
                    </button>
                  </div>
                )}
                </div>
              )}

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-950">
                    История замечаний
                  </h3>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">
                    {history.length}
                  </span>
                </div>

                {history.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-base font-medium text-slate-500">
                    Пока нет замечаний
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-slate-950">
                            {item.subject}
                          </p>
                          <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-slate-400">
                            <IoTimeOutline className="h-4 w-4" />
                            {new Date(item.created_at).toLocaleDateString(
                              "ru-RU",
                            )}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                            {item.reasons[0]}
                          </span>
                          {item.reasons.length > 1 && (
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-500">
                              +{item.reasons.length - 1}
                            </span>
                          )}
                        </div>
                        {item.comment && (
                          <p className="mt-3 line-clamp-2 text-base leading-7 text-slate-600">
                            {item.comment}
                          </p>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="button-secondary w-full"
                    >
                      Открыть всю историю
                    </button>
                  </div>
                )}
              </div>
            </div>

            {canCreateBehavior && (
            <div className="p-5 sm:p-6">
              <div className="mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <h3 className="text-lg font-extrabold text-slate-950">
                      Зафиксировать замечание
                    </h3>
                  </div>
                  <p className="mt-1 text-base text-slate-500">
                    Выберите причину.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <label className="grid gap-2 text-base font-bold text-slate-700">
                  Урок
                  {user?.role === "teacher" ? (
                    <>
                      <input
                        readOnly
                        value={subject || "Не назначен"}
                        className="field cursor-default bg-slate-100 text-slate-700"
                      />
                      {availableSubjects.length === 0 && (
                        <span className="text-sm font-medium text-red-500">
                          Для этого класса вам не назначен предмет.
                        </span>
                      )}
                    </>
                  ) : (
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="field"
                    >
                      <option value="">Выберите предмет</option>
                      {availableSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                <div>
                  <p className="mb-2 text-base font-bold text-slate-700">
                    Причина
                  </p>
                  <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                    {reasons.map((reason) => (
                      <label
                        key={reason}
                        className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-base font-semibold text-slate-700 transition hover:border-blue-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedReasons.includes(reason)}
                          onChange={() => {
                            setSelectedReasons((prev) =>
                              prev.includes(reason)
                                ? prev.filter((item) => item !== reason)
                                : [...prev, reason],
                            );
                          }}
                          className="h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="grid gap-2 text-base font-bold text-slate-700">
                  Комментарий
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 150))}
                    maxLength={150}
                    placeholder="Дополнительные детали для родителя"
                    className="min-h-28 resize-none rounded-lg border border-slate-300 px-3 py-3 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <span className="text-sm font-medium text-slate-400">
                    {comment.length}/150
                  </span>
                </label>

                <label className="grid cursor-pointer gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-base font-bold text-slate-700 transition hover:border-blue-400">
                  <span className="flex items-center gap-2">
                    <IoImageOutline className="h-5 w-5" />
                    Фото к замечанию
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    {photo ? photo.name : "JPG, PNG или WEBP, необязательно"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      setPhoto(event.target.files?.[0] ?? null)
                    }
                  />
                </label>

                <button
                  disabled={!subject || selectedReasons.length === 0 || loading}
                  onClick={handleSend}
                  className="button-primary w-full"
                >
                  {loading ? "Сохраняем..." : "Сохранить замечание"}
                </button>
              </div>
            </div>
            )}
          </div>
        )}
      </motion.div>

      {isAttachParentModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={closeAttachParentModal}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/30"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                  Привязка родителя
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-slate-950">
                  Найти существующего родителя
                </h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Список ограничен по высоте, поэтому даже десятки родителей не
                  растянут карточку ученика.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAttachParentModal}
                disabled={isParentActionLoading}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Закрыть"
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-[1fr_13rem]">
              <label className="grid gap-2 text-sm font-bold text-slate-600">
                Поиск
                <span className="relative">
                  <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={parentSearch}
                    onChange={(event) => setParentSearch(event.target.value)}
                    placeholder="ФИО или логин"
                    className="field w-full pl-10"
                    autoFocus
                  />
                </span>
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-600">
                Кем приходится
                <input
                  value={parentRelationship}
                  onChange={(event) => setParentRelationship(event.target.value)}
                  placeholder="Мама, папа, опекун"
                  className="field w-full"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {availableParents.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
                  <IoSearchOutline className="h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-base font-extrabold text-slate-950">
                    Родители не найдены
                  </p>
                  <p className="mt-1 max-w-md text-sm font-medium leading-6 text-slate-500">
                    Попробуйте изменить запрос или создайте нового родителя.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {availableParents.map((parent) => (
                    <button
                      key={parent.id}
                      type="button"
                      onClick={() => handleAttachParent(parent.id)}
                      disabled={isParentActionLoading}
                      className="flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-base font-extrabold text-slate-950">
                          {parent.last_name} {parent.first_name}{" "}
                          {parent.middle_name}
                        </span>
                        <span className="mt-1 block truncate text-sm font-medium text-slate-500">
                          {parent.login}
                        </span>
                      </span>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <IoAddOutline className="h-5 w-5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setCreatedParentCredentials(null);
                  setIsCreateParentModalOpen(true);
                  setIsAttachParentModalOpen(false);
                }}
                className="button-secondary"
              >
                <IoAddOutline className="h-5 w-5" />
                Создать нового родителя
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isHistoryModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => setIsHistoryModalOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/30"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                  История замечаний
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-slate-950">
                  {student?.last_name} {student?.first_name}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Всего записей: {history.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Закрыть"
              >
                <IoClose className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-lg font-extrabold text-slate-950">
                        {item.subject}
                      </p>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-slate-400">
                        <IoTimeOutline className="h-4 w-4" />
                        {new Date(item.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.reasons.map((reason) => (
                        <span
                          key={reason}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                    {item.comment && (
                      <p className="mt-3 text-base leading-7 text-slate-600">
                        {item.comment}
                      </p>
                    )}
                    {item.photo_url && !brokenPhotoIds.has(item.id) && (
                      <a
                        href={getUploadUrl(item.photo_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 block overflow-hidden rounded-lg border border-slate-200"
                      >
                        <img
                          src={getUploadUrl(item.photo_url)}
                          alt="Фото к замечанию"
                          onError={() =>
                            setBrokenPhotoIds((prev) => {
                              const next = new Set(prev);
                              next.add(item.id);
                              return next;
                            })
                          }
                          className="max-h-80 w-full object-cover"
                        />
                      </a>
                    )}
                    {item.photo_url && brokenPhotoIds.has(item.id) && (
                      <div className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500">
                        Фото было прикреплено, но файл недоступен.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isCreateParentModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={closeCreateParentModal}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/30"
          >
            {!createdParentCredentials ? (
              <>
                <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                      Новый родитель
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold text-slate-950">
                      Создать и привязать
                    </h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                      Пароль будет создан автоматически после сохранения.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateParentModal}
                    disabled={isParentActionLoading}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Закрыть"
                  >
                    <IoClose className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  {[
                    ["last_name", "Фамилия"],
                    ["first_name", "Имя"],
                    ["middle_name", "Отчество"],
                    ["login", "Логин"],
                    ["relationship", "Кем приходится"],
                  ].map(([field, label]) => (
                    <label
                      key={field}
                      className={[
                        "grid gap-2 text-sm font-bold text-slate-600",
                        field === "relationship" ? "sm:col-span-2" : "",
                      ].join(" ")}
                    >
                      {label}
                      <input
                        value={
                          newParentForm[field as keyof typeof newParentForm]
                        }
                        onChange={(event) =>
                          setNewParentForm((prev) => ({
                            ...prev,
                            [field]: event.target.value,
                          }))
                        }
                        placeholder={label}
                        className="field w-full"
                      />
                    </label>
                  ))}

                  <button
                    type="button"
                    onClick={handleCreateAndAttachParent}
                    disabled={isParentActionLoading}
                    className="button-primary sm:col-span-2"
                  >
                    <IoAddOutline className="h-5 w-5" />
                    {isParentActionLoading
                      ? "Создаем..."
                      : "Создать и привязать"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="border-b border-slate-200 px-5 py-5 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <IoCheckmarkCircleOutline className="h-9 w-9" />
                  </div>
                  <h3 className="mt-3 text-2xl font-extrabold text-slate-950">
                    Родитель создан
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    Скопируйте логин и пароль и передайте родителю. После
                    закрытия этого окна пароль больше нельзя будет посмотреть.
                  </p>
                </div>

                <div className="grid gap-3 p-5">
                  {[
                    ["Логин", createdParentCredentials.login],
                    ["Пароль", createdParentCredentials.password],
                  ].map(([label, value]) => (
                    <label
                      key={label}
                      className="grid gap-2 text-sm font-bold text-slate-600"
                    >
                      {label}
                      <span className="relative block">
                        <input
                          readOnly
                          value={value}
                          className="field w-full pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => copyValue(value, label)}
                          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
                          title={`Скопировать ${label.toLowerCase()}`}
                        >
                          <IoCopyOutline className="h-5 w-5" />
                        </button>
                      </span>
                    </label>
                  ))}

                  <button
                    type="button"
                    onClick={closeCreateParentModal}
                    className="button-primary mt-2 w-full"
                  >
                    Готово
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {isDeleteStudentDialogOpen && student && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            if (!isDeletingStudent) setIsDeleteStudentDialogOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#151515]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2
                id="delete-student-title"
                className="text-xl font-extrabold text-slate-950 dark:text-white"
              >
                Удалить ученика
              </h2>
              <p className="mt-2 text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
                Удалить ученика «{student.last_name} {student.first_name}»?
                Это действие необратимо.
              </p>
            </div>
            <div className="flex flex-col gap-2 bg-slate-50 px-5 py-4 dark:bg-white/[0.04] sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteStudentDialogOpen(false)}
                disabled={isDeletingStudent}
                className="button-secondary"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={runConfirmedStudentDeletion}
                disabled={isDeletingStudent}
                className="button-danger"
              >
                {isDeletingStudent ? "Удаляем..." : "Удалить ученика"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentModal;
