import { GoogleLogin } from "@react-oauth/google";
import { config } from "../../lib/config.js";
import { useTheme } from "../../hooks/useTheme.js";

export function GoogleSignInButton({ onCredential, onError }) {
  const { scheme } = useTheme();
  if (!config.googleClientId) return null;
  return (
    <div className="flex justify-center">
      <GoogleLogin
        text="continue_with"
        shape="rectangular"
        size="large"
        width={320}
        theme={scheme === "dark" ? "filled_black" : "outline"}
        onSuccess={({ credential }) => {
          if (credential) onCredential(credential);
          else onError?.();
        }}
        onError={() => onError?.()}
      />
    </div>
  );
}
