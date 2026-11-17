
import { useEffect, useState } from "react";
import api from "./services/api";
import "./Kanban.css";

const statuses = ["To Do", "In Progress", "Review", "Completed"];

function Kanban() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/tasks/?page=1&limit=100");
            const data = response.data;

            setTasks(Array.isArray(data) ? data : data.items || []);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load tasks. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            setMessage("");
            setError("");

            await api.put(`/tasks/${taskId}`, {
                status: newStatus
            });

            setTasks((previousTasks) =>
                previousTasks.map((task) =>
                    task.id === taskId
                        ? { ...task, status: newStatus }
                        : task
                )
            );

            setMessage("Task status updated successfully!");
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to update task status."
            );
        }
    };

    return (
        <div className="kanban-page">
            <div className="kanban-header">
                <div>
                    <h2>Kanban Board</h2>
                    <p>Track your team's tasks across different stages.</p>
                </div>

                <button className="kanban-refresh" onClick={loadTasks}>
                    Refresh
                </button>
            </div>

            {message && <div className="kanban-success">{message}</div>}
            {error && <div className="kanban-error">{error}</div>}

            {loading ? (
                <p className="kanban-info">Loading tasks...</p>
            ) : (
                <div className="kanban-board">
                    {statuses.map((status) => {
                        const columnTasks = tasks.filter(
                            (task) => task.status === status
                        );

                        return (
                            <div className="kanban-column" key={status}>
                                <div className="kanban-column-header">
                                    <h3>{status}</h3>
                                    <span>{columnTasks.length}</span>
                                </div>

                                {columnTasks.length === 0 ? (
                                    <p className="kanban-empty">
                                        No tasks here
                                    </p>
                                ) : (
                                    columnTasks.map((task) => (
                                        <div
                                            className="kanban-card"
                                            key={task.id}
                                        >
                                            <h4>{task.title}</h4>

                                            <p>
                                                {task.description ||
                                                    "No description provided"}
                                            </p>

                                            <div className="kanban-card-info">
                                                <span>
                                                    Priority: {task.priority}
                                                </span>
                                                <span>
                                                    Project: {task.project_id}
                                                </span>
                                            </div>

                                            <label>
                                                Change Status
                                            </label>

                                            <select
                                                value={task.status}
                                                onChange={(event) =>
                                                    handleStatusChange(
                                                        task.id,
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                {statuses.map((option) => (
                                                    <option
                                                        key={option}
                                                        value={option}
                                                    >
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Kanban;
