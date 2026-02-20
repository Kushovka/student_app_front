import { motion } from "framer-motion";
import { IoIosClose } from "react-icons/io";
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
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="bg-white rounded-xl p-6 shadow-xl w-[420px] flex flex-col gap-5"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <p className="text-[18px] font-semibold text-slate-900">
            Добавить ученика
          </p>
          <button
            onClick={() => setOpenCreateModal(false)}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <IoIosClose className="w-6 h-6" />
          </button>
        </div>

        {/* FORM */}
        <div className="flex flex-col gap-4">
          {/* last name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Фамилия</label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  last_name: e.target.value,
                }))
              }
              placeholder="Введите фамилию"
              className="border border-gray-300 rounded-lg px-3 py-[9px] text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* first name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Имя</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  first_name: e.target.value,
                }))
              }
              placeholder="Введите имя"
              className="border border-gray-300 rounded-lg px-3 py-[9px] text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* middle name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Отчество</label>
            <input
              type="text"
              value={form.middle_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  middle_name: e.target.value,
                }))
              }
              placeholder="Введите отчество"
              className="border border-gray-300 rounded-lg px-3 py-[9px] text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="text"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="Введите почту родителя"
              className="border border-gray-300 rounded-lg px-3 py-[9px] text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* grade */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Класс</label>
            <input
              type="text"
              value={form.grade}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  grade: e.target.value,
                }))
              }
              placeholder="Введите номер класса"
              className="border border-gray-300 rounded-lg px-3 py-[9px] text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* classLetter */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Буква класса</label>
            <select
              value={form.class_letter}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  class_letter: e.target.value,
                }))
              }
              className="border rounded-lg px-3 py-2"
            >
              <option value="">Выберите букву</option>
              {russianLetters.map((letter) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          onClick={addStudent}
          type="button"
          className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 transition w-full active:scale-[0.98]"
        >
          Добавить
        </button>
      </motion.div>
    </div>
  );
};

export default CreateStudentModal;
