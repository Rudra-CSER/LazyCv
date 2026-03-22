import {createBrowserRouter, Navigate} from 'react-router'
import Login from './features/auth/pages/login'
import Register from './features/auth/pages/register'
import Protected from './features/auth/components/protected'
import Home from './features/interview/pages/home'
import Interview from './features/interview/pages/interview'
import LandingPage from './features/landing/pages/LandingPage'


export const router = createBrowserRouter([
  {
    // Public landing page — entry point for all new visitors
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    // Protected app — the interview tool (was previously "/")
    path: "/app",
    element: <Protected><Home/></Protected>
  },
  {
    path: "/interview/:interviewId",
    element: <Protected><Interview /></Protected>
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
])
