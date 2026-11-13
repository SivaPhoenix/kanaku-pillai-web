import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Input, PasswordInput, Segmented, Switch } from "./index.js";

describe("PasswordInput", () => {
  it("toggles the input type and the button label", async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });
});

describe("Segmented", () => {
  const options = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
    { value: "c", label: "Gamma" },
  ];

  it("calls onChange on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented aria-label="Letters" options={options} value="a" onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("calls onChange on ArrowRight", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented aria-label="Letters" options={options} value="a" onChange={onChange} />);
    screen.getByRole("radio", { name: "Alpha" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("b");
  });
});

describe("Switch", () => {
  it("toggles aria-checked", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [on, setOn] = useState(false);
      return <Switch label="Notifications" checked={on} onChange={setOn} />;
    }
    render(<Harness />);
    const sw = screen.getByRole("switch", { name: "Notifications" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });
});

describe("Input", () => {
  it("shows the error and marks the input invalid", () => {
    render(<Input label="Email" error="Enter a valid email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription("Enter a valid email");
  });
});

describe("Button", () => {
  it("disables and sets aria-busy while loading", () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
