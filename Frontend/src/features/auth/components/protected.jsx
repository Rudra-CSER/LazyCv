import { useAuth } from "../hooks/use.auth";
import { Navigate } from "react-router";

const Protected = ({ children }) => {
  const { Loading, user } = useAuth();

  if (Loading) {
    return (
      <main style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080d0b"
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: "3px solid rgba(0,255,136,0.15)",
          borderTop: "3px solid #00ff88",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!user) {
    return <Navigate to={"/login"} />;
  }
  return children;
};

export default Protected;
