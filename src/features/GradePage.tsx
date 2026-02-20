import { useEffect, useState } from "react";
import { IoExitOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router";
import { getStudents } from "../api/student";

const GradePage = () => {
  const { grade } = useParams();
  const navigate = useNavigate();
  const [letters, setLetters] = useState<string[]>([]);

  useEffect(() => {
    if (!grade) return;

    const fetchStudents = async () => {
      const data = await getStudents(Number(grade));

      const uniqueLetters = [
        ...new Set(data.map((s) => s.class_letter.trim().toUpperCase())),
      ].sort();

      setLetters(uniqueLetters);
    };

    fetchStudents();
  }, [grade]);

  return (
    <section className="min-h-screen bg-zinc-100 p-10">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 border px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition shadow-sm"
        >
          <IoExitOutline className="rotate-180 h-5 w-5" />
          Назад
        </button>
        <h1 className="text-3xl font-bold text-zinc-800">{grade} класс</h1>
        <div /> {/* пустышка для выравнивания */}
      </div>

      {/* CONTENT */}
      {letters.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border text-center text-zinc-500">
          В этом классе пока нет учеников
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {letters.map((letter) => (
            <div
              key={letter}
              onClick={() => navigate(`/grade/${grade}/${letter}`)}
              className="
                group cursor-pointer
                bg-white rounded-2xl p-8
                shadow-sm border border-zinc-200
                transition-all duration-300
                hover:-translate-y-1 hover:shadow-xl
                flex flex-col items-center justify-center
              "
            >
              <span className="text-4xl font-bold text-zinc-700 group-hover:text-cyan-600 transition">
                {letter}
              </span>

              <span className="text-sm text-zinc-500 mt-2">{grade} класс</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default GradePage;
