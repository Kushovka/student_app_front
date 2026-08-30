export const formatRole = (role?: string) => {
  if (role === "superadmin") return "Владелец платформы";
  if (role === "admin") return "Администратор";
  if (role === "teacher") return "Учитель";
  if (role === "parent") return "Родитель";
  return role ?? "—";
};
