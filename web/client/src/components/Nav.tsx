import { useLocation } from "preact-iso";

const links = [
  { path: "/", label: "Overview" },
  { path: "/sleep", label: "Sleep" },
  { path: "/heart-rate", label: "Heart Rate" },
  { path: "/stress", label: "Stress" },
  { path: "/activities", label: "Activities" },
  { path: "/training", label: "Training" },
  { path: "/trends", label: "Trends" },
];

export function Nav() {
  const { path } = useLocation();

  return (
    <nav>
      {links.map((link) => (
        <a
          key={link.path}
          href={link.path}
          class={path === link.path ? "active" : ""}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
