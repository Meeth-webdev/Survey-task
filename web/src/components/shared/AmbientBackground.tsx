import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { useEffect } from 'react'

export default function AmbientBackground() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseX.set(event.clientX)
      mouseY.set(event.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [mouseX, mouseY])

  const mouseGradient = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.08), transparent 80%)`

  return (
    // Changed -z-10 to absolute inset-0 z-0
    <div className="absolute inset-0 z-0 min-h-full w-full overflow-hidden bg-[#030303]">
      <motion.div
        animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-slate-500/[0.1] blur-[100px]"
      />

      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-zinc-500/[0.08] blur-[120px]"
      />

      <motion.div
        style={{ background: mouseGradient }}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Grid visibility increased significantly to #ffffff25 */}
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#ffffff26_1px,transparent_1px),linear-gradient(to_bottom,#ffffff26_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>
  )
}
