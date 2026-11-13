import { ICONS } from "../../lib/icons.js";

// Renders a react-icons component by name. Decorative by default; give the surrounding button the accessible label.
export function Icon({ name, size = 20, className }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return (
    <Component
      size={size}
      strokeWidth={1.9}
      aria-hidden="true"
      focusable="false"
      className={className}
    />
  );
}
