"use client";

import { MoonIcon } from "@radix-ui/react-icons";
import { motion, Variants } from "framer-motion";
import { SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

const buttonVariants: Variants = {
  open: { left: 1 },
  closed: { right: 1 },
};

const sunVariants: Variants = {
  open: { translateX: 20 },
  close: { translateX: -20 },
};

export function DarkMode() {
  const { setTheme, theme } = useTheme();
  const [animate, setAnimate] = useState<boolean>(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme && storedTheme != "") {
      return storedTheme === "light" ? true : false;
    }
    return true;
  });

  function handleTheme() {
    setAnimate(!animate);
    theme === "light" ? setTheme("dark") : setTheme("light");
  }

  return (
    <div
      className={`relative items-center overflow-hidden flex px-1 h-7 w-14 bg-primary border-2 rounded-xl shadow-2xl ${
        theme === "light" ? "justify-end" : "justify-start"
      } `}
    >
      <motion.span
        animate={animate ? "open" : "closed"}
        variants={buttonVariants}
        className={`absolute cursor-pointer bg-background h-5 w-5 shadow-2xl rounded-lg top-1/2
         -translate-y-1/2`}
        onClick={() => handleTheme()}
      />
      {theme === "light" ? (
        <motion.span
          animate={{ x: [20, 0] }}
          transition={{ ease: "easeIn", duration: 0.3 }}
        >
          <MoonIcon className="text-slate-800" />
        </motion.span>
      ) : (
        <span>
          <SunMedium className="text-slate-200" size={20} />
        </span>
      )}
    </div>
  );
}
