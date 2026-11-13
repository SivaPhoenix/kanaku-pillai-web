import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AuthContext } from "../../context/auth-context.js";
import { ThemeContext } from "../../context/theme-context.js";
import { AppLayout } from "./AppLayout.jsx";

const user = {
  id: "1",
  name: "Asha Rao",
  email: "asha@example.com",
  avatarUrl: null,
  authMethods: ["password"],
  settings: { currencyCode: "INR", locale: "en-IN", tzid: "Asia/Kolkata", weekStart: "mon" },
};

function renderLayout() {
  return render(
    <ThemeContext.Provider value={{ mode: "system", scheme: "light", setMode: vi.fn() }}>
      <AuthContext.Provider value={{ status: "authenticated", user }}>
        <MemoryRouter initialEntries={["/month"]}>
          <AppLayout />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>,
  );
}

describe("AppLayout", () => {
  it("renders the primary navigation links", () => {
    renderLayout();
    for (const name of ["Month", "Daily", "Stats", "Accounts"]) {
      expect(screen.getAllByRole("link", { name }).length).toBeGreaterThan(0);
    }
  });

  it("renders a disabled New entry control and the main landmark", () => {
    renderLayout();
    const buttons = screen.getAllByRole("button", { name: "New entry" });
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => expect(button).toBeDisabled());
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});
