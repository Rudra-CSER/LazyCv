import { useState } from "react";
import "../auth.from.scss";
import { Link, useNavigate, Navigate } from "react-router";
import { useAuth } from "../hooks/use.auth.js";
import AnimatedBackground from "../../interview/components/AnimatedBackground";

const Login = () => {
  const { Loading, user, handelLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  const handelSubmit = async (e) => {
    e.preventDefault();
    setLoginError(false);
    const success = await handelLogin({ email, password });
    if (success) navigate("/app");
    else setLoginError(true);
  };

  if (Loading) {
    return (
      <main className="auth-page">
        <AnimatedBackground variant="auth" />
        <div className="auth-spinner" />
      </main>
    );
  }

  if (user) return <Navigate to="/app" replace />;
  return (
    <main className="auth-page">
      <AnimatedBackground variant="auth" />
      <div className="from-container">
        <h1>Login</h1>
        <form onSubmit={handelSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="email"
              onChange={(e) => {
                setemail(e.target.value);
              }}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="password"
              onChange={(e) => {
                setpassword(e.target.value);
              }}
            />
          </div>
          {loginError && (
            <div className="auth-error">
              <i className="ri-error-warning-line" />
              <span>
                Wrong email or password. Please double-check your credentials
                or <Link to="/register">create a new account</Link>.
              </span>
            </div>
          )}
          <button className="button primary-button">Login</button>
        </form>
        <p>
          New User? <Link to={"/register"}>Register</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
