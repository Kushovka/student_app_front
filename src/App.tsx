import { useState } from "react";
import { IoAdd } from "react-icons/io5";
import { BrowserRouter, Route, Routes } from "react-router";
import { createStudents } from "./api/student";
import CreateStudentModal from "./components/CreateStudentModal";
import ClassPage from "./features/ClassPage";
import GradePage from "./features/GradePage";
import TableGrades from "./features/TableGrades";
import type { StudentForm } from "./types/student.type";

const App = () => {
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [form, setForm] = useState<StudentForm>({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    grade: "",
    class_letter: "",
  });

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
  return (
    <BrowserRouter>
      {/* floating button */}
      <button
        onClick={() => setOpenCreateModal((prev) => !prev)}
        className="
          fixed bottom-8 right-8 z-50
          flex items-center justify-center
          w-14 h-14 rounded-full
          bg-cyan-500 text-white
          shadow-lg transition
          hover:scale-105 hover:bg-cyan-600
          active:scale-95
        "
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
      <Routes>
        <Route path="/" element={<TableGrades />} />
        <Route path="/grade/:grade" element={<GradePage />} />
        <Route path="/grade/:grade/:letter" element={<ClassPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
