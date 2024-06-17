"use client";
import { motion } from "framer-motion";
import { useState } from "react";

export default function InlinePopup() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-12 flex items-center justify-center w-[500px] border rounded-md">
      <motion.div
        initial={{ width: 200, height: 50 }}
        animate={{
          width: open ? 500 : 200,
          height: open ? 170 : 50,
        }}
        transition={{ type: "spring" }}
        className="flex items-center justify-center overflow-hidden rounded-md shadow"
      >
        <motion.div
          transition={{ duration: 0.8 }}
          className="relative flex-col border w-full h-full justify-between"
        >
          <motion.p
            onClick={() => setOpen(true)}
            initial={{ display: "flex" }}
            animate={{
              display: open ? "none" : "flex",
              filter: !open ? "blur(0px)" : "blur(5px)",
            }}
            transition={{ duration: open ? 0 : 0.7 }}
            className="w-full whitespace-nowrap h-full text-sm items-center justify-center cursor-pointer rounded"
          >
            Send feedback
          </motion.p>

          <motion.div
            initial={{ display: "none" }}
            animate={{ display: open ? "flex" : "none" }}
            className="flex items-center justify-center px-4 py-2 h-full flex-col gap-2"
          >
            <motion.div
              animate={{ display: open ? "flex" : "none" }}
              transition={{ duration: 0 }}
              className="gap-2 flex-col text-sm w-full"
            >
              <input
                className="border px-2 py-2 focus-visible:outline outline-offset-2 rounded"
                placeholder="Name"
              />
              <input
                className="border px-2 py-2 focus-visible:outline outline-offset-2 rounded"
                placeholder="Message"
              />
            </motion.div>
            <motion.div
              animate={{ display: open ? "flex" : "none" }}
              transition={{ duration: 0 }}
              className="flex justify-end w-full items-center gap-4 text-sm"
            >
              <button
                className="border px-4 py-1 rounded shadow"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
              <button className="border px-4 py-1 rounded shadow">Send</button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
