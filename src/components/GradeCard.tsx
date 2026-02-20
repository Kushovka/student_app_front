import { useNavigate } from "react-router";

const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const GradeCard = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-center text-zinc-800 mb-12">
        Выберите класс
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {grades.map((grade) => (
          <div
            key={grade}
            onClick={() => navigate(`/grade/${grade}`)}
            className="
              group cursor-pointer
              bg-white rounded-3xl p-10
              border border-zinc-200
              shadow-sm
              transition-all duration-300
              hover:-translate-y-2 hover:shadow-2xl
              hover:border-blue-400
              flex items-center justify-center
            "
          >
            <span
              className="
              text-2xl font-semibold
              text-zinc-700
              transition
              group-hover:text-blue-600
            "
            >
              {grade} класс
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradeCard;
