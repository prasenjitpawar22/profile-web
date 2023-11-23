import PageMainBlockHolder from "@/components/page-main-block-holder";

export default function Home() {
  return (
    <div className="h-screen bg-background">
      <div className="flex flex-col items-center justify-center">
        <div className="xl:w-[500px] md:w-[300px] w-[200px]">
          <PageMainBlockHolder />
        </div>
      </div>
    </div>
  );
}
