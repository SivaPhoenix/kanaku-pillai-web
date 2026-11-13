import { cn } from "../../lib/cn.js";

export function Card({ as: Component = "section", className, children, ...rest }) {
  return (
    <Component className={cn("rounded-2xl surface-l1 p-4 tablet:p-5", className)} {...rest}>
      {children}
    </Component>
  );
}
