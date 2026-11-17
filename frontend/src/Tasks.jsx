
import { useEffect, useState } from "react";
import api from "./services/api";
import "./Tasks.css";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Comments and activity history
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState("");

  const emptyForm = {
    title: "",
    description: "",
    project_id: "",
    assigned_to: "",
    priority: "Medium",
    status: "To Do",
    due_date: ""
  };

  const [form, setForm] = useState(emptyForm);

  const getItems = (data) => {
    if (Array.isArray(data)) return data;
    return data?.items || [];
  };

  // Load tasks, projects and users
  const loadData = async () => {
    setLoading(true);

    try {
      const results = await Promise.all([
        api.get("/tasks/?page=1&limit=100"),
        api.get("/projects/?page=1&limit=100"),
        api.get("/users/")
      ]);

      setTasks(getItems(results[0].data));
      setProjects(getItems(results[1].data));
      setUsers(getItems(results[2].data));
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to load task information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle form inputs
  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  // Create or update task
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.project_id) {
      setMessage("Please select a project.");
      return;
    }

    const taskData = {
      title: form.title.trim(),
      description: form.description.trim(),
      project_id: Number(form.project_id),
      assigned_to: form.assigned_to
        ? Number(form.assigned_to)
        : null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null
    };

    try {
      setSubmitting(true);

      if (editingId) {
        await api.put(`/tasks/${editingId}`, taskData);
        setMessage("Task updated successfully!");
      } else {
        await api.post("/tasks/", taskData);
        setMessage("Task created successfully!");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to save task. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Edit task
  const handleEdit = (task) => {
    setEditingId(task.id);

    setForm({
      title: task.title || "",
      description: task.description || "",
      project_id: String(task.project_id || ""),
      assigned_to: task.assigned_to
        ? String(task.assigned_to)
        : "",
      priority: task.priority || "Medium",
      status: task.status || "To Do",
      due_date: task.due_date
        ? String(task.due_date).slice(0, 10)
        : ""
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  };

  // Update task status
  const handleStatusChange = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task.id}`, {
        status: newStatus
      });

      setMessage("Task status updated successfully!");
      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to update task status."
      );
    }
  };

  // Delete task
  const handleDelete = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/tasks/${taskId}`);

      if (editingId === taskId) {
        handleCancel();
      }

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
        setComments([]);
        setActivities([]);
      }

      setMessage("Task deleted successfully!");
      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to delete task."
      );
    }
  };

  // Load comments and activity history for a task
  const handleViewDetails = async (taskId) => {
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
      return;
    }

    setSelectedTaskId(taskId);
    setComments([]);
    setActivities([]);
    setDetailsMessage("");
    setDetailsLoading(true);

    try {
      const results = await Promise.allSettled([
        api.get(`/comments/task/${taskId}`),
        api.get("/activity-logs/", {
          params: { task_id: taskId }
        })
      ]);

      if (results[0].status === "fulfilled") {
        setComments(getItems(results[0].value.data));
      } else {
        setDetailsMessage("Unable to load task comments.");
      }

      if (results[1].status === "fulfilled") {
        setActivities(getItems(results[1].value.data));
      } else {
        setDetailsMessage((previous) =>
          previous
            ? `${previous} Activity history may require Admin or Project Manager access.`
            : "Activity history may require Admin or Project Manager access."
        );
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  // Add a comment
  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim() || !selectedTaskId) return;

    try {
      await api.post(
        `/comments/task/${selectedTaskId}`,
        { comment: commentText.trim() }
      );

      setCommentText("");
      setDetailsMessage("Comment added successfully!");

      // Reload comments and activity history
      await handleReloadDetails(selectedTaskId);
    } catch (error) {
      setDetailsMessage(
        error.response?.data?.detail ||
        "Unable to add comment."
      );
    }
  };

  // Refresh comments and activity history
  const handleReloadDetails = async (taskId) => {
    const results = await Promise.allSettled([
      api.get(`/comments/task/${taskId}`),
      api.get("/activity-logs/", {
        params: { task_id: taskId }
      })
    ]);

    if (results[0].status === "fulfilled") {
      setComments(getItems(results[0].value.data));
    }

    if (results[1].status === "fulfilled") {
      setActivities(getItems(results[1].value.data));
    }
  };

  // Search tasks
  const filteredTasks = tasks.filter((task) =>
    task.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tasks-container">

      <div className="tasks-heading">
        <div>
          <h2>Task Management</h2>
          <p>Create, edit, assign and track your tasks.</p>
        </div>

        <button
          onClick={loadData}
          className="task-refresh"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Create and Edit Task Form */}
      <form className="task-form" onSubmit={handleSubmit}>
        <h3>
          {editingId ? "Edit Task" : "Create New Task"}
        </h3>

        <div className="task-form-grid">
          <div>
            <label>Task Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label>Project</label>
            <select
              name="project_id"
              value={form.project_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Assign To</label>
            <select
              name="assigned_to"
              value={form.assigned_to}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Priority</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div>
            <label>Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option>To Do</option>
              <option>In Progress</option>
              <option>Review</option>
              <option>Completed</option>
            </select>
          </div>

          <div>
            <label>Due Date</label>
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="task-description">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter task description"
            rows="3"
          />
        </div>

        <div className="task-form-buttons">
          <button
            type="submit"
            className="task-create-btn"
            disabled={submitting}
          >
            {submitting
              ? "Saving..."
              : editingId
                ? "Update Task"
                : "+ Create Task"}
          </button>

          {editingId && (
            <button
              type="button"
              className="task-cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>

        {message && (
          <p className="task-message">{message}</p>
        )}
      </form>

      {/* Task List */}
      <div className="task-list-section">
        <div className="task-list-heading">
          <h3>All Tasks ({filteredTasks.length})</h3>

          <input
            className="task-search"
            placeholder="Search tasks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p>No tasks found. Create your first task above.</p>
        ) : (
          <div className="task-table-wrapper">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.title}</strong>
                      <small>
                        {task.description || "No description"}
                      </small>
                    </td>

                    <td>
                      {projects.find(
                        (project) => project.id === task.project_id
                      )?.name || `Project #${task.project_id}`}
                    </td>

                    <td>
                      {users.find(
                        (user) => user.id === task.assigned_to
                      )?.full_name || "Unassigned"}
                    </td>

                    <td>
                      <span className={`priority-${task.priority?.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </td>

                    <td>
                      <select
                        className="task-status-select"
                        value={task.status}
                        onChange={(event) =>
                          handleStatusChange(task, event.target.value)
                        }
                      >
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                      </select>
                    </td>

                    <td>
                      {task.due_date
                        ? String(task.due_date).slice(0, 10)
                        : "Not set"}
                    </td>

                    <td>
                      <div className="task-actions">
                        <button
                          className="task-edit-btn"
                          onClick={() => handleEdit(task)}
                        >
                          Edit
                        </button>

                        <button
                          className="task-delete-btn"
                          onClick={() => handleDelete(task.id)}
                        >
                          Delete
                        </button>

                        <button
                          className="task-details-btn"
                          onClick={() => handleViewDetails(task.id)}
                        >
                          {selectedTaskId === task.id
                            ? "Hide Details"
                            : "Comments"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comments and Activity History */}
      {selectedTaskId && (
        <div className="task-details-panel">
          <h3>
            Task Comments & Activity History
          </h3>

          <p className="task-details-subtitle">
            Task #{selectedTaskId}
          </p>

          {detailsLoading ? (
            <p>Loading task details...</p>
          ) : (
            <>
              {detailsMessage && (
                <p className="task-details-message">
                  {detailsMessage}
                </p>
              )}

              <div className="task-comments-section">
                <h4>Comments ({comments.length})</h4>

                {comments.length === 0 ? (
                  <p>No comments yet. Add the first comment.</p>
                ) : (
                  comments.map((item) => (
                    <div className="task-comment" key={item.id}>
                      <strong>
                        User #{item.user_id}
                      </strong>
                      <p>{item.comment}</p>
                      <small>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : ""}
                      </small>
                    </div>
                  ))
                )}

                <form
                  className="task-comment-form"
                  onSubmit={handleAddComment}
                >
                  <textarea
                    value={commentText}
                    onChange={(event) =>
                      setCommentText(event.target.value)
                    }
                    placeholder="Write a comment..."
                    rows="3"
                    maxLength={2000}
                    required
                  />

                  <button
                    type="submit"
                    className="task-create-btn"
                    disabled={!commentText.trim()}
                  >
                    Add Comment
                  </button>
                </form>
              </div>

              <div className="task-activity-section">
                <h4>Activity History ({activities.length})</h4>

                {activities.length === 0 ? (
                  <p>No activity history available.</p>
                ) : (
                  activities.map((activity) => (
                    <div
                      className="task-activity-item"
                      key={activity.id}
                    >
                      <strong>{activity.action}</strong>
                      <p>{activity.details || "Activity recorded"}</p>
                      <small>
                        User #{activity.user_id}
                        {" · "}
                        {activity.created_at
                          ? new Date(activity.created_at).toLocaleString()
                          : ""}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}

export default Tasks;
