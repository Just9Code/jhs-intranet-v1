"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "w-full max-w-sm bg-gradient-to-br from-zinc-800/40 via-zinc-900/35 to-zinc-950/45 backdrop-blur-2xl text-white border-2 border-white/30 shadow-[0_10px_40px_rgba(0,191,191,0.5)] rounded-2xl px-4 py-3.5 min-h-[60px] flex items-center gap-3 animate-in slide-in-from-top-full fade-in zoom-in-95 duration-500",
          title: "text-white font-bold text-base leading-tight drop-shadow-lg",
          description: "text-white/90 text-sm font-medium mt-1 leading-snug drop-shadow-md",
          actionButton: "bg-gradient-to-r from-primary via-cyan-500 to-primary hover:scale-105 text-white rounded-xl font-bold px-4 py-2 shadow-xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 ml-auto text-sm",
          cancelButton: "bg-white/15 text-white rounded-xl px-4 py-2 backdrop-blur-xl border border-white/30 hover:bg-white/25 hover:scale-105 transition-all duration-300 font-medium text-sm",
          error: "!bg-gradient-to-br !from-red-500/40 !via-red-600/35 !to-zinc-900/45 !border-red-400/70 !shadow-[0_10px_40px_rgba(239,68,68,0.6)]",
          success: "!bg-gradient-to-br !from-emerald-500/40 !via-emerald-600/35 !to-zinc-900/45 !border-emerald-400/70 !shadow-[0_10px_40px_rgba(16,185,129,0.6)]",
          warning: "!bg-gradient-to-br !from-orange-500/40 !via-orange-600/35 !to-zinc-900/45 !border-orange-400/70 !shadow-[0_10px_40px_rgba(249,115,22,0.6)]",
          info: "!bg-gradient-to-br !from-primary/40 !via-cyan-500/35 !to-zinc-900/45 !border-primary/70 !shadow-[0_10px_40px_rgba(0,191,191,0.6)]",
          loading: "!bg-gradient-to-br !from-primary/40 !via-cyan-500/35 !to-zinc-900/45 !border-primary/70 !shadow-[0_10px_40px_rgba(0,191,191,0.6)]",
          icon: "scale-125 flex-shrink-0 drop-shadow-2xl",
        },
        duration: 5000,
        style: {
          fontSize: '14px',
          fontWeight: '500',
        },
      }}
      style={{
        zIndex: 999999,
      }}
      {...props}
    />
  )
}

export { Toaster }