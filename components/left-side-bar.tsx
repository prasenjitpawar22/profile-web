"use client";
import { motion } from "framer-motion";
import { NavState, useNavContext } from "./nav-provider";

export default function LeftSideBar() {
  const { navState, setNavState } = useNavContext();

  return (
    <div className="absolute flex flex-col gap-2 top-[30%] left-0">
      <motion.div
        onClick={() => setNavState(NavState.about)}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`px-2 py-1 capitalize border border-l-0 text-xl rounded-r-xl hover:bg-muted
        transition-all duration-200 cursor-pointer ${
          navState === NavState.about ? "bg-muted" : ""
        } `}
      >
        <p>about</p>
      </motion.div>
      <motion.div
        onClick={() => setNavState(NavState.projects)}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`px-2 py-1 capitalize border border-l-0 text-xl rounded-r-xl hover:bg-muted
        transition-all duration-200 cursor-pointer ${
          navState === NavState.projects ? "bg-muted" : ""
        } `}
      >
        <p>projects</p>
      </motion.div>
      <motion.div
        onClick={() => setNavState(NavState.resume)}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`px-2 py-1 capitalize border border-l-0 text-xl rounded-r-xl hover:bg-muted
            transition-all duration-200 cursor-pointer ${
              navState === NavState.resume ? "bg-muted" : ""
            } `}
      >
        <p>resume</p>
      </motion.div>
    </div>
  );
}
