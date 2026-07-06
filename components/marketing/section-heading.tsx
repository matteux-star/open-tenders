import { cn } from "@/lib/utils"

export function SectionHeading({
  title,
  description,
  className,
  dark = false,
}: {
  title: string
  description?: string
  className?: string
  dark?: boolean
}) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <h2
        className={cn(
          "text-2xl leading-tight font-bold sm:text-3xl md:text-4xl",
          dark ? "text-gray-100" : "text-gray-950"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-7 sm:text-lg",
            dark ? "text-gray-400" : "text-gray-700"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
