import { useState, useEffect } from "react";
import { handleCreateUser, handleUpdateUser } from "../../../controllers/adminController";
import { handleGetAllUsersAdmin } from "../../../controllers/adminController"; // to get employees for assignment

function UserFormModal({ user, onClose, onSaved }) {
  const isEditing = !!user;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [allUsers, setAllUsers] = useState([]);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "", // only for create
    role: user?.role || "EMPLOYEE",
    department: user?.department || "GENERAL",
    managerId: user?.managerId?._id || user?.managerId || "",
    subEmployeeIds: [], // handled via multiselect if manager
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await handleGetAllUsersAdmin();
        setAllUsers(data?.users || []);
        
        // If editing a manager or lead, pre-fill subEmployeeIds
        if (isEditing && (user.role === "MANAGER" || user.role === "LEAD")) {
          const subs = (data?.users || []).filter(u => u.managerId?._id === user._id || u.managerId === user._id);
          setForm(prev => ({ ...prev, subEmployeeIds: subs.map(s => s._id) }));
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [isEditing, user]);

  const managers = allUsers.filter(u => (u.role === "MANAGER" || u.role === "ADMIN" || u.role === "LEAD") && u._id !== user?._id);
  // All employees can be assigned, regardless of current manager
  const assignableEmployees = allUsers.filter(u => 
    u.role === "EMPLOYEE" && u._id !== user?._id
  );

  const onChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleMultiselect = (e) => {
    const value = Array.from(e.target.selectedOptions, option => option.value);
    setForm(p => ({ ...p, subEmployeeIds: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // clean up unwanted fields based on role
    const payload = { ...form };
    if (payload.role !== "EMPLOYEE" && payload.role !== "LEAD") delete payload.managerId;
    if (payload.role !== "MANAGER" && payload.role !== "LEAD") delete payload.subEmployeeIds;
    
    // Only send password if creating
    if (isEditing) {
      delete payload.password;
      delete payload.email; // assuming email can't be updated
    }

    try {
      if (isEditing) {
        await handleUpdateUser(user._id, payload);
      } else {
        await handleCreateUser(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? "Edit User" : "Create New User"}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={onSubmit} className="form-grid">
          <div className="form-field">
            <label className="form-label">Full Name</label>
            <input name="name" value={form.name} onChange={onChange} className="form-input" required />
          </div>

          {!isEditing && (
            <>
              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input type="email" name="email" value={form.email} onChange={onChange} className="form-input" required />
              </div>
              <div className="form-field">
                <label className="form-label">Password</label>
                <input type="password" name="password" value={form.password} onChange={onChange} className="form-input" required minLength={6} placeholder="Min 6 characters" />
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Role</label>
              <select name="role" value={form.role} onChange={onChange} className="form-select">
                <option value="EMPLOYEE">Employee</option>
                <option value="LEAD">Lead</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Department</label>
              <input name="department" value={form.department} onChange={onChange} className="form-input" placeholder="e.g. IT, HR" />
            </div>
          </div>

          {(form.role === "EMPLOYEE" || form.role === "LEAD") && (
            <div className="form-field fade-in">
              <label className="form-label">Assign Manager</label>
              <select name="managerId" value={form.managerId || ""} onChange={onChange} className="form-select">
                <option value="">-- No Manager / Unassigned --</option>
                {managers.map(m => (
                  <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
          )}

          {(form.role === "MANAGER" || form.role === "LEAD") && (
            <div className="form-field fade-in">
              <label className="form-label">Assign Employees (Hold Ctrl/Cmd to select multiple)</label>
              <select multiple name="subEmployeeIds" value={form.subEmployeeIds} onChange={handleMultiselect} className="form-select" style={{ height: "120px" }}>
                {assignableEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} {emp.managerId?._id === user?._id ? "(Currently Managed)" : ""}</option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : (isEditing ? "Save Changes" : "Create User")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;
