export const formatRole = (role?: string) => {
  if (role === "admin") return "Администратор";
  if (role === "teacher") return "Учитель";
  return role ?? "—";
};

