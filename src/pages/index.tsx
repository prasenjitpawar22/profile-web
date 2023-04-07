import Image from 'next/image'
import { Montserrat } from 'next/font/google'
import Nav from '@/components/Nav'
import React, { useEffect, useState } from 'react'

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

  // useEffect(() => {
  //   console.log(workData.bano.role);

  // })

  return (
    <>
      <Nav />
      <div className={`xs:px-12 md:px-36 w-full h-full ${montserrat.className}`}>
        <section className='min-h-screen flex justify-start items-center w-full'>
          <div className='flex flex-col xs:gap-3 sm:gap-4 md:gap-6 justify-start items-start w-full leading-loose tracking-widest'>
            <h1 className='sm:pl-1 text-lg text-secondary'>Hi, my name is </h1>
            <h1 className='xs:text-4xl sm:text-5xl md:text-7xl font-bold text-ternary'>Prasenjit Pawar.</h1>
            <h1 className='xs:text-4xl sm:text-5xl md:text-7xl font-bold'>I build things on internet.</h1>
          </div>
        </section>

        {/* about me  */}
        <section className='min-h-screen mb-4'>
          <h1 className='text-2xl mb-11 font-bold underline text-secondary underline-offset-4 capitalize'>about me 😃</h1>
          <div className='flex xs:flex-col md:flex-col xl:flex-row gap-4 justify-between'>
            <div className='w-full tracking-wide'>
              <p className='text-md'>Hi there 👋, I am Prasenjit Pawar, a software engineer passionate about building innovative and high-quality web applications 🚀. With expertise in frontend and backend development, I also bring a unique skill set to every project.
                I have extensive experience working with various technologies, including React, Tailwind CSS, Node.js, and .NET Core. <br /><br />
                I began my career as an <span className='text-secondary'>intern at a startup</span>, where I developed a deep understanding of the industry and honed my technical skills. I am a <span className='text-secondary'>software engineer at Capgemini</span>, where I continue to deliver exceptional results and contribute to the team's success.
                <br /><br /> I will be a perfect choice if you are looking for a skilled and dedicated software engineer who can deliver exceptional results. Contact me today to discuss your project requirements and learn how I can help you achieve your goals.</p>
            </div>
            <div className='w-full md:hidden xl:block'>
              {/* progile  */}
            </div>
          </div>
        </section>

        {/* work experience  */}
        <section className='min-h-screen flex flex-col items-center w-full'>
          <h1 className='text-2xl mb-11 font-bold underline text-secondary underline-offset-4 capitalize'>Where I've worked 💼</h1>
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
        </section>


        {/* projects  */}
        <section className='min-h-full mb-4'>
          <h1 className='text-2xl mb-11 font-bold underline text-secondary underline-offset-4 capitalize'>Things I've build ⚙️</h1>
          <div className='flex flex-col'>
            {/* prj 1 */}
            <a target="_blank" rel="noopener noreferrer" href='https://resume-builder-frontend-ten.vercel.app/'
              className='relative mb-32 transition duration-700'>
              <div className='relative bg-[#1c2234] w-fit rounded p-2 cursor-pointer shadow hover:shadow-2xl'>
                <h1 className='text-ternary text-2xl font-bold mb-3'>Resume builder </h1>
                <p className='text-primary'>A simple tool for building resume <br />
                  <span className='capitalize text-secondary'>tech stack used:</span> React.js, Express, Tailwind CSS, Prisma, MongoDB
                </p>
                <img className='absolute w-96 xs:hidden xl:block -right-72 -top-2 opacity-50 -z-10' src='/images/resumebuilder.png' />
              </div>
            </a>
          </div>
        </section>


        {/* contact  */}

        <section className='flex flex-col gap-4 justify-center min-h-screen items-center'>
          <h1 className='text-md text-secondary  capitalize'>
            what's next?
          </h1>
          <h1 className='font-bold capitalize text-ternary text-3xl'>get in touch</h1>
          <a className='p-3 text-secondary border-secondary border-2 transition duration-400
          hover:opacity-50'
            // hover:bg-ternary hover:border-primary hover:text-primary'
            href={`mailto: prasenjitpawar22@gmail.com}`}> Say Hello</a>
        </section>

      </div >
    </>
  )
}
