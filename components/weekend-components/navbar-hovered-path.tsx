"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const navs = [
  { path: "/", name: "Home" },
  { path: "/about", name: "About" },
  { path: "/pricing", name: "Pricing" },
  { path: "/contact", name: "Contact" },
];
export default function NavbarHoveredPath() {
  const [dummyPath, setDummyPath] = useState("/");
  const [hoveredPath, setHoveredPath] = useState(dummyPath);

  return (
    <div className="flex w-fit h-[100px] px-4 border items-center rounded-md">
      <nav className="flex">
        {navs.map((nav) => (
          <motion.li
            className="list-none relative px-2 py-1 rounded-full h-fit text-sm cursor-pointer"
            key={nav.path}
            onHoverStart={() => setHoveredPath(nav.path)}
            onHoverEnd={() => setHoveredPath(dummyPath)}
            onClick={() => setDummyPath(nav.path)}
          >
            {nav.name}
            {nav.path === hoveredPath && (
              <motion.span
                className="absolute bottom-0 w-full left-0 h-full bg-stone-100 rounded-full -z-10"
                layoutId="weekend-navbar"
                aria-hidden="true"
                style={{
                  width: "100%",
                }}
                transition={{
                  type: "spring",
                  bounce: 0.25,
                  stiffness: 130,
                  damping: 20,
                  duration: 0.3,
                }}
              />
            )}
          </motion.li>
        ))}
      </nav>
    </div>
  );
}
