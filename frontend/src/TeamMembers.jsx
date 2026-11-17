
import { useEffect, useState } from "react";
import api from "./services/api";
import "./TeamMembers.css";

function getItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function TeamMembers() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [projectMembers, setProjectMembers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadProjectMembers(selectedProject);
        } else {
            setProjectMembers([]);
        }
    }, [selectedProject]);

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [usersResponse, projectsResponse] = await Promise.all([
                api.get("/users/"),
                api.get("/projects/?page=1&limit=100")
            ]);

            setUsers(getItems(usersResponse.data));
            setProjects(getItems(projectsResponse.data));
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load team members. Please check your Admin access."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadProjectMembers = async (projectId) => {
        setMembersLoading(true);
        setError("");

        try {
            const response = await api.get(
                `/projects/${projectId}/members`
            );
            setProjectMembers(getItems(response.data));
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load project members."
            );
        } finally {
            setMembersLoading(false);
        }
    };

    const updateRole = async (userId, role) => {
        setMessage("");
        setError("");

        try {
            await api.put(`/users/${userId}/role`, { role });
            setMessage("User role updated successfully.");
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to update user role."
            );
        }
    };

    const toggleUserStatus = async (user) => {
        setMessage("");
        setError("");

        try {
            await api.patch(`/users/${user.id}/status`, {
                is_active: !user.is_active
            });

            setMessage(
                `${user.full_name}'s account status was updated.`
            );
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to update account status."
            );
        }
    };

    const addMember = async (event) => {
        event.preventDefault();

        if (!selectedProject || !selectedUser) {
            setError("Please select a project and a user.");
            return;
        }

        setMessage("");
        setError("");

        try {
            await api.post(
                `/projects/${selectedProject}/members`,
                { user_id: Number(selectedUser) }
            );

            setMessage("Team member added to the project.");
            setSelectedUser("");
            await loadProjectMembers(selectedProject);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to add this member to the project."
            );
        }
    };

    const removeMember = async (userId) => {
        const confirmed = window.confirm(
            "Are you sure you want to remove this member from the project?"
        );

        if (!confirmed) return;

        setMessage("");
        setError("");

        try {
            await api.delete(
                `/projects/${selectedProject}/members/${userId}`
            );

            setMessage("Member removed from the project.");
            await loadProjectMembers(selectedProject);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to remove this member."
            );
        }
    };

    const getRole = (user) =>
        user.role || user.role_name || user.role?.name || "Team Member";

    const getUserName = (userId) => {
        const user = users.find((item) => item.id === userId);
        return user ? user.full_name : `User #${userId}`;
    };

    if (loading) {
        return <div className="team-loading">Loading team members...</div>;
    }

    return (
        <div className="team-page">
            <div className="team-header">
                <div>
                    <h1>Team Members</h1>
                    <p>Manage users, roles, and project assignments.</p>
                </div>

                <button className="team-refresh-btn" onClick={loadData}>
                    Refresh
                </button>
            </div>

            {message && <div className="team-success">{message}</div>}
            {error && <div className="team-error">{error}</div>}

            <div className="team-stats">
                <div className="team-stat-card">
                    <span>Total Users</span>
                    <strong>{users.length}</strong>
                </div>
                <div className="team-stat-card">
                    <span>Active Users</span>
                    <strong>
                        {users.filter((user) => user.is_active).length}
                    </strong>
                </div>
                <div className="team-stat-card">
                    <span>Projects</span>
                    <strong>{projects.length}</strong>
                </div>
            </div>

            <section className="team-section">
                <div className="team-section-heading">
                    <div>
                        <h2>All Users</h2>
                        <p>Update user roles and account status.</p>
                    </div>
                </div>

                <div className="team-table-wrapper">
                    <table className="team-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Account Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <strong>{user.full_name}</strong>
                                        <small>ID: {user.id}</small>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            value={getRole(user)}
                                            onChange={(event) =>
                                                updateRole(
                                                    user.id,
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Project Manager">
                                                Project Manager
                                            </option>
                                            <option value="Team Member">
                                                Team Member
                                            </option>
                                        </select>
                                    </td>
                                    <td>
                                        <span
                                            className={
                                                user.is_active
                                                    ? "team-status active"
                                                    : "team-status inactive"
                                            }
                                        >
                                            {user.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={
                                                user.is_active
                                                    ? "team-action-btn deactivate"
                                                    : "team-action-btn activate"
                                            }
                                            onClick={() =>
                                                toggleUserStatus(user)
                                            }
                                        >
                                            {user.is_active
                                                ? "Deactivate"
                                                : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="team-empty">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="team-section">
                <div className="team-section-heading">
                    <div>
                        <h2>Project Assignments</h2>
                        <p>Add or remove users from a selected project.</p>
                    </div>
                </div>

                <div className="team-assignment-controls">
                    <label>
                        Select Project
                        <select
                            value={selectedProject}
                            onChange={(event) =>
                                setSelectedProject(event.target.value)
                            }
                        >
                            <option value="">Choose a project</option>
                            {projects.map((project) => (
                                <option
                                    key={project.id}
                                    value={project.id}
                                >
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <form onSubmit={addMember} className="team-add-form">
                        <label>
                            Select User
                            <select
                                value={selectedUser}
                                onChange={(event) =>
                                    setSelectedUser(event.target.value)
                                }
                                disabled={!selectedProject}
                            >
                                <option value="">Choose a user</option>
                                {users
                                    .filter((user) => user.is_active)
                                    .map((user) => (
                                        <option
                                            key={user.id}
                                            value={user.id}
                                        >
                                            {user.full_name} ({user.email})
                                        </option>
                                    ))}
                            </select>
                        </label>

                        <button
                            type="submit"
                            disabled={!selectedProject || !selectedUser}
                        >
                            Add Member
                        </button>
                    </form>
                </div>

                {selectedProject && (
                    <div className="team-members-list">
                        <h3>Assigned Members</h3>

                        {membersLoading ? (
                            <p>Loading project members...</p>
                        ) : projectMembers.length === 0 ? (
                            <p className="team-empty">
                                No members assigned to this project yet.
                            </p>
                        ) : (
                            projectMembers.map((member) => (
                                <div
                                    className="team-member-row"
                                    key={member.id || member.user_id}
                                >
                                    <div>
                                        <strong>
                                            {getUserName(member.user_id)}
                                        </strong>
                                        <small>
                                            User ID: {member.user_id}
                                        </small>
                                    </div>

                                    <button
                                        className="team-action-btn deactivate"
                                        onClick={() =>
                                            removeMember(member.user_id)
                                        }
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

export default TeamMembers;
