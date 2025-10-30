/**
 * OAuthButtons Component
 * Render button for Google sign-in
 */

import { GoogleLogin } from "@react-oauth/google";
import { useAuthContext } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Remove the interface entirely if no props are needed
// Or keep it empty for future expansion
interface OAuthButtonsProps {
  // Reserved for future props
}

export function OAuthButtons({}: OAuthButtonsProps = {}) {
  const { oauthLogin } = useAuthContext();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    console.log("[OAuthButtons] Google login success");
    if (!credentialResponse.credential) {
      console.error("[OAuthButtons] No credential in response");
      return;
    }

    try {
      console.log("[OAuthButtons] Calling oauthLogin with Google credential");
      await oauthLogin("google", credentialResponse.credential);
      console.log("[OAuthButtons] oauthLogin completed successfully");

      // Navigate to home after successful OAuth login
      navigate("/", { replace: true });
    } catch (error) {
      console.error("[OAuthButtons] Failed to process Google login:", error);
    }
  };

  const handleGoogleError = () => {
    console.error("[OAuthButtons] Google OAuth login failed");
  };

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Google OAuth Button */}
      <div className="w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={false}
          theme="outline"
          size="large"
          text="continue_with"
          width="100%"
        />
      </div>
    </div>
  );
}
