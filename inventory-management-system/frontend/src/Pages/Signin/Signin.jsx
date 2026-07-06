import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { validateEmail, validatePassword, validatePersonName } from "../../utils/validation";
import "./Signin.css";
import signinImg1 from "../../assets/image/signin.img.avif";
import signinImg2 from "../../assets/image/A2.jpg";
import signinImg3 from "../../assets/image/A1.png";

const SLIDER_IMAGES = [signinImg1, signinImg2, signinImg3];

// All authenticated roles go to the admin dashboard
const getDashboardPath = () => "/admin/dashboard";

function SignIn() {
  const [isLogin, setIsLogin] = useState(true);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Handle Theme forcing (always gold/light) & Image preloading
  useEffect(() => {
    const originalTheme = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");

    SLIDER_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    return () => {
      if (originalTheme) {
        document.documentElement.setAttribute("data-theme", originalTheme);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    };
  }, []);

  // Handle image slider interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    const emailError = validateEmail(email.trim());
    if (emailError) {
      setError(emailError);
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate(getDashboardPath(), { replace: true });
    } else {
      setError(result.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirm.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    
    const nameError = validatePersonName(regName.trim());
    if (nameError) { setError(nameError); return; }
    
    const emailError = validateEmail(regEmail.trim());
    if (emailError) { setError(emailError); return; }
    
    const passError = validatePassword(regPassword);
    if (passError) { setError(passError); return; }

    if (regPassword !== regConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const result = await register(regName.trim(), regEmail.trim(), regPassword);
    setLoading(false);
    if (result.success) {
      navigate(getDashboardPath(), { replace: true });
    } else {
      setError(result.message);
    }
  };

  const switchToSignup = () => { setIsLogin(false); setError(""); };
  const switchToLogin  = () => { setIsLogin(true);  setError(""); };

  return (
    <div className="signin-page" data-theme="light">
      <div className="signin-card">

        {/* ── Left: Image Panel ───────────────────────── */}
        <div className="signin-image">
          {SLIDER_IMAGES.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Inventory Management ${index + 1}`}
              className={index === currentImgIndex ? "active" : ""}
            />
          ))}
        </div>

        {/* ── Right: Form Panel ───────────────────────── */}
        <div className="signin-form-panel">
          <div className="signin-form-inner">

            {isLogin ? (
              <>
                <div className="signin-header">
                  <h1>Welcome back</h1>
                  <p>Sign in to your account to continue</p>
                </div>

                {error && (
                  <div className="signin-error" role="alert">{error}</div>
                )}

                <form onSubmit={handleLogin} noValidate className="signin-form">
                  <div className="form-group">
                    <label htmlFor="login-email">Email address</label>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div className="label-row">
                      <label htmlFor="login-password">Password</label>
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                      Forgot password?
                    </a>
                  </div>

                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loading}
                    style={{ width: "100%", marginTop: "4px" }}
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </button>
                </form>

                <div className="signin-divider"><span>or continue with</span></div>

                <div className="social-row">
                  <button type="button" className="social-btn">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button type="button" className="social-btn">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                      <path d="M12.545 0c.108 1.02-.295 2.04-.876 2.778-.593.75-1.56 1.334-2.527 1.262-.127-.96.35-1.98.898-2.645C10.617.695 11.65.094 12.545 0ZM16.2 12.615c-.432 1.008-.955 1.94-1.663 2.766-.7.814-1.43 1.616-2.527 1.628-1.066.012-1.41-.634-2.63-.634-1.218 0-1.6.622-2.61.646-1.052.024-1.855-.848-2.56-1.664C2.587 13.19 1.512 10.52 1.512 7.95c0-2.532 1.314-3.87 2.61-3.882 1.02-.012 1.982.688 2.61.688.627 0 1.802-.85 3.037-.726.516.022 1.966.208 2.898 1.572-.075.047-1.73 1.01-1.71 3.012.02 2.387 2.094 3.182 2.118 3.193a9.32 9.32 0 0 1-.875 2.808Z"/>
                    </svg>
                    Apple
                  </button>
                </div>

                <p className="switch-text">
                  Don&apos;t have an account?{" "}
                  <span onClick={switchToSignup} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && switchToSignup()}>
                    Create one
                  </span>
                </p>

                <p className="demo-hint">
                  Demo: <strong>admin@inventory.com</strong> / <strong>Admin@123!</strong>
                </p>
              </>
            ) : (
              <>
                <div className="signin-header">
                  <h1>Create account</h1>
                  <p>Start managing your inventory today</p>
                </div>

                {error && (
                  <div className="signin-error" role="alert">{error}</div>
                )}

                <form onSubmit={handleRegister} noValidate className="signin-form">
                  <div className="form-group">
                    <label htmlFor="reg-name">Full name</label>
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-email">Email address</label>
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-pass">Password</label>
                    <input
                      id="reg-pass"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-confirm">Confirm password</label>
                    <input
                      id="reg-confirm"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loading}
                    style={{ width: "100%", marginTop: "4px" }}
                  >
                    {loading ? "Creating…" : "Create account"}
                  </button>
                </form>

                <div className="signin-divider"><span>or continue with</span></div>

                <div className="social-row">
                  <button type="button" className="social-btn">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button type="button" className="social-btn">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                      <path d="M12.545 0c.108 1.02-.295 2.04-.876 2.778-.593.75-1.56 1.334-2.527 1.262-.127-.96.35-1.98.898-2.645C10.617.695 11.65.094 12.545 0ZM16.2 12.615c-.432 1.008-.955 1.94-1.663 2.766-.7.814-1.43 1.616-2.527 1.628-1.066.012-1.41-.634-2.63-.634-1.218 0-1.6.622-2.61.646-1.052.024-1.855-.848-2.56-1.664C2.587 13.19 1.512 10.52 1.512 7.95c0-2.532 1.314-3.87 2.61-3.882 1.02-.012 1.982.688 2.61.688.627 0 1.802-.85 3.037-.726.516.022 1.966.208 2.898 1.572-.075.047-1.73 1.01-1.71 3.012.02 2.387 2.094 3.182 2.118 3.193a9.32 9.32 0 0 1-.875 2.808Z"/>
                    </svg>
                    Apple
                  </button>
                </div>

                <p className="switch-text">
                  Already have an account?{" "}
                  <span onClick={switchToLogin} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && switchToLogin()}>
                    Sign in
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default SignIn;