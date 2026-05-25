import { useState, useEffect, useRef } from "react";
import { getMentionUsersApi } from "../../services/userService";

const MentionTagInput = ({ value = [], onChange, label = "Assigned To", filterRole, projectId, filterByTeam }) => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (projectId) {
          // Fetch project-specific users
          const { handleGetProjectDetails } = await import("../../controllers/projectController");
          const data = await handleGetProjectDetails(projectId);
          const project = data?.project;
          if (project) {
            const pUsers = [
              project.createdBy,
              project.managerId,
              project.leadId,
              ...(project.memberIds || [])
            ].filter(u => u && (typeof u === "object") && u._id).reduce((acc, u) => {
              if (!acc.some(x => x._id === u._id)) acc.push(u);
              return acc;
            }, []);
            setUsers(pUsers);
          } else {
            setUsers([]);
          }
        } else {
          // Fetch all users (subject to global mention rules)
          const data = await getMentionUsersApi({ filterByTeam });
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch users for mentions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [projectId, filterByTeam]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);
  };

  const selectUser = (user) => {
    if (!value.some((u) => u._id === user._id)) {
      onChange([...value, user]);
    }
    setQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeUser = (userId) => {
    onChange(value.filter((u) => u._id !== userId));
  };

  const filteredUsers = users
    .filter((u) => {
      if (!filterRole) return true;
      if (Array.isArray(filterRole)) return filterRole.includes(u.role);
      return u.role === filterRole;
    })
    .filter(
      (u) =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
    )
    .filter((u) => !value.some((v) => v._id === u._id));

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="block text-xs font-semibold text-text2 uppercase tracking-wide">
        {label}
      </label>
      
      <div className="flex flex-wrap gap-2 p-2 min-h-[42px] rounded-lg border border-input-border bg-input-bg transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        {value.map((user) => (
          <div
            key={user._id}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-medium animate-scale-in"
          >
            <span>{user.name}</span>
            <button
              type="button"
              onClick={() => removeUser(user._id)}
              className="hover:text-danger transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={value.length === 0 ? "Search and select people..." : "Add more..."}
          className="flex-1 bg-transparent border-none outline-none text-sm text-text placeholder:text-text3 min-w-[120px]"
        />
      </div>

      {showDropdown && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-card-border bg-card shadow-xl animate-slide-in-top"
        >
          <div className="p-1">
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => selectUser(user)}
                className="w-full flex flex-col gap-0.5 px-3 py-2 rounded-lg text-left hover:bg-accent/5 transition-colors group"
              >
                <span className="text-sm font-semibold text-text group-hover:text-accent">
                  {user.name}
                </span>
                <span className="text-[10px] text-text3 italic">
                  {user.department} • {user.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showDropdown && filteredUsers.length === 0 && query && (
        <div className="absolute z-50 top-full mt-1 w-full p-4 text-center rounded-xl border border-card-border bg-card shadow-xl text-xs text-text3 italic">
          No users found matching "{query}"
        </div>
      )}
    </div>
  );
};

export default MentionTagInput;
