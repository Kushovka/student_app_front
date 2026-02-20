import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getStudents } from "../api/student";
import type { StudentResponce } from "../types/student.type";
import StudentModal from "../components/StudentModal";

const ClassPage = () => {
  const { grade, letter } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentResponce[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!grade || !letter) return;

    const fetchStudents = async () => {
      const data = await getStudents(Number(grade), letter);
      setStudents(data);
    };

    fetchStudents();
  }, [grade, letter]);
  console.log("Students state:", students);

  return (
    <section className="p-10">
      <button
        onClick={() => navigate(`/grade/${grade}`)}
        className="mb-6 border px-3 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        Назад
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {grade}
        {letter}
      </h1>

      {students.length === 0 ? (
        <p>Нет учеников</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">ФИО</th>
                <th className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  onClick={() => setSelectedId(student.id)}
                  key={student.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-2 font-medium">
                    {student.last_name} {student.first_name}{" "}
                    {student.middle_name}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{student.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedId && (
        <StudentModal
          studentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </section>
  );
};

export default ClassPage;
