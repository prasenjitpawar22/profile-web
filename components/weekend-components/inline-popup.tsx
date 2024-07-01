"use client";
import { motion } from "framer-motion";
<<<<<<< HEAD
import { useEffect, useRef, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function InlinePopup() {
  const [open, setOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const nameId = setTimeout(() => {
      if (open) {
        nameRef.current?.focus();
      }
    }, 500);
    return () => clearTimeout(nameId);
  }, [open]);

=======
import { useState } from "react";

export default function InlinePopup() {
  const [open, setOpen] = useState(false);
>>>>>>> 9ef808b (components page work)
  return (
    <div className="p-12 flex items-center justify-center w-[500px] border rounded-md">
      <motion.div
        initial={{ width: 200, height: 50 }}
        animate={{
          width: open ? 500 : 200,
<<<<<<< HEAD
          height: open ? 200 : 50,
=======
          height: open ? 170 : 50,
>>>>>>> 9ef808b (components page work)
        }}
        transition={{ type: "spring" }}
        className="flex items-center justify-center overflow-hidden rounded-md shadow"
      >
        <motion.div
          transition={{ duration: 0.8 }}
<<<<<<< HEAD
          className="relative flex-col border border-slate-200 w-full h-full justify-between"
        >
          <motion.button
            onClick={() => {
              setOpen(true);
            }}
=======
          className="relative flex-col border w-full h-full justify-between"
        >
          <motion.p
            onClick={() => setOpen(true)}
>>>>>>> 9ef808b (components page work)
            initial={{ display: "flex" }}
            animate={{
              display: open ? "none" : "flex",
              filter: !open ? "blur(0px)" : "blur(5px)",
            }}
            transition={{ duration: open ? 0 : 0.7 }}
            className="w-full whitespace-nowrap h-full text-sm items-center justify-center cursor-pointer rounded"
          >
            Send feedback
<<<<<<< HEAD
          </motion.button>

          <motion.form
            initial={{ display: "none" }}
            animate={{ display: open ? "flex" : "none" }}
            className="flex items-center justify-center px-4 py-2 h-full flex-col gap-2"
            onSubmit={(e) => e.preventDefault()}
            onKeyDown={(e) => (e.key === "Escape" ? setOpen(false) : null)}
          >
            <div className="flex items-center justify-end w-full mb-2">
              <Cross2Icon
                onClick={() => setOpen(false)}
                className="cursor-pointer hover:text-black text-black/[0.6] transition-all duration-200 "
              />
            </div>
=======
          </motion.p>

          <motion.div
            initial={{ display: "none" }}
            animate={{ display: open ? "flex" : "none" }}
            className="flex items-center justify-center px-4 py-2 h-full flex-col gap-2"
          >
>>>>>>> 9ef808b (components page work)
            <motion.div
              animate={{ display: open ? "flex" : "none" }}
              transition={{ duration: 0 }}
              className="gap-2 flex-col text-sm w-full"
            >
              <input
<<<<<<< HEAD
                className="border border-slate-200 px-2 py-2 focus-visible:outline outline-slate-400 outline-offset-2 rounded"
                placeholder="Name"
                ref={nameRef}
              />
              <input
                className="border border-slate-200 px-2 py-2 focus-visible:outline  outline-slate-400 outline-offset-2 rounded"
=======
                className="border px-2 py-2 focus-visible:outline outline-offset-2 rounded"
                placeholder="Name"
              />
              <input
                className="border px-2 py-2 focus-visible:outline outline-offset-2 rounded"
>>>>>>> 9ef808b (components page work)
                placeholder="Message"
              />
            </motion.div>
            <motion.div
              animate={{ display: open ? "flex" : "none" }}
              transition={{ duration: 0 }}
<<<<<<< HEAD
              className="flex justify-end w-full items-center gap-4 text-sm mt-2"
            >
              <button
                className="px-4 py-1 rounded shadow-sm border-slate-200 border focus-visible:outline-slate-300 focus-visible:outline-1"
                onClick={() => setOpen(false)}
                type={"submit"}
              >
                Send
              </button>
              <button
                className="border-slate-200 border px-4 py-1 rounded shadow-sm bg-slate-50 focus-visible:outline-slate-300 focus-visible:outline-1"
                onClick={() => setOpen(false)}
                type="button"
              >
                Close
              </button>
            </motion.div>
          </motion.form>
=======
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
>>>>>>> 9ef808b (components page work)
        </motion.div>
      </motion.div>
    </div>
  );
}
