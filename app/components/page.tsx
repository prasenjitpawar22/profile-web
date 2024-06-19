import DiscoButton from "@/components/weekend-components/disco-button";
import InlinePopup from "@/components/weekend-components/inline-popup";
import NavbarHoveredPath from "@/components/weekend-components/navbar-hovered-path";

export default function Page() {
  return (
    <main className="flex min-h-screen p-24 gap-4 flex-wrap">
      <div className="w-[70%] gap-4 flex flex-col">
        <h1 className="text-4xl font-bold text-stone-800">
          My Weekend Pursuits in Building Innovative Component and learning
          Design.
        </h1>
        <p className="text-base text-stone-700 tracking-wide ">
          Welcome to my weekend code showcase! This is where I document all my
          weekend coding experiments, dedicated to learning and building
          innovative components.
        </p>
      </div>
      <div className="flex gap-4 flex-wrap">
        <div>
          <InlinePopup />
        </div>
        <div className="">
          <DiscoButton />
        </div>
        <div>
          <NavbarHoveredPath />
        </div>
      </div>
    </main>
  );
}
