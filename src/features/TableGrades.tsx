import GradeCard from "../components/GradeCard";
import { useAuth } from "../context/authContext";
import ParentCabinetPage from "./ParentCabinetPage";
import PlatformPage from "./PlatformPage";

const TableGrades = () => {
  const { user } = useAuth();

  if (user?.role === "parent") {
    return <ParentCabinetPage />;
  }
  if (user?.role === "superadmin") {
    return <PlatformPage />;
  }

  return (
    <section className="min-h-[calc(100vh-4rem)]">
      <GradeCard />
    </section>
  );
};

export default TableGrades;
