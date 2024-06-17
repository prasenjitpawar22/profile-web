import DiscoButton from "@/components/weekend-components/disco-button";
import InlinePopup from "@/components/weekend-components/inline-popup";
import NavbarHoveredPath from "@/components/weekend-components/navbar-hovered-path";

export default function Page() {
  return (
    <main className="flex min-h-screen p-24 gap-4 flex-wrap">
      <div>
        <InlinePopup />
      </div>
      <div className="">
        <DiscoButton />
      </div>
      <div>
        <NavbarHoveredPath />
      </div>
    </main>
  );
}
