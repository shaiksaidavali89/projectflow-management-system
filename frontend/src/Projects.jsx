
import { useEffect, useState } from "react";
import api from "./services/api";
import "./Projects.css";

const initialForm = {
    name: "",
    description: "",
    status: "Planning",
    start_date: "",
    deadline: ""
};

const projectStatuses = [
    "Planning",
    "In Progress",
    "On Hold",
    "Completed"
];

function Projects() {
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const loadProjects = async () => {
        try {
            setLoading(true);

            const response = await api.get("/projects/", {
                params: { page: 1, limit: 100 }
            });

            const data = response.data;
            setProjects(Array.isArray(data) ? data : data.items || []);
        } catch (err) {
            setMessage(
                err.response?.data?.detail || "Unable to load projects."
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const updateForm = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const openCreateForm = () => {
        setEditingId(null);
        setForm(initialForm);
        setShowForm(true);
        setMessage("");
    };

    const openEditForm = (project) => {
        setEditingId(project.id);

        setForm({
            name: project.name || "",
            description: project.description || "",
            status: project.status || "Planning",
            start_date: project.start_date || "",
            deadline: project.deadline || ""
        });

        setShowForm(true);
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        if (
            form.start_date &&
            form.deadline &&
            form.deadline < form.start_date
        ) {
            setMessage("Deadline cannot be before the start date.");
            setMessageType("error");
            return;
        }

        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            status: form.status,
            start_date: form.start_date || null,
            deadline: form.deadline || null
        };

        try {
            setSubmitting(true);

            if (editingId !== null) {
                await api.put(`/projects/${editingId}`, payload);
                setMessage("Project updated successfully!");
            } else {
                await api.post("/projects/", payload);
                setMessage("Project created successfully!");
            }

            setMessageType("success");
            setShowForm(false);
            setEditingId(null);
            setForm(initialForm);

            await loadProjects();
        } catch (err) {
            setMessage(
                err.response?.data?.detail ||
                "Unable to save project. Please try again."
            );
            setMessageType("error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (projectId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this project?"
        );

        if (!confirmed) return;

        try {
            setMessage("");

            await api.delete(`/projects/${projectId}`);

            setProjects((previous) =>
                previous.filter((project) => project.id !== projectId)
            );

            setMessage("Project deleted successfully!");
            setMessageType("success");
        } catch (err) {
            setMessage(
                err.response?.data?.detail ||
                "Unable to delete this project. Check whether it has related tasks or activity records."
            );
            setMessageType("error");
        }
    };

    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.name?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "All" || project.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="projects-page">
            <div className="projects-heading">
                <div>
                    <h2>Project Management</h2>
                    <p>Create, update and manage your workspace projects.</p>
                </div>

                <button
                    className="project-create-button"
                    onClick={openCreateForm}
                >
                    + New Project
                </button>
            </div>

            {message && (
                <div className={`projects-message ${messageType}`}>
                    {message}
                </div>
            )}

            {showForm && (
                <form className="projects-form" onSubmit={handleSubmit}>
                    <h3>
                        {editingId !== null ? "Edit Project" : "Create Project"}
                    </h3>

                    <label>Project Name</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={updateForm}
                        placeholder="Enter project name"
                        maxLength={150}
                        required
                    />

                    <label>Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={updateForm}
                        placeholder="Enter project description"
                    />

                    <label>Status</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={updateForm}
                    >
                        {projectStatuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    <div className="project-date-fields">
                        <div>
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={updateForm}
                            />
                        </div>

                        <div>
                            <label>Deadline</label>
                            <input
                                type="date"
                                name="deadline"
                                value={form.deadline}
                                onChange={updateForm}
                            />
                        </div>
                    </div>

                    <div className="projects-form-actions">
                        <button type="submit" disabled={submitting}>
                            {submitting
                                ? "Saving..."
                                : editingId !== null
                                    ? "Update Project"
                                    : "Create Project"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingId(null);
                                setForm(initialForm);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="projects-filters">
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    {projectStatuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>

                <button onClick={loadProjects} disabled={loading}>
                    Refresh
                </button>
            </div>

            {loading ? (
                <p className="projects-empty">Loading projects...</p>
            ) : filteredProjects.length === 0 ? (
                <div className="projects-empty">
                    No matching projects found.
                </div>
            ) : (
                <div className="projects-table-wrapper">
                    <table className="projects-table">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Status</th>
                                <th>Start Date</th>
                                <th>Deadline</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredProjects.map((project) => (
                                <tr key={project.id}>
                                    <td>
                                        <strong>{project.name}</strong>
                                        <small>
                                            {project.description || "No description"}
                                        </small>
                                    </td>

                                    <td>
                                        <span className="project-status">
                                            {project.status}
                                        </span>
                                    </td>

                                    <td>{project.start_date || "—"}</td>
                                    <td>{project.deadline || "—"}</td>

                                    <td>
                                        <div className="project-row-actions">
                                            <button
                                                className="project-edit-button"
                                                onClick={() => openEditForm(project)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="project-delete-button"
                                                onClick={() => handleDelete(project.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="projects-count">
                Showing {filteredProjects.length} of {projects.length} projects
            </p>
        </div>
    );
}

export default Projects;
