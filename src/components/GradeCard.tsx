import { useNavigate } from "react-router";
import { IoChevronForwardOutline } from "react-icons/io5";

const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const GradeCard = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Журнал классов
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950 sm:text-4xl">
            Выберите параллель
          </h1>
        </div>
        <p className="max-w-xl text-sm leading-6 text-zinc-600">
          Открой класс, выбери букву и работай со списком учеников без лишних
          переходов.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {grades.map((grade) => (
          <button
            key={grade}
            onClick={() => navigate(`/grade/${grade}`)}
            className="group flex min-h-28 items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md active:scale-[0.99]"
          >
            <span>
              <span className="block text-3xl font-bold text-zinc-950">
                {grade}
              </span>
              <span className="mt-1 block text-sm font-medium text-zinc-500">
                {grade} класс
              </span>
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition group-hover:bg-cyan-50 group-hover:text-cyan-700">
              <IoChevronForwardOutline className="h-5 w-5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GradeCard;
