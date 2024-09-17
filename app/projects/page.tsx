import { SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type Status = 'Completed' | 'Incomplete' | 'Inprogress' | 'abandoned'

const projectList: { link: string, name: string, description: string, status: Status, logo: ReactNode }[] = [{
  name: 'Vendue', link: 'https://vendue-web.vercel.app/', status: 'Inprogress', description: 'A realtime bidding app', logo: <svg width="50" height="50" viewBox="0 0 151 151" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 75.5C0 51.7334 0 39.8501 3.95773 30.5036C9.02245 18.5429 18.5429 9.02245 30.5036 3.95773C39.8501 0 51.7334 0 75.5 0V0C99.2666 0 111.15 0 120.496 3.95773C132.457 9.02245 141.978 18.5429 147.042 30.5036C151 39.8501 151 51.7334 151 75.5V75.5C151 99.2666 151 111.15 147.042 120.496C141.978 132.457 132.457 141.978 120.496 147.042C111.15 151 99.2666 151 75.5 151V151C51.7334 151 39.8501 151 30.5036 147.042C18.5429 141.978 9.02245 132.457 3.95773 120.496C0 111.15 0 99.2666 0 75.5V75.5Z" fill="url(#paint0_linear_44_41)" />
    <path d="M109.504 48.064L81.472 118H66.784L38.752 48.064H51.808C53.216 48.064 54.352 48.4 55.216 49.072C56.08 49.712 56.736 50.544 57.184 51.568L70.72 89.008C71.36 90.64 71.984 92.432 72.592 94.384C73.2 96.304 73.776 98.32 74.32 100.432C74.768 98.32 75.264 96.304 75.808 94.384C76.384 92.432 76.992 90.64 77.632 89.008L91.072 51.568C91.424 50.672 92.048 49.872 92.944 49.168C93.872 48.432 95.008 48.064 96.352 48.064H109.504Z" fill="url(#paint1_linear_44_41)" />
    <defs>
      <linearGradient id="paint0_linear_44_41" x1="75.5" y1="0" x2="75.5" y2="151" gradientUnits="userSpaceOnUse">
        <stop />
        <stop offset="0.465" stop-color="#141313" />
        <stop offset="1" stop-color="#2B2A2A" />
      </linearGradient>
      <linearGradient id="paint1_linear_44_41" x1="170.564" y1="115.835" x2="130.212" y2="214.431" gradientUnits="userSpaceOnUse">
        <stop stop-color="white" />
        <stop offset="0.55" stop-color="#434343" />
      </linearGradient>
    </defs>
  </svg>
}]

export default async function Page() {
  return <div className="flex flex-col gap-4">
    <h1 className='text-2xl md:text-4xl font-bold text-stone-800'>
      My collections of half baked projects in one place.
    </h1>
    <p className="text-base text-stone-700">A curated showcase of my projects—some complete, others a work in progress—all gathered in one place to highlight my journey of exploration and development.</p>
    <div className="mt-12 flex flex-col lg:max-w-[700px]">
      <div className="py-3 px-2 border-l">
        {projectList.map((project, i) => (
          <Link
            href={`${project.link}`}
            target="_blank" rel="noopener noreferrer"
            key={i}
            className="w-full flex items-center justify-between gap-4 transition-all duration-400 hover:bg-stone-100 p-4 rounded-md group"
          >
            <div className="flex justify-center gap-4">
              <span>{project.logo}</span>
              <div className="flex flex-col" >
                <h2 className="text-2xl font-medium flex-wrap text-stone-800 inline-flex items-center gap-2">
                  {project.name} <SquareArrowOutUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 duration-400 group-hover:translate-x-1 transition-all " />
                </h2>
                <p className='text-base text-stone-700 tracking-wide'>
                  {project.description}
                </p>
              </div>
            </div>
            <p className="inline-flex gap-2 items-center">
              <span className={`${project.status === 'Inprogress' ? 'bg-green-400 animate-pulse' : 'bg-orange-500'} rounded-full h-3 w-3`}></span>
              {project.status}
            </p>
          </Link>
        ))}
      </div>
    </div>
  </div>;
}
