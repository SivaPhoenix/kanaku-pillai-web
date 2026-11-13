import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { Input } from "./Input.jsx";

export function PasswordInput({ ref, ...rest }) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Hide password" : "Show password";
  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          aria-label={label}
          onClick={() => setVisible((v) => !v)}
          className="inline-flex size-11 items-center justify-center rounded-lg text-text-muted-2"
        >
          <Icon name={visible ? "eyeOff" : "eye"} size={20} />
        </button>
      }
      {...rest}
    />
  );
}
