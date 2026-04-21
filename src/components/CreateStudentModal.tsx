import { motion } from "framer-motion";
import { IoClose, IoPersonAddOutline } from "react-icons/io5";
import type { StudentForm } from "../types/student.type";

interface Props {
  form: StudentForm;
  setForm: React.Dispatch<React.SetStateAction<StudentForm>>;
  setOpenCreateModal: (v: boolean) => void;
  addStudent: () => void;
}

const russianLetters = ["А", "Б", "В", "Г", "Д", "Е"];

const CreateStudentModal = ({
  form,
  setOpenCreateModal,
  setForm,
  addStudent,
}: Props) => {
  const updateField = (field: keyof StudentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      onClick={() => setOpenCreateModal(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4 py-6 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-zinc-950/20"
      >
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <IoPersonAddOutline className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-950">
                Новый ученик
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Заполни данные ученика и выбери класс.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpenCreateModal(false)}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <IoClose className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-13rem)] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-zinc-700">
              Фамилия
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                placeholder="Иванов"
                className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-zinc-700">
              Имя
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                placeholder="Иван"
                className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-zinc-700">
              Отчество
              <input
                type="text"
                value={form.middle_name}
                onChange={(e) => updateField("middle_name", e.target.value)}
                placeholder="Иванович"
                className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-zinc-700">
              Email родителя
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="parent@mail.ru"
                className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-zinc-700">
              Класс
              <input
                type="number"
                min="1"
                max="11"
                value={form.grade}
                onChange={(e) => updateField("grade", e.target.value)}
                placeholder="7"
                className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-zinc-700">
              Буква
              <select
                value={form.class_letter}
                onChange={(e) => updateField("class_letter", e.target.value)}
                className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">Выберите букву</option>
                {russianLetters.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            onClick={() => setOpenCreateModal(false)}
            type="button"
            className="h-11 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Отмена
          </button>
          <button
            onClick={addStudent}
            type="button"
            className="h-11 rounded-lg bg-zinc-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98]"
          >
            Добавить ученика
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateStudentModal;
