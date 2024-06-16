import GitHubIcon from "@/components/github-icon";
import LinkedInIcon from "@/components/linkedIn-icon";
import XIcon from "@/components/x-icon";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-24">
      <div className="flex flex-col gap-4">
        <Image
          src={"/avatar.png"}
          height={80}
          width={80}
          alt="Prasenjit Pawar"
          className="rounded-full border"
        />
        <h1 className="text-4xl font-semibold tracking-tight">
          Software Engineer. Writer.
        </h1>
        <p className="text-base text-stone-700 tracking-wide ">
          Hi, I am Prasenjit Pawar.
        </p>
        <div className="flex gap-3 items-center">
          <XIcon /> <GitHubIcon /> <LinkedInIcon />
        </div>
      </div>
    </main>
  );
}
