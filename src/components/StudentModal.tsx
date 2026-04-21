import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  IoClose,
  IoMailOutline,
  IoNotificationsOutline,
  IoPersonCircleOutline,
  IoTimeOutline,
} from "react-icons/io5";
import {
  addBehavior,
  getBehaviorHistory,
  getStudentById,
} from "../api/student";
import type { BehaviorRecord } from "../types/behavior.types";
import type { StudentResponce } from "../types/student.type";
import Toast from "./Toast";

interface Props {
  studentId: string;
  onClose: () => void;
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

const reasons = [
  "Не сделал домашнее задание",
  "Забыл тетрадь",
  "Забыл учебник",
  "Не готов к уроку",
  "Опоздал на урок",
  "Пропуск урока без уважительной причины",
  "Разговаривал на уроке",
  "Мешал вести урок",
  "Нарушал дисциплину",
  "Пользовался телефоном на уроке",
  "Списывал",
  "Грубил учителю",
  "Конфликтовал с одноклассниками",
  "Портил школьное имущество",
  "Нарушение формы одежды",
  "Не сдал контрольную работу",
  "Не сдал проект вовремя",
  "Отказался выполнять задание",
];

const StudentModal = ({ studentId, onClose }: Props) => {
  const [student, setStudent] = useState<StudentResponce | null>(null);
  const [subject, setSubject] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BehaviorRecord[]>([]);
  const [notify, setNotify] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStudentLoading, setIsStudentLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setIsStudentLoading(true);
        const [studentData, historyData] = await Promise.all([
          getStudentById(studentId),
          getBehaviorHistory(studentId),
        ]);

        setStudent(studentData);
        setHistory(historyData);
      } catch {
        setError("Не удалось загрузить карточку ученика.");
      } finally {
        setIsStudentLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  const handleSend = async () => {
    if (!student || selectedReasons.length === 0 || !subject) return;

    try {
      setLoading(true);

      await addBehavior(student.id, {
        subject,
        reasons: selectedReasons,
        comment: comment || undefined,
      });

      const updatedHistory = await getBehaviorHistory(student.id);
      setHistory(updatedHistory);
      setNotify("Уведомление отправлено");
      setSubject("");
      setSelectedReasons([]);
      setComment("");
    } catch {
      setError("Ошибка отправки уведомления.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4 py-6 backdrop-blur-sm"
    >
      {error && (
        <Toast type="error" message={error} onClose={() => setError(null)} />
      )}
      {notify && (
        <Toast type="access" message={notify} onClose={() => setNotify(null)} />
      )}

      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-zinc-950/20"
      >
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <IoPersonCircleOutline className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-950">
                {student
                  ? `${student.last_name} ${student.first_name}`
                  : "Карточка ученика"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {student
                  ? `${student.grade}${student.class_letter} класс`
                  : "Загружаем данные..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <IoClose className="h-5 w-5" />
          </button>
        </div>

        {isStudentLoading ? (
          <div className="p-8 text-center text-sm font-medium text-zinc-500">
            Загружаем карточку...
          </div>
        ) : (
          <div className="grid max-h-[calc(100vh-9rem)] overflow-y-auto lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border-b border-zinc-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Данные ученика
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-500">ФИО</p>
                    <p className="mt-1 font-bold text-zinc-950">
                      {student?.last_name} {student?.first_name}{" "}
                      {student?.middle_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-700">
                    <IoMailOutline className="h-5 w-5 text-zinc-400" />
                    <span className="break-all">{student?.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-950">
                    История замечаний
                  </h3>
                  <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">
                    {history.length}
                  </span>
                </div>

                {history.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm font-medium text-zinc-500">
                    Пока нет замечаний
                  </div>
                ) : (
                  <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-zinc-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-zinc-950">
                            {item.subject}
                          </p>
                          <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-zinc-400">
                            <IoTimeOutline className="h-4 w-4" />
                            {new Date(item.created_at).toLocaleDateString(
                              "ru-RU",
                            )}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.reasons.map((reason) => (
                            <span
                              key={reason}
                              className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                        {item.comment && (
                          <p className="mt-3 text-sm leading-6 text-zinc-600">
                            {item.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <IoNotificationsOutline className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-zinc-950">
                    Отправить уведомление
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Выбери предмет и одну или несколько причин.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                  Предмет
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="">Выберите предмет</option>
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <p className="mb-2 text-sm font-semibold text-zinc-700">
                    Причина
                  </p>
                  <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-2">
                    {reasons.map((reason) => (
                      <label
                        key={reason}
                        className="flex min-h-11 items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-cyan-50"
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
                          className="h-4 w-4 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                  Комментарий
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Дополнительные детали для родителя"
                    className="min-h-28 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <button
                  disabled={!subject || selectedReasons.length === 0 || loading}
                  onClick={handleSend}
                  className="h-12 rounded-lg bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 active:scale-[0.98]"
                >
                  {loading ? "Отправка..." : "Отправить уведомление"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentModal;
