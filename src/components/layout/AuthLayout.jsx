import { Outlet } from "react-router";
import { Logo } from "../ui/index.js";

export function AuthLayout() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center px-5 py-8 tablet:justify-center tablet:px-6 tablet:py-10"
    >
      <div className="flex w-full flex-col gap-6 tablet:max-w-[480px] desktop:max-w-[520px] large:max-w-[600px]">
        <div className="flex justify-center">
          <Logo withWordmark />
        </div>
        <Outlet />
      </div>
    </main>
  );
}
