import { SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type Status = 'Completed' | 'Incomplete' | 'Inprogress' | 'abandoned'|'down'

const projectList: { link: string, name: string, description: string, status: Status, logo: ReactNode, techStack: string }[] = [{
  name: 'Vendue', link: 'https://vendue-web.vercel.app/', status: 'Completed', description: 'A realtime bidding app', logo: <svg width="50" height="50" viewBox="0 0 151 151" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  , techStack: 'Next.js, Supabase, AWS'
},
{
  name: 'Abhi Atul Sounds and Lights', link: 'https://atul-abhi-web.vercel.app/', status: 'Inprogress', description: 'Sound and Lights services', logo: <svg width="248" height="120" viewBox="0 0 248 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#filter0_d_170_2)">
  <path d="M39.5 0H30L9 77.5C9 77.5 11.6476 76 13.5 76C15.3524 76 18 77.5 18 77.5H50C51 77.5 51.5 78.5 51.5 78.5C51.5 78.5 61 113.5 61.5 114C62 114.5 65.3443 114.918 67.5 114C69.1562 113.294 71 111 71 111C71 111 70 110.5 70 110C70 109.5 60.5 74 60 73C59.5 72 57 69.5 56.5 69C56 68.5 53 67 52.5 67H21C21 67 34 17.5 34.5 17.5C35 17.5 35.5 17.5 36 18.5C36.5 19.5 48.5 62.5 48.5 62.5C48.5 62.5 52 62 53.5 62.5C55 63 59 65 59 65C59 65 57 62.5 56.5 61.5C56 60.5 39.5 0 39.5 0Z" fill="black"/>
  <path d="M7.50002 83.5562L0 110.556C0 110.556 1.62394 113.515 3.5 114.056C5.78233 114.715 10 112.556 10 112.556L17.5 85.0562C17.5 85.0562 16.5 81.5562 13 81.0562C9.50002 80.5562 7.50002 83.5562 7.50002 83.5562Z" fill="black"/>
  <path d="M84 22.5H70V17L84 17.5C89 17.6667 99 20.3 99 29.5C99 33.9 93.3333 37.3333 90.5 38.5C94.3333 38.6667 102 41 102 49C102.4 59.8 90.1667 62.1667 84 62H70V57H84C87.3333 56.6667 94 54.6 94 49C94 43.4 87.3333 41.6667 84 41.5H70V37H84C86.3333 36.5 91 34.3 91 29.5C91 24.7 86.3333 22.8333 84 22.5Z" fill="black"/>
  <path d="M64 57.9551V60.4831C64 60.9888 65 62 65.5 62H70V17H66C65.3333 17 64 17.3034 64 18.5169V57.9551Z" fill="black"/>
  <path d="M64.6329 67H105.133C106.095 68.9525 105.907 70.0475 105.133 72H88.1329L87.6329 109.5C87.7996 109.833 88.2329 110.4 88.6329 110C89.0329 109.6 88.7996 110.5 88.6329 111C88.4662 111.167 88.0329 111.5 87.6329 111.5H83.1329C82.4662 111.5 81.1329 111.3 81.1329 110.5V72H64.6329C63.6781 69.4909 63.9077 68.5046 64.6329 67Z" fill="black"/>
  <path d="M111 18.252V61.252C114.122 62.3489 115.877 62.2562 119 61.252C118.5 61.252 117.6 61.052 118 60.252C118.4 59.452 118.167 47.252 118 41.252H144V61.252C144 61.4187 144.2 61.752 145 61.752H151.5C151.167 61.5854 150.5 61.152 150.5 60.752C150.5 60.352 150.833 31.9187 151 17.752C148.269 16.7613 146.733 16.7375 144 17.752V35.752H118V17.752C115.234 16.7511 113.704 16.8282 111 17.752V18.252Z" fill="black"/>
  <path d="M111.02 67.91C113.544 67.0297 115.1 67.1363 118.02 67.91V97.41C118.52 100.91 122.02 107.81 132.02 107.41C142.02 107.01 145.187 100.577 145.52 97.41V67.91C147.755 66.6677 149.195 66.7259 152.02 67.91V97.41C152.687 102.743 149.62 113.41 132.02 113.41C114.42 113.41 110.687 102.743 111.02 97.41V67.91Z" fill="black"/>
  <path d="M240.5 3H64V14.5H241C242 14.5 242.5 14 242 14C241.6 14 240.833 13.3333 240.5 13V3Z" fill="#06002C"/>
  <path d="M179.792 18V94.3326C179.957 94.5508 180.386 94.987 180.782 94.987C181.177 94.987 180.946 95.6623 180.782 96H161V18H179.792Z" fill="#08003B"/>
  <path d="M179.792 18V94.3326C179.957 94.5508 180.386 94.987 180.782 94.987C181.177 94.987 180.946 95.6623 180.782 96H161V18H179.792Z" fill="#06002C"/>
  <path d="M161 99H226V109C226.333 109.167 227.1 109.5 227.5 109.5C228 109.5 228.5 110 227.5 110.5C226.7 110.9 182.833 110.667 161 110.5V99Z" fill="#08003B"/>
  <path d="M161 99H226V109C226.333 109.167 227.1 109.5 227.5 109.5C228 109.5 228.5 110 227.5 110.5C226.7 110.9 182.833 110.667 161 110.5V99Z" fill="#06002C"/>
  </g>
  <defs>
  <filter id="filter0_d_170_2" x="0" y="0" width="247.196" height="119.543" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
  <feOffset dx="4" dy="4"/>
  <feGaussianBlur stdDeviation="0.5"/>
  <feComposite in2="hardAlpha" operator="out"/>
  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_170_2"/>
  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_170_2" result="shape"/>
  </filter>
  </defs>
  </svg>,
  techStack: 'Next.js, Supabase, AWS',
},
]

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
                <p className='text-sm text-stone-700 tracking-wide'>
                  {project.description}
                </p>
              </div>
            </div>
            <div className="flex items-end gap-2 flex-col">
              <p className="inline-flex gap-2 items-center">
                <span className={`${project.status === 'Inprogress' ? 'bg-green-400 animate-pulse' : project.status === 'down'? 'bg-red-500': 'bg-orange-500'} rounded-full h-3 w-3`}></span>
                {project.status}
              </p>
              <p className='text-stone-700 tracking-wide text-sm'>
                TechStack: <span className="text-stone-400 " >{project.techStack}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>;
}
