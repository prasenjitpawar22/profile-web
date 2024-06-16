"use client";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItems = { name: string; path: string };

const navItems: NavItems[] = [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: "Projects", path: "/projects" },
  { name: "Components", path: "/components" },
];
export default function NavBar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState(pathname);

  return (
    <nav className="flex gap-2 justify-center">
      <ul className="flex shadow-inner mt-3 rounded-full p-2 items-center">
        {navItems.map((nav) => (
          <motion.li
            className="relative px-2 py-1 text-sm inline-flex items-center rounded-full tracking-tight cursor-pointer"
            key={nav.path}
            onHoverStart={() => setHoveredItem(nav.path)}
            onHoverEnd={() => setHoveredItem(pathname)}
          >
            {nav.name}
            {hoveredItem === nav.path && (
              <motion.span
                layoutId="navbar"
                className="absolute bottom-0 w-full left-0 h-full bg-stone-100 rounded-full -z-10"
                animate={
                  nav.path === pathname && {
                    height: 2,
                    scale: 0.4,
                    backgroundColor: [
                      "rgb(245 245 244 /1)",
                      "rgb(120 113 108/1)",
                      "rgb(41 37 36 /1)",
                    ],
                    transition: { delay: 0.6 },
                  }
                }
                transition={{
                  type: "spring",
                  bounce: 0.25,
                  stiffness: 130,
                  damping: 20,
                  duration: 0.3,
                }}
              ></motion.span>
            )}
          </motion.li>
        ))}
      </ul>
    </nav>
  );
}
