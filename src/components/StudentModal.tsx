import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
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

  useEffect(() => {
    const fetchStudent = async () => {
      const data = await getStudentById(studentId);
      setStudent(data);
    };

    fetchStudent();
  }, [studentId]);

  const handleSend = async () => {
    if (!student) return;

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
      setError("Ошибка отправки!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getBehaviorHistory(studentId);
      setHistory(data);
    };

    fetchHistory();
  }, []);

  if (!student) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40">
        <div className="bg-white p-6 rounded-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
      {error && (
        <Toast type="error" message={error} onClose={() => setError(null)} />
      )}
      {notify && (
        <Toast type="access" message={notify} onClose={() => setNotify(null)} />
      )}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl p-8 shadow-xl w-[420px] flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {student.last_name} {student.first_name}
          </h2>
          <button onClick={onClose}>
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <p>
            <span className="font-medium">Отчество:</span> {student.middle_name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {student.email}
          </p>
          <p>
            <span className="font-medium">Класс:</span> {student.grade}
            {student.class_letter}
          </p>
        </div>
        <div className="border-t pt-5 flex flex-col gap-4">
          <h3 className="font-semibold text-sm text-zinc-700">
            Отправить уведомление
          </h3>

          {/* Предмет */}
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Выберите предмет</option>
            {subjects.map((sub) => (
              <div key={sub}>
                <option value={sub}>{sub}</option>
              </div>
            ))}
          </select>

          {/* Причина */}
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
            {reasons.map((reas) => (
              <label key={reas} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedReasons.includes(reas)}
                  onChange={() => {
                    setSelectedReasons((prev) =>
                      prev.includes(reas)
                        ? prev.filter((r) => r !== reas)
                        : [...prev, reas],
                    );
                  }}
                />
                {reas}
              </label>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Дополнительный комментарий..."
            className="border rounded-lg px-3 py-2 text-sm resize-none"
            rows={3}
          />

          <button
            disabled={!subject || !selectedReasons || loading}
            onClick={handleSend}
            className="bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </div>

        <div className="border-t pt-4 space-y-3 max-h-40 overflow-y-auto">
          <h4 className="text-sm font-semibold">История замечаний</h4>

          {history.length === 0 && (
            <p className="text-xs text-zinc-500">Пока нет замечаний</p>
          )}

          {history.map((item) => (
            <div key={item.id} className="bg-gray-50 p-3 rounded-lg text-xs">
              <p className="font-medium">{item.subject}</p>

              <ul className="list-disc pl-4">
                {item.reasons.map((r, index) => (
                  <li key={index}>{r}</li>
                ))}
              </ul>

              {item.comment && (
                <p className="mt-1 text-zinc-600">
                  Комментарий: {item.comment}
                </p>
              )}

              <p className="text-zinc-400 mt-1">
                {new Date(item.created_at).toLocaleDateString("ru-RU")}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default StudentModal;
