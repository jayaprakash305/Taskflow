import React, { useState, useEffect } from "react";
import { 
  searchUsers, createGroupChat, renameGroupChat, 
  addGroupMembers, removeGroupMember, makeGroupAdmin, removeGroupAdmin
} from "../../models/messageModel";

// Helper components for UI
const ModalOverlay = ({ children, onClose }) => (
  <div style={{
    position:"fixed", top:0, left:0, right:0, bottom:0,
    background:"rgba(0,0,0,0.5)", zIndex:1000,
    display:"flex", alignItems:"center", justifyContent:"center"
  }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{
      background:"var(--clr-card)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
      border:"1px solid var(--clr-card-border)", width:400, maxWidth:"90%", borderRadius:12,
      display:"flex", flexDirection:"column", overflow:"hidden",
      boxShadow:"0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
    }}>
      {children}
    </div>
  </div>
);

export function CreateGroupModal({ onClose, onSuccess, currentUser }) {
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchUsers(searchQuery);
        if (res?.users) {
          // Filter out ourselves and already selected users
          setSearchResults(res.users.filter(u => 
            String(u._id) !== String(currentUser._id) && 
            !selectedUsers.some(su => String(su._id) === String(u._id))
          ));
        }
      } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedUsers, currentUser]);

  const handleCreate = async () => {
    if (!name.trim() || selectedUsers.length === 0) return;
    setLoading(true);
    try {
      const chat = await createGroupChat(name, selectedUsers.map(u => u._id));
      if (chat?.chat) {
        onSuccess(chat.chat);
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--clr-border)" }}>
        <h3 style={{ margin:0, fontSize:16, color:"var(--clr-text)" }}>Create Group Chat</h3>
      </div>
      <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16, flex:1, overflowY:"auto", maxHeight:"60vh" }}>
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--clr-text2)", marginBottom:6 }}>Group Name</label>
          <input 
            type="text" value={name} onChange={e => setName(e.target.value)} 
            placeholder="e.g. Engineering Team"
            style={{ width:"100%", padding:"8px 12px", borderRadius:6, border:"1px solid var(--clr-border)", background:"var(--clr-bg3)", color:"var(--clr-text)", outline:"none" }}
          />
        </div>
        
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--clr-text2)", marginBottom:6 }}>Add Members</label>
          {selectedUsers.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
              {selectedUsers.map(u => (
                <div key={u._id} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", background:"var(--clr-accent-bg)", color:"var(--clr-accent)", borderRadius:16, fontSize:12, fontWeight:500 }}>
                  {u.name}
                  <button onClick={() => setSelectedUsers(p => p.filter(x => x._id !== u._id))} style={{ background:"transparent", border:"none", color:"currentColor", cursor:"pointer", padding:0, display:"flex" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <input 
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search users..."
            style={{ width:"100%", padding:"8px 12px", borderRadius:6, border:"1px solid var(--clr-border)", background:"var(--clr-bg3)", color:"var(--clr-text)", outline:"none" }}
          />
          {searchResults.length > 0 && (
            <div style={{ marginTop:8, border:"1px solid var(--clr-border)", borderRadius:6, overflow:"hidden" }}>
              {searchResults.map(u => (
                <div key={u._id} onClick={() => { setSelectedUsers(p => [...p, u]); setSearchQuery(""); }} style={{ padding:"8px 12px", cursor:"pointer", background:"var(--clr-bg3)", borderBottom:"1px solid var(--clr-border)", fontSize:13, color:"var(--clr-text)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>{u.name} <span style={{fontSize:11, color:"var(--clr-text3)", marginLeft:6}}>{u.role}</span></div>
                  <span style={{color:"var(--clr-accent)", fontSize:18}}>+</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:"12px 20px", borderTop:"1px solid var(--clr-border)", display:"flex", justifyContent:"flex-end", gap:10 }}>
        <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:6, border:"1px solid var(--clr-border)", background:"transparent", color:"var(--clr-text2)", cursor:"pointer", fontWeight:500 }}>Cancel</button>
        <button onClick={handleCreate} disabled={!name.trim() || selectedUsers.length === 0 || loading} style={{ padding:"8px 16px", borderRadius:6, border:"none", background:"var(--clr-accent)", color:"#fff", cursor:"pointer", fontWeight:600, opacity: (!name.trim() || selectedUsers.length === 0 || loading) ? 0.5 : 1 }}>
          {loading ? "Creating..." : "Create Group"}
        </button>
      </div>
    </ModalOverlay>
  );
}

export function ManageGroupModal({ chat, onClose, onUpdate, currentUser }) {
  const [activeTab, setActiveTab] = useState("members"); // "members" | "add" | "settings"
  const isAdmin = chat?.admins?.some(a => String(a._id || a) === String(currentUser._id));
  
  const [newName, setNewName] = useState(chat.name || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  // Search for adding members
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchUsers(searchQuery);
        if (res?.users) {
          setSearchResults(res.users.filter(u => 
            !chat.participants.some(p => String(p._id) === String(u._id))
          ));
        }
      } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, chat.participants]);

  const handleRename = async () => {
    if (!newName.trim() || newName === chat.name) return;
    try {
      const res = await renameGroupChat(chat._id, newName);
      if (res?.chat) onUpdate(res.chat);
    } catch(e) { alert("Failed to rename group"); }
  };

  const handleAddMember = async (userId) => {
    try {
      const res = await addGroupMembers(chat._id, [userId]);
      if (res?.chat) {
        onUpdate(res.chat);
        setSearchQuery("");
      }
    } catch(e) { alert("Failed to add member"); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      const res = await removeGroupMember(chat._id, userId);
      if (res?.chat) onUpdate(res.chat);
    } catch(e) { alert("Failed to remove member"); }
  };

  const handleMakeAdmin = async (userId) => {
    if (!window.confirm("Make this member an admin?")) return;
    try {
      const res = await makeGroupAdmin(chat._id, userId);
      if (res?.chat) onUpdate(res.chat);
    } catch(e) { alert("Failed to make admin"); }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!window.confirm("Remove admin rights from this member?")) return;
    try {
      const res = await removeGroupAdmin(chat._id, userId);
      if (res?.chat) onUpdate(res.chat);
    } catch(e) { 
      alert(e.response?.data?.message || "Failed to remove admin rights"); 
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      await removeGroupMember(chat._id, currentUser._id);
      onClose();
      window.location.reload(); // Quick way to reset state
    } catch(e) { alert("Failed to leave group"); }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--clr-border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h3 style={{ margin:0, fontSize:16, color:"var(--clr-text)" }}>{chat.name}</h3>
        <button onClick={onClose} style={{ background:"transparent", border:"none", color:"var(--clr-text3)", cursor:"pointer", display:"flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div style={{ display:"flex", padding:"0 20px", borderBottom:"1px solid var(--clr-border)" }}>
        {["members", ...(isAdmin ? ["add", "settings"] : [])].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ flex:1, padding:"12px 0", border:"none", background:"transparent", borderBottom:`2px solid ${activeTab===t ? "var(--clr-accent)" : "transparent"}`, color:activeTab===t ? "var(--clr-accent)" : "var(--clr-text3)", cursor:"pointer", fontSize:13, fontWeight:600, textTransform:"capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding:20, flex:1, overflowY:"auto", maxHeight:"50vh", minHeight:300 }}>
        {activeTab === "members" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {chat.participants.map(p => {
              const pIsAdmin = chat.admins.some(a => String(a._id || a) === String(p._id));
              const isMe = String(p._id) === String(currentUser._id);
              return (
                <div key={p._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:12, borderBottom:"1px solid var(--clr-border)" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--clr-text)" }}>{p.name} {isMe && "(You)"}</div>
                    <div style={{ fontSize:12, color:"var(--clr-text3)" }}>{p.role} {pIsAdmin && <span style={{color:"var(--clr-accent)", fontWeight:700, marginLeft:4}}>• Admin</span>}</div>
                  </div>
                  {isAdmin && !isMe && (
                    <div style={{ display:"flex", gap:8 }}>
                      {!pIsAdmin && <button onClick={() => handleMakeAdmin(p._id)} style={{ padding:"4px 8px", fontSize:11, borderRadius:4, border:"1px solid var(--clr-accent)", background:"transparent", color:"var(--clr-accent)", cursor:"pointer" }}>Make Admin</button>}
                      {pIsAdmin && String(chat.createdBy?._id || chat.createdBy) !== String(p._id) && (
                        <button onClick={() => handleRemoveAdmin(p._id)} style={{ padding:"4px 8px", fontSize:11, borderRadius:4, border:"1px solid var(--clr-text3)", background:"transparent", color:"var(--clr-text3)", cursor:"pointer" }}>Remove Admin</button>
                      )}
                      <button onClick={() => handleRemoveMember(p._id)} style={{ padding:"4px 8px", fontSize:11, borderRadius:4, border:"1px solid #ef4444", background:"transparent", color:"#ef4444", cursor:"pointer" }}>Remove</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "add" && isAdmin && (
          <div>
            <input 
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Search users to add..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:6, border:"1px solid var(--clr-border)", background:"var(--clr-bg3)", color:"var(--clr-text)", outline:"none", marginBottom:12 }}
            />
            {searchResults.map(u => (
              <div key={u._id} style={{ padding:"10px 12px", background:"var(--clr-bg3)", border:"1px solid var(--clr-border)", borderRadius:6, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--clr-text)" }}>{u.name}</div>
                  <div style={{ fontSize:11, color:"var(--clr-text3)" }}>{u.email}</div>
                </div>
                <button onClick={() => handleAddMember(u._id)} style={{ padding:"6px 12px", borderRadius:4, background:"var(--clr-accent)", color:"#fff", border:"none", cursor:"pointer", fontSize:12, fontWeight:600 }}>Add</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "settings" && isAdmin && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--clr-text2)", marginBottom:6 }}>Group Name</label>
              <div style={{ display:"flex", gap:8 }}>
                <input 
                  type="text" value={newName} onChange={e => setNewName(e.target.value)} 
                  style={{ flex:1, padding:"8px 12px", borderRadius:6, border:"1px solid var(--clr-border)", background:"var(--clr-bg3)", color:"var(--clr-text)", outline:"none" }}
                />
                <button onClick={handleRename} disabled={!newName.trim() || newName === chat.name} style={{ padding:"8px 16px", borderRadius:6, border:"none", background:"var(--clr-accent)", color:"#fff", cursor:"pointer", fontWeight:600, opacity: (!newName.trim() || newName === chat.name) ? 0.5 : 1 }}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:"12px 20px", borderTop:"1px solid var(--clr-border)", display:"flex", justifyContent:"space-between" }}>
        <button onClick={handleLeaveGroup} style={{ padding:"8px 16px", borderRadius:6, border:"1px solid #ef4444", background:"transparent", color:"#ef4444", cursor:"pointer", fontWeight:500 }}>Leave Group</button>
        <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:6, border:"1px solid var(--clr-border)", background:"transparent", color:"var(--clr-text2)", cursor:"pointer", fontWeight:500 }}>Close</button>
      </div>
    </ModalOverlay>
  );
}
