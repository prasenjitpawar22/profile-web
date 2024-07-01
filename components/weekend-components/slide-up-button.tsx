import { ChevronsRight } from "lucide-react";
export default function SlideUpButton() {
  return (
    <div className="relative h-[100px] flex items-center justify-center w-[300px] border">
      <button
        className="relative w-52 h-12 inline-flex items-center justify-center
    px-4 py-3 group rounded-full ring-none border overflow-hidden"
      >
        <span
          className="absolute rounded-full -inset-[160%] animate-spin-slow
        bg-[conic-gradient(var(--tw-gradient-stops))]
       from-purple-600 from-20% via-pink-600 via-50% to-red-600 blur-md"
        ></span>
        <span className="absolute w-[95%] h-[80%] rounded-full bg-black group-hover:bg-white transition-all duration-300"></span>
        <span className="relative group-hover:absolute text-white text-sm font-medium group-hover:text-black transition-all duration-300 group-hover:-translate-y-14">
          Get started for free
        </span>
        <span className="inline-flex items-center justify-center group-hover:relative absolute text-sm font-medium text-black transition-all duration-300 translate-y-14 group-hover:translate-y-0 ">
          Get started for free <ChevronsRight size={18} />
        </span>
      </button>
    </div>
  );
}
