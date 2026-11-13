import { Link } from "react-router";
import { IconButton } from "../ui/index.js";

const SHORTCUTS = {
  search: { to: "/search", icon: "search", label: "Search" },
  settings: { to: "/settings", icon: "settings", label: "Settings" },
};

// phoneShortcuts: names from SHORTCUTS shown only on phone (the nav has no room for them there).
export function PageHeader({ title, subtitle, actions, leading, phoneShortcuts = [] }) {
  return (
    <header className="flex items-center gap-3 py-2">
      {leading}
      <div className="min-w-0 flex-1">
        <h1 className="font-sans text-[22px] leading-tight font-bold text-text desktop:text-[26px] large:text-[30px]">
          {title}
        </h1>
        {subtitle ? <p className="text-[14px] text-text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      {phoneShortcuts.map((name) => {
        const item = SHORTCUTS[name];
        return (
          <IconButton
            key={name}
            as={Link}
            to={item.to}
            icon={item.icon}
            label={item.label}
            className="tablet:hidden"
          />
        );
      })}
    </header>
  );
}
