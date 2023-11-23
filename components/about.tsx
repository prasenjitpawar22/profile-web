"use client";
import { motion } from "framer-motion";
import NameDraw from "./name-draw";
export default function About() {
  return (
    <>
      <NameDraw />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      >
        <p className="text-xl">
          {`Hi, I am Software Engineer with experience in both developing frontend and backend applications.`}
        </p>
      </motion.div>
    </>
  );
}
