import { Montserrat } from "next/font/google";
import Nav from "@/components/Nav";
import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  AiFillGithub,
  AiFillLinkedin,
  AiFillTwitterCircle,
} from "react-icons/ai";
import { Parallax } from "react-scroll-parallax";
import { motion } from "framer-motion";
import Link from "next/link";
import twt from "../../public/twitter.svg";
import insta from "../../public/instagram.svg";
import linkedIn from "../../public/linkedin.svg";
import git from "../../public/github.svg";
import hashnode from "../../public/hashnode.svg";

const montserrat = Montserrat({ subsets: ["latin"] });

// export default function Home() {
//   const [workData, setWorkData] = useState({
//     capgemini: {
//       active: true,
//       role: "Software Engineer",
//       date: "April 2022 - Present",
//       achivements: [
//         `Implemented scalable REST APIs on enterprise-level microservices and created workflows using Uber Cadence while working as a backend developer`,
//         `Worked with C#, .NET, Azure, MSSQL, Jira, Git, Docker`,
//         `Engage in daily communication with diverse groups of professionals from various disciplines, including engineers, designers, producers, and clients, to foster collaborative efforts and ensure successful project outcomes.`,
//       ],
//     },
//     bano: {
//       active: false,
//       role: "MERN Stack Intern",
//       date: "March 2022 - May 2022",
//       achivements: [
//         `Through the implementation of React Native and Expo technologies, I designed and developed mobile applications that are fully responsive and optimized for seamless performance on both Android and iOS platforms.`,
//         `I used React and CSS Frameworks to add new features and improve user experience, resulting in better performance, higher engagement, and increased satisfaction from web users.`,
//       ],
//     },
//   });

//   const aboutRef = useRef<null | HTMLDivElement>(null);
//   const experienceRef = useRef<null | HTMLDivElement>(null);
//   const workRef = useRef<null | HTMLDivElement>(null);
//   const contactRef = useRef<null | HTMLDivElement>(null);

//   return (
//     <>
//       <Nav
//         aboutRef={aboutRef}
//         contactRef={contactRef}
//         experienceRef={experienceRef}
//         workRef={workRef}
//       />
//       <div
//         className={`h-full w-full xs:px-12 md:px-36 ${montserrat.className}`}
//       >
//         <motion.section
//           animate={{ opacity: [0, 1], transition: {} }}
//           className="flex min-h-screen w-full items-center justify-start"
//         >
//           <div className="flex w-full flex-col items-start justify-start leading-loose tracking-widest xs:gap-3 sm:gap-4 md:gap-6">
//             <h1 className="flex text-lg text-secondary sm:pl-1">
//               Hi, my name is
//             </h1>
//             <h1 className="font-bold text-ternary xs:text-4xl sm:text-5xl md:text-7xl">
//               Prasenjit Pawar.
//             </h1>
//             <h1 className="font-bold xs:text-4xl sm:text-5xl md:text-7xl">
//               I build things on internet.
//             </h1>
//           </div>
//         </motion.section>

//         <section ref={aboutRef} className="mb-4">
//           <div className="py-14">
//             <h1 className="mb-11 text-2xl font-bold capitalize text-secondary hover:underline hover:underline-offset-4">
//               about me 😃
//             </h1>
//             <div className="flex w-full justify-between gap-12 xs:flex-col md:flex-col xl:flex-row">
//               <div className="w-full tracking-wide">
//                 <p className="text-md">
//                   Hi there 👋, I am Prasenjit Pawar, a software engineer
//                   passionate about building innovative and high-quality web
//                   applications 🚀. With expertise in frontend and backend
//                   development, I also bring a unique skill set to every project.
//                   I have extensive experience working with various technologies,
//                   including React, Tailwind CSS, Node.js, and .NET Core. <br />
//                   <br />I began my career as an{" "}
//                   <a
//                     className="cursor-pointer text-secondary hover:hover:underline"
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     href="https://www.banao.tech/"
//                   >
//                     intern at a startup
//                   </a>
//                   , where I developed a deep understanding of the industry and
//                   honed my technical skills. I am a{" "}
//                   <a
//                     className="cursor-pointer text-secondary hover:hover:underline"
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     href="https://www.capgemini.com/"
//                   >
//                     software engineer at Capgemini
//                   </a>
//                   , where I continue to deliver exceptional results and
//                   contribute to the team&apos;s success.
//                   <br />
//                   <br /> I will be a perfect choice if you are looking for a
//                   skilled and dedicated software engineer who can deliver
//                   exceptional results. Contact me today to discuss your project
//                   requirements and learn how I can help you achieve your goals.
//                 </p>
//               </div>
//               <div className="w-full xs:hidden xl:block">
//                 <Image
//                   src={"/images/me.jpg"}
//                   alt="me"
//                   width={200}
//                   height={200}
//                   className={
//                     "border-2 border-secondary p-2 opacity-50 shadow-2xl"
//                   }
//                 />
//               </div>
//             </div>
//           </div>
//         </section>

//         <section ref={experienceRef} className="w-full">
//           <div className="flex flex-col items-center py-14">
//             <h1 className="mb-11 text-2xl font-bold capitalize text-secondary hover:underline hover:underline-offset-4">
//               Where I&apos;ve worked 💼
//             </h1>
//             <div className="flex gap-12 xs:flex-col md:flex-row">
//               <ul className="flex  xs:flex-row md:flex-col">
//                 <li
//                   onClick={() =>
//                     setWorkData({
//                       ...workData,
//                       capgemini: { ...workData.capgemini, active: true },
//                       bano: { ...workData.bano, active: false },
//                     })
//                   }
//                   className={`cursor-pointer p-2 transition duration-500 xs:border-b-2 xs:border-l-0 md:border-b-0 md:border-l-2
//                   ${
//                     workData.capgemini.active
//                       ? "border-secondary bg-[#2b313f] text-secondary"
//                       : "border-[#7f8596]"
//                   } `}
//                 >
//                   Capgemini
//                 </li>

//                 <li
//                   onClick={() =>
//                     setWorkData({
//                       ...workData,
//                       bano: { ...workData.bano, active: true },
//                       capgemini: { ...workData.capgemini, active: false },
//                     })
//                   }
//                   className={`cursor-pointer p-2 transition duration-500 xs:border-b-2 xs:border-l-0 md:border-b-0 md:border-l-2
//                   ${
//                     workData.bano.active
//                       ? "border-secondary bg-[#2b313f] text-secondary"
//                       : "border-[#7f8596] "
//                   }`}
//                 >
//                   Banao Technologies
//                 </li>
//               </ul>
//               <div>
//                 {workData.capgemini.active && (
//                   <div className="flex max-w-md flex-col py-2">
//                     <h1 className="font-bold capitalize text-ternary">
//                       {" "}
//                       {workData.capgemini.role}{" "}
//                       <span className="text-secondary">@ Capgemini</span>
//                     </h1>
//                     <h1 className="text-sm"> {workData.capgemini.date} </h1>
//                     <ul>
//                       {workData.capgemini.achivements.map((l, i) => (
//                         <li className="list-disc py-2 text-secondary" key={i}>
//                           <p>{l}</p>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
//                 {workData.bano.active && (
//                   <div className="flex max-w-md flex-col py-2">
//                     <h1 className="font-bold capitalize text-ternary">
//                       {" "}
//                       {workData.bano.role}{" "}
//                       <span className="text-secondary">
//                         @ Banao Technologies
//                       </span>
//                     </h1>
//                     <h1 className="text-sm"> {workData.bano.date} </h1>
//                     <ul>
//                       {workData.bano.achivements.map((l, i) => (
//                         <li className="list-disc py-2 text-secondary" key={i}>
//                           <p>{l}</p>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </section>

//         <section ref={workRef} className="mb-4">
//           <div className="py-14">
//             <h1 className="mb-11 text-2xl font-bold capitalize text-secondary hover:underline hover:underline-offset-4">
//               Things I&apos;ve build ⚙️
//             </h1>
//             <div className="flex flex-col">
//               <a
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 href="https://resume-builder-frontend-ten.vercel.app/"
//                 className="relative transition duration-700 xl:mb-32"
//               >
//                 <div className="relative w-fit cursor-pointer rounded bg-[#1c2234] p-2 shadow hover:shadow-2xl">
//                   <h1 className="mb-3 text-2xl font-bold text-ternary">
//                     Resume builder{" "}
//                   </h1>
//                   <p className="text-primary">
//                     A simple tool for building resume <br />
//                     <span className="capitalize text-secondary">
//                       tech stack used:
//                     </span>{" "}
//                     React.js, Express, Tailwind CSS, Prisma, MongoDB
//                   </p>
//                   <Image
//                     alt="resumebuilder"
//                     width={200}
//                     height={200}
//                     className="absolute -right-72 -top-2 -z-10 w-96 opacity-50 xs:hidden xl:block"
//                     src="/images/resumebuilder.png"
//                   />
//                 </div>
//               </a>
//             </div>
//           </div>
//         </section>

//         <section ref={contactRef} className="mb-4">
//           <div className="flex flex-col items-center justify-between py-12">
//             <div className="mb-4 flex flex-grow flex-col items-center justify-center gap-5">
//               <div className="flex flex-col items-center justify-center">
//                 <h1 className="text-md capitalize  text-secondary">
//                   what&apos;s next?
//                 </h1>
//                 <h1 className="text-3xl font-bold capitalize text-ternary">
//                   get in touch
//                 </h1>
//               </div>
//               <a
//                 className="duration-400 border-2 border-secondary p-3 text-secondary transition
//                 hover:border-ternary hover:text-ternary"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 href={`mailto: prasenjitpawar22@gmail.com}`}
//               >
//                 {" "}
//                 Say Hello
//               </a>
//               <p className="max-w-lg text-center">
//                 Please don&apos;t hesitate to reach out to me with any
//                 opportunities or simply to say hello. My inbox is always open
//                 and I&apos;ll make sure to get back to you as soon as possible.
//                 Whether you have a query or just want to connect, I look forward
//                 to hearing from you!
//               </p>
//             </div>

//             <div className="flex flex-col gap-2">
//               <ul className="flex items-center justify-center gap-2">
//                 <li className="hover:cursor-pointer hover:text-secondary">
//                   <a
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     href="https://www.linkedin.com/in/prasenjit-pawar-2b378b77/"
//                   >
//                     <AiFillLinkedin size={30} />
//                   </a>
//                 </li>
//                 <li className="hover:cursor-pointer hover:text-secondary">
//                   <a
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     href="https://twitter.com/PrasenjitPawar"
//                   >
//                     <AiFillTwitterCircle size={30} />
//                   </a>
//                 </li>
//                 <li className="hover:cursor-pointer hover:text-secondary">
//                   <a
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     href="https://github.com/prasenjitpawar22"
//                   >
//                     <AiFillGithub size={30} />
//                   </a>
//                 </li>
//               </ul>
//               <span className="text-center text-sm text-ternary">
//                 Design copyed from{" "}
//                 <a
//                   className="text-secondary transition duration-300 hover:hover:underline"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   href="https://github.com/bchiang7"
//                 >
//                   @Brittany Chiang
//                 </a>
//                 {" &"} Build By
//                 <a
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   href="https://github.com/prasenjitpawar22/profile-web"
//                 >
//                   @Prasenjit Pawar
//                 </a>
//               </span>
//             </div>
//           </div>
//         </section>
//       </div>
//     </>
//   );
// }

export default function Home() {
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
          <li>
            <Link
              className="flex items-end gap-1 hover:underline"
              href={"https://twitter.com/PrasenjitPawar"}
              target="_blank"
            >
              Twitter <Image alt="twitter" height={20} width={20} src={twt} />{" "}
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
        <ul className="items-center text-slate-100">
          <li>
            <Link
              className="hover:underline"
              target={"_blank"}
              href={"https://link3-pi.vercel.app/"}
            >
              Link3 - <span className="font-thin">link-a-bio tool</span>
            </Link>
          </li>
          <li>
            <Link
              target={"_blank"}
              className="hover:underline"
              href={"https://resume-builder-frontend-ten.vercel.app/"}
            >
              ResumeBuilder -{" "}
              <span className="font-thin">reume build tool</span>
            </Link>
          </li>
         
          <li>
            <Link
              target={"_blank"}
              className="hover:underline"
              href={"https://bonk-a-alien.vercel.app/"}
            >
              Bonk-a-Alien -{" "}
              <span className="font-thin">A simple game</span>
            </Link>
          </li>
        </ul>
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
