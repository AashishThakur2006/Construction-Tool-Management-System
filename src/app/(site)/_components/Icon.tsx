/* Small inline icon set — Lucide-style, 24 viewBox, 1.75 stroke. */
const P: Record<string, React.ReactNode> = {
  boxes: (
    <>
      <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 1.03 1.75l3 1.65a2 2 0 0 0 1.94 0L10 20.35" />
      <path d="M7 16.5 3.13 14.5M7 16.5v5M7 16.5l3.87-2M10 8.35V20.5a2 2 0 0 1-1.03 1.75l-3 1.65" opacity="0" />
      <path d="M10.99 12.92A2 2 0 0 0 10 14.63v3.24a2 2 0 0 0 1.03 1.75l3 1.65a2 2 0 0 0 1.94 0l3-1.65A2 2 0 0 0 20 17.87v-3.24a2 2 0 0 0-.97-1.71l-3-1.65a2 2 0 0 0-1.94 0Z" />
      <path d="m14 21.5-3-1.65M17 16.5l3-1.65M17 16.5v5M17 16.5l-3-1.65" />
      <path d="M6.97 4.42A2 2 0 0 0 6 6.13v3.24a2 2 0 0 0 1.03 1.75l3 1.65a2 2 0 0 0 1.94 0l3-1.65A2 2 0 0 0 17 9.37V6.13a2 2 0 0 0-.97-1.71l-3-1.65a2 2 0 0 0-1.94 0Z" />
      <path d="M12 13.5V8M8 6.15 12 8l4-1.85" />
    </>
  ),
  shuffle: (
    <>
      <path d="M4 7h3.5c1.5 0 2.5 1 3.5 2.5" />
      <path d="M20 17H16.5c-1.5 0-2.5-1-3.5-2.5" />
      <path d="M4 17h3.5c3 0 5-9 8.5-9H20" />
      <path d="m17 5 3 3-3 3M17 14l3 3-3 3" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.6 2.6l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.3-2.3z" />
  ),
  receipt: (
    <>
      <path d="M5 3v18l2-1.4L9 21l2-1.4L13 21l2-1.4L17 21l2-1.4V3l-2 1.4L15 3l-2 1.4L11 3 9 4.4 7 3z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5L19.5 7" />,
  shield: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c.6-3.6 2.8-5.5 5.5-5.5s4.9 1.9 5.5 5.5" />
      <path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.9M17.2 14.9c1.8.7 3 2.4 3.4 5.1" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
};

export default function Icon({
  name,
  className,
}: {
  name: keyof typeof P | string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {P[name] ?? null}
    </svg>
  );
}
