import { useInView } from "framer-motion";
import { useEffect, useRef, MutableRefObject } from "react";
import Link from "next/link";
import Image from "next/image";

type TProject = {
  link: string;
  img: string;
  title: string;
  description: string;
};

type Props = {
  setProjectsInView: React.Dispatch<React.SetStateAction<boolean[]>>;
  projectsInView: boolean[];
};

export default function Projects({ setProjectsInView, projectsInView }: Props) {
  const projects = [
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

  const container = useRef(null);

  return (
    <ul
      ref={container}
      id="slider"
      className="hide-scrollbar flex snap-x snap-mandatory gap-12 overflow-x-auto"
    >
      {projects.map((project, index) => (
        <Project
          container={container}
          project={project}
          index={index}
          projectsInView={projectsInView}
          setProjectsInView={setProjectsInView}
        />
      ))}
    </ul>
  );
}

export const Project = ({
  project,
  index,
  projectsInView,
  setProjectsInView,
  container,
}: {
  project: TProject;
  index: number;
  projectsInView: boolean[];
  container: MutableRefObject<null>;

  setProjectsInView: React.Dispatch<React.SetStateAction<boolean[]>>;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    root: container,
    margin: "0px -5px 0px -5px",
  });

  useEffect(() => {
    // console.log(isInView);
    const update = [...projectsInView];
    update[index] = isInView;
    setProjectsInView(update);
  }, [isInView]);

  useEffect(() => {
    console.log(projectsInView);
  }, [projectsInView]);

  return (
    <li ref={ref} key={index} className={`project-card w-96  snap-center p-1`}>
      <Link
        target={"_blank"}
        href={project.link}
        className={`flex w-[63vw] select-none flex-col items-center overflow-hidden rounded p-2 text-slate-100 shadow-sm shadow-slate-500 
        transition duration-200 hover:bg-slate-800 hover:shadow-slate-800 sm:w-[200px]`}
      >
        <div className="relative mb-2 h-24 w-full object-cover opacity-60">
          <Image
            src={project.img}
            layout="fill"
            objectFit="cover"
            className="rounded"
            alt={project.title}
          />
        </div>
        <div className="w-full text-center">
          <h2 className="font-bold ">{project.title}</h2>
          <p className="font-thin">{project.description}</p>
        </div>
      </Link>
    </li>
  );
};
