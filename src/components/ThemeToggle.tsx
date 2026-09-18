import { IoDesktopOutline, IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { useTheme, type ThemeMode } from "../context/themeContext";

const options: Array<{
  mode: ThemeMode;
  label: string;
  icon: typeof IoDesktopOutline;
}> = [
  { mode: "system", label: "Система", icon: IoDesktopOutline },
  { mode: "light", label: "Светлая", icon: IoSunnyOutline },
  { mode: "dark", label: "Тёмная", icon: IoMoonOutline },
];

interface ThemeToggleProps {
  compact?: boolean;
}

const ThemeToggle = ({ compact = false }: ThemeToggleProps) => {
  const { mode, setMode } = useTheme();

  return (
    <div
      className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900"
      aria-label="Переключение темы"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = option.mode === mode;

        return (
          <button
            key={option.mode}
            type="button"
            onClick={() => setMode(option.mode)}
            className={[
              "inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition",
              isActive
                ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
            ].join(" ")}
            title={option.label}
          >
            <Icon className="h-5 w-5" />
            {!compact && <span className="hidden sm:inline">{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
