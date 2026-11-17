
import { useEffect, useState } from "react";
import api from "./services/api";

import Projects from "./Projects";
import Tasks from "./Tasks";
import Kanban from "./Kanban";
import TeamMembers from "./TeamMembers";

import "./App.css";
import "./Dashboard.css";

function App() {
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  // Dashboard states
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [activePage, setActivePage] = useState("Overview");

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password
      });

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      setLoggedIn(true);
      setPassword("");
      setActivePage("Overview");

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Login failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setLoggedIn(false);
    setUser(null);
    setProjects([]);
    setTasks([]);
    setEmail("");
    setPassword("");
    setError("");
    setDashboardError("");
    setActivePage("Overview");
  };

  // Load dashboard data
  const loadDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const results = await Promise.allSettled([
        api.get("/auth/me"),
        api.get("/projects/", {
          params: { page: 1, limit: 100 }
        }),
        api.get("/tasks/", {
          params: { page: 1, limit: 100 }
        })
      ]);

      // User information
      if (results[0].status === "fulfilled") {
        setUser(results[0].value.data);
      } else {
        throw results[0].reason;
      }

      // Projects
      if (results[1].status === "fulfilled") {
        const projectData = results[1].value.data;

        setProjects(
          Array.isArray(projectData)
            ? projectData
            : projectData.items || []
        );
      } else {
        setProjects([]);
      }

      // Tasks
      if (results[2].status === "fulfilled") {
        const taskData = results[2].value.data;

        setTasks(
          Array.isArray(taskData)
            ? taskData
            : taskData.items || []
        );
      } else {
        setTasks([]);
      }

      if (
        results[1].status === "rejected" ||
        results[2].status === "rejected"
      ) {
        setDashboardError(
          "Some dashboard information could not be loaded. Check your API permissions."
        );
      }

    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
        setError("Your session has expired. Please sign in again.");
      } else {
        setDashboardError(
          err.response?.data?.detail ||
          "Unable to load your dashboard."
        );
      }
    } finally {
      setDashboardLoading(false);
    }
  };

  // Automatically load dashboard after login
  useEffect(() => {
    if (loggedIn) {
      loadDashboard();
    }
  }, [loggedIn]);

  // Task statistics
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "Completed"
  ).length;

  // Dashboard
  if (loggedIn) {
    return (
      <div className="app-dashboard">

        {/* Sidebar */}
        <aside className="sidebar">

          <div className="sidebar-brand">
            <div className="brand-icon">P</div>
            <span>ProjectFlow</span>
          </div>

          <div className="sidebar-label">
            WORKSPACE
          </div>

          <nav className="sidebar-nav">
            {[
              { name: "Overview", icon: "▦" },
              { name: "Projects", icon: "◫" },
              { name: "Tasks", icon: "✓" },
              { name: "Kanban", icon: "▤" },
              { name: "Team Members", icon: "👥" }
            ].map((item) => (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                }}
              >
                <span>{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>

          {/* Sidebar user information */}
          <div className="sidebar-bottom">

            <div className="user-avatar">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="user-details">
              <strong>
                {user?.full_name || "User"}
              </strong>

              <span>
                {user?.email || "Loading profile..."}
              </span>
            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              ↪
            </button>

          </div>
        </aside>

        {/* Main dashboard */}
        <main className="dashboard-main">

          {/* Top navigation */}
          <header className="topbar">

            <div>
              <span className="topbar-label">
                WORKSPACE / {activePage.toUpperCase()}
              </span>

              <h1>{activePage}</h1>
            </div>

            <button
              className="refresh-btn"
              onClick={loadDashboard}
              disabled={dashboardLoading}
            >
              ↻ {dashboardLoading ? "Refreshing..." : "Refresh"}
            </button>

          </header>

          <section className="dashboard-content">

            {/* Dashboard error */}
            {dashboardError && (
              <div className="dashboard-error">
                {dashboardError}
              </div>
            )}

            {/* Loading */}
            {dashboardLoading && (
              <div className="loading-message">
                Loading your workspace...
              </div>
            )}

            {/* Overview page */}
            {!dashboardLoading && activePage === "Overview" && (
              <>

                <div className="welcome-banner">

                  <div>
                    <span>YOUR WORKSPACE</span>

                    <h2>
                      Welcome back, {user?.full_name || "User"}! 👋
                    </h2>

                    <p>
                      Here's what's happening with your projects today.
                    </p>
                  </div>

                  <div className="banner-decoration">
                    P
                  </div>

                </div>

                {/* Statistics */}
                <div className="stats-grid">

                  <div className="stat-card">
                    <span className="stat-icon purple">◫</span>

                    <p>Total Projects</p>

                    <h2>{projects.length}</h2>

                    <span className="stat-note">
                      Projects in workspace
                    </span>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon blue">✓</span>

                    <p>Total Tasks</p>

                    <h2>{tasks.length}</h2>

                    <span className="stat-note">
                      Tasks created
                    </span>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon green">✔</span>

                    <p>Completed Tasks</p>

                    <h2>{completedTasks}</h2>

                    <span className="stat-note">
                      Successfully completed
                    </span>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon orange">◷</span>

                    <p>Pending Tasks</p>

                    <h2>{pendingTasks}</h2>

                    <span className="stat-note">
                      Remaining tasks
                    </span>
                  </div>

                </div>

                {/* Recent Projects */}
                <section className="data-panel">

                  <div className="panel-heading">

                    <div>
                      <h2>Recent Projects</h2>
                      <p>Your latest workspace projects</p>
                    </div>

                    <button
                      onClick={() => setActivePage("Projects")}
                    >
                      View all →
                    </button>

                  </div>

                  {projects.length === 0 ? (
                    <div className="empty-state">
                      No projects found. Create your first project.
                    </div>
                  ) : (

                    <div className="table-wrapper">

                      <table>
                        <thead>
                          <tr>
                            <th>Project Name</th>
                            <th>Status</th>
                            <th>Deadline</th>
                          </tr>
                        </thead>

                        <tbody>
                          {projects.slice(0, 5).map((project) => (
                            <tr key={project.id}>

                              <td>
                                <strong>{project.name}</strong>

                                <small>
                                  {project.description || "No description"}
                                </small>
                              </td>

                              <td>
                                <span className="status-badge">
                                  {project.status}
                                </span>
                              </td>

                              <td>
                                {project.deadline || "Not set"}
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>

                    </div>
                  )}

                </section>

              </>
            )}

            {/* Projects Management */}
            {!dashboardLoading && activePage === "Projects" && (
              <Projects />
            )}

            {/* Tasks Management */}
            {!dashboardLoading && activePage === "Tasks" && (
              <Tasks />
            )}

            {/* Kanban Board */}
            {!dashboardLoading && activePage === "Kanban" && (
              <Kanban />
            )}

            {/* Team Members Management */}
            {!dashboardLoading && activePage === "Team Members" && (
              <TeamMembers />
            )}

          </section>
        </main>

      </div>
    );
  }

  // Login page
  return (
    <div className="login-page">

      {/* Left section */}
      <div className="login-left">

        <div className="brand">
          <div className="brand-icon">P</div>
          <span>ProjectFlow</span>
        </div>

        <div className="hero-content">

          <span className="hero-label">
            WORK SMARTER TOGETHER
          </span>

          <h1>
            Manage projects.
            <br />
            Empower teams.
            <br />
            <span>Achieve more.</span>
          </h1>

          <p>
            Bring your projects, tasks, and team members
            together in one powerful workspace.
          </p>

          <div className="feature-list">
            <div>✓ &nbsp; Organize your projects</div>
            <div>✓ &nbsp; Track tasks and progress</div>
            <div>✓ &nbsp; Collaborate with your team</div>
          </div>

        </div>

        <div className="left-footer">
          Advanced Project & Team Management System
        </div>

      </div>

      {/* Right login section */}
      <div className="login-right">

        <div className="login-card">

          <div className="mobile-brand">
            <div className="brand-icon">P</div>
            ProjectFlow
          </div>

          <div className="login-heading">

            <span className="welcome-label">
              WELCOME BACK
            </span>

            <h2>Sign in to your account</h2>

            <p>
              Enter your details to access your workspace.
            </p>

          </div>

          <form onSubmit={handleLogin}>

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />

            </div>

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="password-wrapper">

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {/* Login error */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>

          </form>

          <p className="secure-note">
            🔒 Secure login powered by JWT authentication
          </p>

        </div>

      </div>

    </div>
  );
}

export default App;
