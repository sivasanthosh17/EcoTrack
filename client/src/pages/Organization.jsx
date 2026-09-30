import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Organization = () => {
  const { user, token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const isAdmin = user?.role === 'Organization Admin';

  const [activeTab, setActiveTab] = useState('profile');

  // Organization state
  const [orgData, setOrgData] = useState({
    name: '',
    orgType: 'Municipality',
    address: '',
    contactEmail: '',
    contactPhone: '',
    website: ''
  });
  const [editingOrg, setEditingOrg] = useState(false);

  // Departments state
  const [departments, setDepartments] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  
  // Department Form state
  const [deptForm, setDeptForm] = useState({
    id: null,
    name: '',
    code: '',
    description: '',
    headOfDepartment: '',
    location: ''
  });
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isEditingDept, setIsEditingDept] = useState(false);

  // User assignment state
  const [assignment, setAssignment] = useState({
    userId: '',
    departmentName: ''
  });

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Fetch initial data
  useEffect(() => {
    fetchOrganizationData();
    fetchDepartments();
    fetchSystemUsers();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/organization`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok && data.organization) {
        setOrgData(data.organization);
      }
    } catch (err) {
      console.error('Failed to load organization profile', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/departments`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/departments/users`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setSystemUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  // Update Org Profile
  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/organization`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(orgData)
      });
      const data = await res.json();
      if (res.ok) {
        setOrgData(data.organization);
        setEditingOrg(false);
        setMessage({ type: 'success', text: 'Organization profile updated successfully!' });
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to update organization profile.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server communication error.' });
    }
  };

  // Create or Update Department
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const url = isEditingDept 
      ? `${API_BASE_URL}/departments/${deptForm.id}`
      : `${API_BASE_URL}/departments`;
    
    const method = isEditingDept ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(deptForm)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: `Department ${isEditingDept ? 'updated' : 'created'} successfully!` 
        });
        setShowDeptModal(false);
        resetDeptForm();
        fetchDepartments();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Department operation failed.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while saving department.' });
    }
  };

  // Delete Department
  const handleDeleteDept = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete department '${name}'?`)) return;
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/departments/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Department '${name}' deleted successfully.` });
        fetchDepartments();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to delete department.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while deleting department.' });
    }
  };

  // Edit Dept Trigger
  const handleEditDeptClick = (dept) => {
    setDeptForm({
      id: dept._id,
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      headOfDepartment: dept.headOfDepartment?._id || '',
      location: dept.location || ''
    });
    setIsEditingDept(true);
    setShowDeptModal(true);
  };

  // Assign User to Department
  const handleAssignUser = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/departments/assign-user`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(assignment)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setAssignment({ userId: '', departmentName: '' });
        fetchDepartments();
        fetchSystemUsers();
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to assign user.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while assigning user.' });
    }
  };

  const resetDeptForm = () => {
    setDeptForm({ id: null, name: '', code: '', description: '', headOfDepartment: '', location: '' });
    setIsEditingDept(false);
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Organization Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage entity details, departments, and user assignments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className={`role-badge ${isAdmin ? 'admin' : 'officer'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Global Message Banner */}
      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* Sub Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('profile')}
        >
          Organization Profile
        </button>
        <button
          className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('departments')}
        >
          Departments ({departments.length})
        </button>
        {isAdmin && (
          <button
            className={`btn ${activeTab === 'assignment' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('assignment')}
          >
            Assign Personnel
          </button>
        )}
      </div>

      {/* TAB 1: ORGANIZATION PROFILE */}
      {activeTab === 'profile' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="card-title">Entity Details</h2>
            {isAdmin && !editingOrg && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingOrg(true)}>
                Edit Details
              </button>
            )}
          </div>

          {editingOrg ? (
            <form onSubmit={handleOrgSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Organization Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Organization Type</label>
                  <select
                    className="form-input"
                    value={orgData.orgType}
                    onChange={(e) => setOrgData({ ...orgData, orgType: e.target.value })}
                  >
                    <option value="Municipality">Municipality</option>
                    <option value="Corporate Enterprise">Corporate Enterprise</option>
                    <option value="Educational Institution">Educational Institution</option>
                    <option value="Non-Profit">Non-Profit</option>
                    <option value="Government Agency">Government Agency</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Official Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={orgData.address}
                    onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={orgData.contactEmail}
                    onChange={(e) => setOrgData({ ...orgData, contactEmail: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={orgData.contactPhone}
                    onChange={(e) => setOrgData({ ...orgData, contactPhone: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Official Website</label>
                  <input
                    type="url"
                    className="form-input"
                    value={orgData.website}
                    onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingOrg(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>ORGANIZATION NAME</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.2rem' }}>{orgData.name}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>ENTITY TYPE</span>
                <p style={{ fontSize: '1.05rem', marginTop: '0.2rem' }}>
                  <span className="status-pill online">{orgData.orgType}</span>
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>CONTACT EMAIL</span>
                <p style={{ marginTop: '0.2rem', color: 'var(--accent)' }}>{orgData.contactEmail || 'N/A'}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>CONTACT PHONE</span>
                <p style={{ marginTop: '0.2rem' }}>{orgData.contactPhone || 'N/A'}</p>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>HEADQUARTERS ADDRESS</span>
                <p style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>{orgData.address || 'N/A'}</p>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>WEBSITE</span>
                <p style={{ marginTop: '0.2rem' }}>
                  <a href={orgData.website} target="_blank" rel="noreferrer">{orgData.website || 'N/A'}</a>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPARTMENTS LISTING & CRUD */}
      {activeTab === 'departments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>Department Directory</h2>
            {isAdmin && (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  resetDeptForm();
                  setShowDeptModal(true);
                }}
              >
                + Add Department
              </button>
            )}
          </div>

          {/* Department Add/Edit Modal */}
          {showDeptModal && (
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
              <h3 style={{ marginBottom: '1rem' }}>
                {isEditingDept ? 'Edit Department' : 'Create New Department'}
              </h3>
              <form onSubmit={handleDeptSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Department Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Facilities & Fleet Management"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Code / Identifier</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. FFM-01"
                      value={deptForm.code}
                      onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Head of Department (Officer)</label>
                    <select
                      className="form-input"
                      value={deptForm.headOfDepartment}
                      onChange={(e) => setDeptForm({ ...deptForm, headOfDepartment: e.target.value })}
                    >
                      <option value="">-- None Assigned --</option>
                      {systemUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location / Building</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Building B, Room 302"
                      value={deptForm.location}
                      onChange={(e) => setDeptForm({ ...deptForm, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description / Scope</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Brief overview of department duties..."
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary">
                    {isEditingDept ? 'Update Department' : 'Create Department'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowDeptModal(false);
                      resetDeptForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Department Cards Grid */}
          {departments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>No departments found in the system.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {departments.map((dept) => (
                <div key={dept._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.2rem' }}>{dept.name}</h3>
                      <span className="brand-badge">{dept.code}</span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      {dept.description || 'No description provided.'}
                    </p>

                    <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                      <div>
                        <strong style={{ color: 'var(--text-dim)' }}>Department Head:</strong>{' '}
                        {dept.headOfDepartment ? (
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{dept.headOfDepartment.name}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', italic: true }}>Unassigned</span>
                        )}
                      </div>

                      <div>
                        <strong style={{ color: 'var(--text-dim)' }}>Location:</strong> {dept.location || 'Main Campus'}
                      </div>

                      <div>
                        <strong style={{ color: 'var(--text-dim)' }}>Assigned Personnel:</strong>{' '}
                        <span className="status-pill online">{dept.memberCount || 0} Members</span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleEditDeptClick(dept)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={() => handleDeleteDept(dept._id, dept.name)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGN USERS */}
      {activeTab === 'assignment' && isAdmin && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="card-title">Assign Personnel to Department</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Select a system user and assign them to an active organizational department
          </p>

          <form onSubmit={handleAssignUser}>
            <div className="form-group">
              <label className="form-label">Select User / Officer</label>
              <select
                className="form-input"
                value={assignment.userId}
                onChange={(e) => setAssignment({ ...assignment, userId: e.target.value })}
                required
              >
                <option value="">-- Choose User --</option>
                {systemUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email}) — Current Dept: {u.department || 'None'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Target Department</label>
              <select
                className="form-input"
                value={assignment.departmentName}
                onChange={(e) => setAssignment({ ...assignment, departmentName: e.target.value })}
                required
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Assign Department
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Organization;
