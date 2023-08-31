import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import x from "../../public/twitter-x.svg";
import insta from "../../public/instagram.svg";
import linkedIn from "../../public/linkedin.svg";
import git from "../../public/github.svg";
import hashnode from "../../public/hashnode.svg";

export default function Home() {
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
  ];

  return (
    <div className="flex h-screen flex-col overflow-y-scroll xs:px-12 xs:pt-12 lg:px-80 lg:pt-14">
      <div className="mb-12">
        <p className="mb-3 font-bold text-slate-400">About</p>
        <p className="leading-5 text-slate-100">
          Hi, I&apos;m Prasenjit Pawar software engineer at{" "}
          <Link
            target={"_blank"}
            href="https://www.capgemini.com/in-en/"
            className="underline hover:underline"
          >
            Capgemini
          </Link>{" "}
          in{" "}
          <Link
            target={"_blank"}
            className="underline hover:underline"
            href={
              "https://www.google.com/search?q=vadapav&tbm=isch&ved=2ahUKEwj7u_uXq9T_AhWTObcAHd8XChkQ2-cCegQIABAA&oq=vadap&gs_lcp=CgNpbWcQARgAMggIABCABBCxAzIFCAAQgAQyBQgAEIAEMgUIABCABDIFCAAQgAQyBQgAEIAEMgUIABCABDIFCAAQgAQyBQgAEIAEMgUIABCABDoKCAAQigUQsQMQQzoHCAAQigUQQzoECCMQJ1DiIFi0J2DCMWgAcAB4AIABzAGIAeIGkgEFMC41LjGYAQCgAQGqAQtnd3Mtd2l6LWltZ8ABAQ&sclient=img&ei=eOmSZPufLpPz3LUP36-oyAE&bih=601&biw=1280&rlz=1C1UEAD_enIN1004IN1004"
            }
          >
            Mumbai,
          </Link>{" "}
          living in my tech bro basement. I enjoy{" "}
          <span className="font-medium text-slate-500">web development.</span>
        </p>
      </div>
      <div className="mb-12 flex flex-col">
        <p className="mb-3 font-bold text-slate-400">Links</p>
        <ul className="w-fit items-center text-slate-100">
          <li className="flex gap-1">
            <Link
              className="flex items-end gap-1 hover:underline"
              href={"https://www.linkedin.com/in/prasenjit-pawar-2b378b77/"}
              target="_blank"
            >
              LikedIn{" "}
              <Image alt="LikedIn" height={20} width={20} src={linkedIn} />{" "}
            </Link>
          </li>
          <li className="flex gap-1">
            <Link
              className="flex items-end gap-1 hover:underline"
              href={"https://github.com/prasenjitpawar22"}
              target="_blank"
            >
              GitHub{" "}
              <Image
                className=""
                alt="GitHub"
                height={20}
                width={20}
                src={git}
              />{" "}
            </Link>
          </li>
          <li className="flex items-center">
            <Link
              className="flex items-end gap-1 hover:underline"
              href={"https://twitter.com/PrasenjitPawar"}
              target="_blank"
            >
              {"X"} <Image alt="X" height={30} width={30} src={x} />
            </Link>
          </li>
          <li className="flex gap-1">
            <Link
              className="flex items-end gap-1 hover:underline"
              href={"https://www.instagram.com/prasensphotos"}
              target="_blank"
            >
              Instagram{" "}
              <Image alt="instagram" height={20} width={20} src={insta} />{" "}
            </Link>
          </li>
          <li className="flex gap-1">
            <Link
              className="flex items-end gap-1 hover:underline"
              href={"https://techiee.hashnode.dev/"}
              target="_blank"
            >
              Blog{" "}
              <Image
                className=""
                alt="GitHub"
                height={20}
                width={20}
                src={hashnode}
              />{" "}
            </Link>
          </li>
        </ul>
      </div>
      <div className="mb-12 flex flex-col">
        <p className="mb-3 font-bold text-slate-400">Projects</p>
        <div className="relative flex gap-x-2">
          <div
            id="sliderContainer"
            className="w-full rounded border border-slate-700"
          >
            <ul id="slider" className="flex w-full overflow-auto">
              {projects.map((project, index) => (
                <li key={index} className="card w-96 p-5">
                  <Link
                    target={"_blank"}
                    href={project.link}
                    className="flex w-36 select-none flex-col items-center rounded p-2 text-slate-100 shadow-sm 
                    shadow-slate-500 transition duration-200 hover:bg-slate-800 hover:shadow-slate-800"
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
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div>
        <p className="font-bold text-slate-400">
          Current Tech stack:{" "}
          <span className="font-normal text-slate-100">
            Next.js, tRPC, MongoBD, PostgreSQL.
          </span>{" "}
        </p>
      </div>
      <div className="bottom-0">
        <p className="text-slate-700">This website doesn&apos;t use cookies</p>
      </div>
    </div>
  );
}
