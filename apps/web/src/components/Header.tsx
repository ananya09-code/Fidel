export default function Header() {
  return (
    <header className="border-b px-6 py-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <h1 className="text-xl font-bold">Fidel</h1>

        <div className="flex gap-6">
          <a href="/">Home</a>
          <a href="/about">About</a>
        </div>
      </nav>
    </header>
  );
}
