
import { cn } from "@/lib/utils";

const MandalaOverlay = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("absolute inset-0 z-0 opacity-10", className)}
      {...props}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="mandala-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>
        </defs>
        <g transform="translate(50 50)">
          {[...Array(12)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 30})`}>
              <circle
                cx="20"
                cy="0"
                r="5"
                fill="url(#mandala-gradient)"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="0.5"
              />
              <path
                d="M 0 0 C 10 10, 20 10, 30 0"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="0.5"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default MandalaOverlay;
