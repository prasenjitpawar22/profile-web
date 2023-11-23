export default function DiscoButton() {
  return (
    <div className="relative h-[100px] flex items-center justify-center w-[200px] border">
      <button className="absolute px-12  rounded-full py-2 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border h-fit w-fit">
        <span className="absolute w-full h-full inset-0 animate-gradient-disco rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500"></span>
        <span className="absolute w-[97%] h-[90%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full"></span>
        <span className="relative text-black/[0.7]">Hello</span>
      </button>
    </div>
  );
}
