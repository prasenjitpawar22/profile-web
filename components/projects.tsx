import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Projects() {
  const projectsData = [
    {
      link: "https://link3-pi.vercel.app/",
      img: "/link.png",
      title: "Link3",
      description: "link-a-bio tool",
    },
    {
      link: "https://resume-builder-frontend-ten.vercel.app/",
      img: "/resumeBuilder.png",
      title: "ResumeBuilder",
      description: "reume build tool",
    },
    {
      link: "https://bonk-a-alien.vercel.app/",
      img: "/bonk.png",
      title: "Bonk-a-Alien",
      description: "A simple game",
    },
    {
      link: "https://weather-app-kappa-seven-88.vercel.app/",
      img: "/weather.png",
      title: "Weather-App",
      description: "A weather app",
    },
    {
      link: "https://todo-fawn-six.vercel.app/",
      img: "/todoApp.png",
      title: "Todo-App",
      description: "Todo app",
    },
  ];

  return (
    <div className="bg-hero-projects rounded-xl items-center justify-center shadow border p-4 flex flex-wrap gap-3 overflow-y-hidden bg-cover h-[500px]">
      {projectsData.map((i) => (
        <Link
          href={i.link}
          target="_blank"
          className="relative group h-36 w-44 flex flex-col items-center bg-center text-white"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="relative mb-2 h-full w-full object-cover cursor-pointer opacity-70"
          >
            <Image
              src={i.img}
              layout="fill"
              objectFit="cover"
              className="rounded group-hover:opacity-50 transition-all duration-200"
              alt={"project"}
            />
          </motion.div>
          <div
            className="absolute shadow p-2 transition-all duration-200 cursor-pointer opacity-0 group-hover:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          text-foreground w-full text-center font-extrabold bg-primary "
          >
            <p className="text-md">{i.title}</p>
            {/* <p className="text-sm">{i.description}</p> */}
            {/* <p className="text-md">Next.js Tailwind CSS</p> */}
          </div>
        </Link>
      ))}
    </div>
  );
}
