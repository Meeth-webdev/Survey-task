import { createFileRoute } from '@tanstack/react-router'
import AmbientBackground from '@/components/shared/AmbientBackground'
import { Button } from '@/components/ui/button'
import '../index.css'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden selection:bg-white/20">
      <AmbientBackground />

      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl">
          <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Survicate
          </span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg font-light tracking-wide text-zinc-400 sm:text-xl md:text-2xl">
          The thoughtful way to gather feedback
        </p>

        {/* 2. Action Buttons Container */}
        <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
          {/* Primary Action */}
          <Button
            size="lg"
            className="min-w-[140px] border border-zinc-600 rounded-full px-8 text-zinc-300 hover:text-white font-medium"
          >
            <a href="http://localhost:8787/api/auth/google">Sign up</a>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="min-w-[140px] rounded-full border-zinc-600 bg-transparent px-8 text-base font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            <a href="http://localhost:8787/api/auth/google">Login</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
