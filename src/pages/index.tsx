import { Montserrat } from 'next/font/google'
import Nav from '@/components/Nav'
import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { AiFillGithub, AiFillLinkedin, AiFillTwitterCircle, AiFillTwitterSquare } from 'react-icons/ai'

const montserrat = Montserrat({ subsets: ['latin'] })

export default function Home() {
  const [workData, setWorkData] = useState({
    capgemini: {
      active: true,
      role: 'Software Engineer', date: 'April 2022 - Present',
      achivements: [`Implemented scalable REST APIs on enterprise-level microservices and created workflows using Uber Cadence while working as a backend developer`,
        `Worked with C#, .NET, Azure, MSSQL, Jira, Git, Docker`,
        `Engage in daily communication with diverse groups of professionals from various disciplines, including engineers, designers, producers, and clients, to foster collaborative efforts and ensure successful project outcomes.`]
    },
    bano: {
      active: false,
      role: 'MERN Stack Intern', date: 'March 2022 - May 2022',
      achivements: [`Through the implementation of React Native and Expo technologies, I designed and developed mobile applications that are fully responsive and optimized for seamless performance on both Android and iOS platforms.`,
        `I used React and CSS Frameworks to add new features and improve user experience, resulting in better performance, higher engagement, and increased satisfaction from web users.`]
    },
  })

  const aboutRef = useRef<null | HTMLDivElement>(null);
  const experienceRef = useRef<null | HTMLDivElement>(null);
  const workRef = useRef<null | HTMLDivElement>(null);
  const contactRef = useRef<null | HTMLDivElement>(null);

  return (
    <>
      <Nav
        aboutRef={aboutRef}
        contactRef={contactRef}
        experienceRef={experienceRef}
        workRef={workRef}
      />
      <div className={`xs:px-12 md:px-36 w-full h-full ${montserrat.className}`}>
        <section className='min-h-screen flex justify-start items-center w-full'>
          <div className='flex flex-col xs:gap-3 sm:gap-4 md:gap-6 justify-start items-start w-full leading-loose tracking-widest'>
            <h1 className='sm:pl-1 text-lg text-secondary'>Hi, my name is </h1>
            <h1 className='xs:text-4xl sm:text-5xl md:text-7xl font-bold text-ternary'>Prasenjit Pawar.</h1>
            <h1 className='xs:text-4xl sm:text-5xl md:text-7xl font-bold'>I build things on internet.</h1>
          </div>
        </section>

        {/* about me  */}
        <section ref={aboutRef} className='mb-4'>
          <div className='py-14'>
            <h1 className='text-2xl mb-11 font-bold underline text-secondary underline-offset-4 capitalize'>about me 😃</h1>
            <div className='flex xs:flex-col md:flex-col xl:flex-row w-full gap-12 justify-between'>
              <div className='w-full tracking-wide'>
                <p className='text-md'>Hi there 👋, I am Prasenjit Pawar, a software engineer passionate about building innovative and high-quality web applications 🚀. With expertise in frontend and backend development, I also bring a unique skill set to every project.
                  I have extensive experience working with various technologies, including React, Tailwind CSS, Node.js, and .NET Core. <br /><br />
                  I began my career as an <a className='text-secondary hover:underline cursor-pointer' target="_blank" rel="noopener noreferrer" href='https://www.banao.tech/'>intern at a startup</a>, where I developed a deep understanding of the industry and honed my technical skills.
                  I am a <a className='text-secondary hover:underline cursor-pointer' target="_blank" rel="noopener noreferrer" href='https://www.capgemini.com/'>software engineer at Capgemini</a>, where I continue to deliver exceptional results and contribute to the team&apos;s success.
                  <br /><br /> I will be a perfect choice if you are looking for a skilled and dedicated software engineer who can deliver exceptional results. Contact me today to discuss your project requirements and learn how I can help you achieve your goals.</p>
              </div>
              <div className='w-full xs:hidden xl:block'>
                {/* progile  */}
                <Image src={"/images/me.jpg"} alt="me" width={200} height={200}
                  className={'opacity-50 shadow-2xl border-2 border-secondary p-2'} />
              </div>
            </div>
          </div>
        </section>

        {/*  experience  */}
        <section ref={experienceRef} className='w-full'>
          <div className='flex flex-col items-center py-14'>
            <h1 className='text-2xl mb-11 font-bold underline text-secondary underline-offset-4 capitalize'>Where I&apos;ve worked 💼</h1>
            <div className='flex xs:flex-col md:flex-row gap-12'>
              <ul className='flex  xs:flex-row md:flex-col'>
                <li
                  onClick={() => setWorkData({
                    ...workData,
                    capgemini: { ...workData.capgemini, active: true },
                    bano: { ...workData.bano, active: false },
                  })}
                  className={`p-2 xs:border-b-2 md:border-b-0 xs:border-l-0 md:border-l-2 transition duration-500 cursor-pointer 
                  ${workData.capgemini.active ? 'border-secondary bg-[#2b313f] text-secondary' : 'border-[#7f8596]'} `}>
                  Capgemini
                </li>

                <li
                  onClick={() => setWorkData({
                    ...workData,
                    bano: { ...workData.bano, active: true },
                    capgemini: { ...workData.capgemini, active: false },
                  })}
                  className={`p-2 xs:border-b-2 md:border-b-0 xs:border-l-0 md:border-l-2 transition duration-500 cursor-pointer
                  ${workData.bano.active ? 'border-secondary bg-[#2b313f] text-secondary' : 'border-[#7f8596] '}`}>
                  Banao Technologies</li>
              </ul>
              <div>
                {workData.capgemini.active &&
                  <div className='flex flex-col py-2 max-w-md'>
                    <h1 className='capitalize text-ternary font-bold'> {workData.capgemini.role} <span className='text-secondary'>@ Capgemini</span></h1>
                    <h1 className='text-sm'> {workData.capgemini.date} </h1>
                    <ul>
                      {workData.capgemini.achivements.map((l, i) =>
                        <li className='list-disc py-2 text-secondary' key={i}><p>{l}</p></li>
                      )}
                    </ul>
                  </div>
                }
                {workData.bano.active &&
                  <div className='flex flex-col py-2 max-w-md'>
                    <h1 className='capitalize text-ternary font-bold'> {workData.bano.role} <span className='text-secondary'>@ Banao Technologies</span></h1>
                    <h1 className='text-sm'> {workData.bano.date} </h1>
                    <ul>
                      {workData.bano.achivements.map((l, i) =>
                        <li className='list-disc py-2 text-secondary' key={i}><p>{l}</p></li>
                      )}
                    </ul>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>


        {/* projects  */}
        <section ref={workRef} className='mb-4'>
          <div className='py-14'>
            <h1 className='text-2xl mb-11 font-bold underline text-secondary underline-offset-4 capitalize'>Things I&apos;ve build ⚙️</h1>
            <div className='flex flex-col'>
              {/* prj 1 */}
              <a target="_blank" rel="noopener noreferrer" href='https://resume-builder-frontend-ten.vercel.app/'
                className='relative mb-32 transition duration-700'>
                <div className='relative bg-[#1c2234] w-fit rounded p-2 cursor-pointer shadow hover:shadow-2xl'>
                  <h1 className='text-ternary text-2xl font-bold mb-3'>Resume builder </h1>
                  <p className='text-primary'>A simple tool for building resume <br />
                    <span className='capitalize text-secondary'>tech stack used:</span> React.js, Express, Tailwind CSS, Prisma, MongoDB
                  </p>
                  <Image alt='resumebuilder' width={200} height={200}
                    className='absolute w-96 xs:hidden xl:block -right-72 -top-2 opacity-50 -z-10'
                    src='/images/resumebuilder.png' />
                </div>
              </a>
            </div>
          </div>
        </section>


        {/* contact  */}
        <section ref={contactRef} className='mb-4'>
          <div className='py-12 flex flex-col min-h-screen justify-between items-center'>
            <div className='flex flex-col flex-grow gap-5 justify-center items-center'>
              <div className='flex flex-col justify-center items-center'>
                <h1 className='text-md text-secondary  capitalize'>
                  what&apos;s next?
                </h1>
                <h1 className='font-bold capitalize text-ternary text-3xl'>get in touch</h1>
              </div>
              <a className='p-3 text-secondary border-secondary border-2 transition duration-400
                hover:text-ternary hover:border-ternary'
                target="_blank" rel="noopener noreferrer" href={`mailto: prasenjitpawar22@gmail.com}`}> Say Hello</a>
              <p className='max-w-lg text-center'>Please don&apos;t hesitate to reach out to me with any opportunities or simply to say hello.
                My inbox is always open and I&apos;ll make sure to get back to you as soon as possible.
                Whether you have a query or just want to connect, I look forward to hearing from you!</p>
            </div>

            <div className='flex flex-col gap-2'>
              <ul className='flex items-center justify-center gap-2'>
                <li className='hover:text-secondary hover:cursor-pointer'>
                  <a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/in/prasenjit-pawar-2b378b77/">
                    <AiFillLinkedin size={30} />
                  </a>
                </li>
                <li className='hover:text-secondary hover:cursor-pointer'>
                  <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/PrasenjitPawar">
                    <AiFillTwitterCircle size={30} />
                  </a>
                </li>
                <li className='hover:text-secondary hover:cursor-pointer'>
                  <a target="_blank" rel="noopener noreferrer" href="https://github.com/prasenjitpawar22">
                    <AiFillGithub size={30} />
                  </a>
                </li>
              </ul>
              <a target="_blank" rel="noopener noreferrer" href="https://github.com/prasenjitpawar22/profile-web" className='text-ternary text-sm '>
                Design copyed from{' '}
                <a className='text-secondary transition duration-300 hover:underline '
                  target="_blank" rel="noopener noreferrer" href="https://github.com/bchiang7">@Brittany Chiang</a>
                {' &'} Build By Prasenjit Pawar
              </a>
            </div>
          </div>
        </section>
      </div >
    </>
  )
}
