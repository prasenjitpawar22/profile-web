import GitHubIcon from "@/components/github-icon";
import LinkedInIcon from "@/components/linkedIn-icon";
import XIcon from "@/components/x-icon";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="w-20 h-20 relative ">
        <Image
          src={"/avatar.png"}
          alt="Prasenjit Pawar"
          objectFit="cover"
          fill
          className="w-full h-full top-0 left-0 object-cover rounded-2xl"
        />
      </div>
      <h1 className="mt-2 md:text-4xl text-2xl font-bold text-stone-900 tracking-tight">
        Software Engineer. Writer.
      </h1>
      <p className="mt-2 text-base text-stone-700 tracking-wide">
        {`Hi, I'm Prasenjit. I'm a software engineer @Capgemini.`}
      </p>
      <div className="mt-2 flex gap-3 items-center">
        <Link href={"https://twitter.com/PrasenjitPawar"}>
          <XIcon />
        </Link>
        <Link href={"https://github.com/prasenjitpawar22"}>
          <GitHubIcon />
        </Link>
        <Link href={"https://www.linkedin.com/in/prasenjit-pawar-2b378b77/"}>
          <LinkedInIcon />
        </Link>
      </div>
    </>
  );
}
