import { motion, Variants } from "framer-motion";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeButton() {
  const { setTheme, theme } = useTheme();

  const variants: Variants = {
    light: { left: 2 },
  };

  function handleClick() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <div className="relative h-fit w-14 ">
      <div className="relative flex items-center justify-between rounded-xl border border-muted bg-muted p-1 shadow-inner">
        <SunIcon size={20} className="text-white" />
        <MoonIcon size={20} className="text-foreground " />
        <motion.span
          variants={variants}
          animate={theme}
          onClick={handleClick}
          className={`absolute right-[2px] h-6 w-6 cursor-pointer rounded-full border border-muted bg-background shadow`}
        ></motion.span>
      </div>
    </div>
  );
}
