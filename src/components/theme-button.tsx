// import { MoonIcon } from "@radix-ui/react-icons";
import { motion, Variants } from "framer-motion";
import { SunMedium, MoonIcon, SunIcon, Circle } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function ThemeButton() {
  const { setTheme, theme } = useTheme();
  const [isDark, setIsDark] = useState(() => (theme === "dark" ? true : false));

  return (
    <div className="relative h-fit w-14 overflow-hidden">
      <div className="relative flex items-center justify-between rounded-xl border border-muted bg-muted p-1 shadow-inner">
        <SunIcon size={20} className="text-white" />
        <MoonIcon size={20} className="text-foreground " />
        <motion.span
          // initial={theme === "dark" ? { right: 2 } : { left: 2 }}
          initial={{ opacity: 0 }}
          animate={
            theme === "light"
              ? { left: 2, opacity: 1 }
              : { right: 2, opacity: 1 }
          }
          onClick={() => {
            theme === "light" ? setTheme("dark") : setTheme("light");
          }}
          className="absolute h-6 w-6 cursor-pointer rounded-full border border-muted 
         bg-background shadow"
        />
      </div>
    </div>
  );
}
