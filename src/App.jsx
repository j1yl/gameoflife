import Canvas from "./components/Canvas";

function App() {
  return (
    <div className="h-full min-h-screen w-full">
      <div className="fixed left-0 top-0 z-20 flex min-h-screen w-full items-start">
        <div className="flex w-full items-center justify-center bg-neutral-300 py-1 opacity-75">
          <p className="font-serif text-xs text-black">
            Conway&apos;s Game of Life
          </p>
        </div>
      </div>
      <Canvas />
    </div>
  );
}

export default App;
