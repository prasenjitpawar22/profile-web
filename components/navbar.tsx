"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItems = { name: string; path: string };

const navItems: NavItems[] = [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
  // { name: "Projects", path: "/projects" },
  { name: "Components", path: "/components" },
];
export default function NavBar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState(pathname);

  useEffect(() => {
    setHoveredItem(pathname);
  }, [pathname]);

  return (
    <nav className="flex gap-2 justify-center">
      <ul className="flex shadow-inner shadow-stone-200 mt-3 rounded-full p-2 items-center">
        {navItems.map((nav) => (
          <Link
            key={nav.name}
            href={nav.path}
            className="rounded-full focus-visible:outline-1 outline-stone-200"
          >
            <motion.li
              className="relative px-2 py-1 text-sm inline-flex items-center focus-visible:outline-0 rounded-full tracking-tight cursor-pointer"
              key={nav.path}
              onHoverStart={() => setHoveredItem(nav.path)}
              onHoverEnd={() => setHoveredItem(pathname)}
            >
              {nav.name}
              {(hoveredItem === nav.path ||
                hoveredItem.startsWith(nav.path + "/")) && (
                <motion.span
                  layoutId="navbar"
                  className="absolute bottom-0 w-full left-0 h-full bg-stone-100 rounded-full -z-10"
                  animate={
                    (nav.path === pathname ||
                      pathname.startsWith(nav.path + "/")) && {
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
          </Link>
        ))}
      </ul>
    </nav>
  );
}
