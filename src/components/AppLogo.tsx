interface AppLogoProps {
  className?: string;
}

const AppLogo = ({ className = "h-10 w-10" }: AppLogoProps) => {
  return (
    <img
      src="/logo-shield.png"
      alt="Школьный контроль"
      className={["object-contain", className].join(" ")}
      draggable={false}
    />
  );
};

export default AppLogo;
