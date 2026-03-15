import { React, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/use.auth.js";
import "../auth.from.scss";
import AnimatedBackground from "../../interview/components/AnimatedBackground";

const Register = () => {
  const navigate = useNavigate();
  const { Loading, handelRegister } = useAuth();
  const [username, setusername] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");

  const handelsubmit = async (e) => {
    e.preventDefault();

    handelRegister({ username, email, password });
    navigate("/");
  };
  if (Loading) {
    return (
      <main className="auth-page">
        <AnimatedBackground variant="auth" />
        <div className="auth-spinner" />
      </main>
    );
  }
  return (
    <main className="auth-page">
      <AnimatedBackground variant="auth" />
      <div className="from-container">
        <h1>Register</h1>
        <form onSubmit={handelsubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              onChange={(e) => {
                setusername(e.target.value);
              }}
              type="text"
              id="username"
              placeholder="username"
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              onChange={(e) => {
                setemail(e.target.value);
              }}
              type="email"
              id="email"
              placeholder="email"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              onChange={(e) => {
                setpassword(e.target.value);
              }}
              type="password"
              id="password"
              placeholder="password"
            />
          </div>
          <button className="button primary-button">Register</button>
        </form>
        <p>
          Already have an account? <Link to={"/login"}>Login</Link>
        </p>
      </div>
    </main>
  );
};
export default Register;
