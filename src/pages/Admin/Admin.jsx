import React, { useState, useEffect, useMemo } from 'react';
import './Admin.css';
import api from '../../utils/api';
import Chart from '../../components/ui/Chart';
import SideDrawer from '../../components/ui/SideDrawer';

// --- Shared Components for Admin ---

const StatusBadge = ({ status, variant }) => {
  let finalVariant = variant;
  if (!variant) {
    const s = String(status).toLowerCase();
    if (['active', 'paid', 'approved', 'completed'].includes(s)) finalVariant = 'success';
    else if (['pending', 'trial', 'warning', 'in-progress'].includes(s)) finalVariant = 'warning';
    else if (['suspended', 'overdue', 'failed', 'rejected', 'danger', 'canceled'].includes(s)) finalVariant = 'danger';
    else finalVariant = 'neutral';
  }
  return <span className={`status-badge ${finalVariant}`}>{status}</span>;
};

const EmptyState = ({ message, action }) => (
  <div className="empty-state">
    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📂</div>
    <p>{message}</p>
    {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
  </div>
);

// --- Sub-Tabs ---

const OverviewSection = ({ data }) => {
  const safeData = data || {};
  const { 
    totalUsers = 0, 
    activeSubscribers = 0, 
    mrr = 0, 
    totalStorage = 0, 
    recentActivities = []
  } = safeData;

  const cards = [
    { title: 'Total Users', value: totalUsers, trend: '+5%' },
    { title: 'Active Subscribers', value: activeSubscribers, trend: '+12%' },
    { title: 'Monthly Revenue', value: `$${Number(mrr).toFixed(2)}`, trend: '+8%' },
    { title: 'Storage Used', value: `${(Number(totalStorage) || 0).toFixed(2)} GB`, trend: '+2%' },
  ];

  return (
    <div>
      <div className="metrics-grid">
        {cards.map((card, i) => (
          <div key={i} className="metric-card">
            <h3>{card.title}</h3>
            <div className="value">{card.value}</div>
            <div className="trend positive">{card.trend}</div>
          </div>
        ))}
      </div>
      
      <div className="table-section" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Recent Activities</h3>
        <GenericTable 
          data={recentActivities}
          columns={[
            { 
              key: 'action', 
              label: 'Action', 
              render: (val, row) => (
                <div>
                  <div style={{ fontWeight: '500', color: '#374151' }}>
                    {val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  {row.details?.title && (
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {row.details.title}
                    </div>
                  )}
                </div>
              )
            },
            { key: 'actor', label: 'Actor', render: (val) => val?.name || 'System' },
            { 
              key: 'target', 
              label: 'Affected User', 
              render: (val, row) => {
                // If action is user_created, the actor is the target, so we don't need to show it twice
                if (row.action === 'user_created') return '-';
                return val?.name || '-';
              }
            },
            { 
              key: 'createdAt', 
              label: 'Time', 
              render: (val) => (
                <span style={{ color: '#666', fontSize: '0.875rem' }}>
                  {new Date(val).toLocaleString()}
                </span>
              )
            },
          ]}
        />
      </div>
    </div>
  );
};

const GenericTable = ({ data, columns, actions }) => {
  if (!data || data.length === 0) return <EmptyState message="No records found." />;

  return (
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map(col => <th key={col.key}>{col.label}</th>)}
            {actions && <th style={{ width: '150px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row._id || idx}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                </td>
              ))}
              {actions && (
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start' }}>
                    {actions.map(act => (
                      <button 
                        key={act.label} 
                        onClick={() => act.onClick(row)}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.75rem', 
                          cursor: 'pointer',
                          background: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          color: '#374151',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                          ...act.style
                        }}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Messaging Tab ---

const MessagingTab = ({ initialRecipientId }) => {
  const [users, setUsers] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(initialRecipientId || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Fetch users for the dropdown
    api.get('admin/users').then(res => {
      const uList = res.data || (Array.isArray(res) ? res : []);
      setUsers(uList);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialRecipientId) {
      setSelectedRecipient(initialRecipientId);
    }
  }, [initialRecipientId]);

  const handleSend = async () => {
    if (!selectedRecipient || !title || !message) return alert('Please fill all fields');
    
    setSending(true);
    try {
      await api.post('notifications/send', {
        toUser: selectedRecipient,
        title,
        message,
        type: 'admin'
      });
      alert('Message sent successfully!');
      setTitle('');
      setMessage('');
      setSelectedRecipient('');
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>Send Direct Message</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Recipient</label>
        <select 
          value={selectedRecipient} 
          onChange={e => setSelectedRecipient(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
        >
          <option value="">Select a user...</option>
          {users.map(u => (
            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subject</label>
        <input 
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Message subject"
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Message</label>
        <textarea 
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type your message here..."
          rows={5}
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical' }}
        />
      </div>

      <button 
        onClick={handleSend}
        disabled={sending}
        style={{ 
          width: '100%', 
          padding: '0.75rem', 
          background: sending ? '#9ca3af' : '#4f46e5', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px', 
          fontWeight: '500', 
          cursor: sending ? 'not-allowed' : 'pointer' 
        }}
      >
        {sending ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  );
};

// --- User Details View ---

const UserDetailsView = ({ user, onClose, onRefresh, onMessageUser }) => {
  if (!user) return null;

  const handleAction = async (action, value) => {
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    try {
      if (action === 'change_status') {
        await api.put(`admin/users/${user._id}/status`, { isActive: value });
      } else if (action === 'change_role') {
        await api.put(`admin/users/${user._id}/role`, { role: value });
      } else if (action === 'terminate') {
        await api.delete(`admin/users/${user._id}`);
      }
      alert('Update successful');
      onRefresh(); // Refresh parent data
      onClose();   // Close drawer
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
      <span style={{ color: '#666', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ fontWeight: '500', color: '#111' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: '0.5rem' }}>
      <button 
        onClick={onClose}
        style={{ 
          width: '100%', padding: '0.75rem', marginBottom: '1.5rem', 
          background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px',
          fontWeight: '600', color: '#374151', cursor: 'pointer'
        }}
      >
        Close View
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: '#e0e7ff', color: '#4f46e5', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 'bold'
        }}>
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{user.name}</h2>
          <p style={{ margin: 0, color: '#666' }}>{user.email}</p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', borderBottom: '2px solid #f3f4f6', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Profile Information</h3>
        <InfoRow label="User ID" value={user._id} />
        <InfoRow label="Role" value={<StatusBadge status={user.role} />} />
        <InfoRow label="Status" value={<StatusBadge status={user.isActive ? 'Active' : 'Suspended'} variant={user.isActive ? 'success' : 'danger'} />} />
        <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
        <InfoRow label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'} />
        <InfoRow label="Phone" value={user.phone || 'N/A'} />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', borderBottom: '2px solid #f3f4f6', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Usage & Subscription</h3>
        <InfoRow label="Subscription Status" value={<StatusBadge status={user.subscriptionStatus || 'None'} />} />
        <InfoRow label="Storage Used" value={`${((user.storageUsage || 0) / (1024**3)).toFixed(2)} GB`} />
        <InfoRow label="Storage Limit" value={`${((user.storageLimit || 0) / (1024**3)).toFixed(2)} GB`} />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {user.isActive ? (
             <button 
               onClick={() => handleAction('change_status', false)}
               style={{ padding: '10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
             >
               Suspend User
             </button>
          ) : (
             <button 
               onClick={() => handleAction('change_status', true)}
               style={{ padding: '10px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
             >
               Activate User
             </button>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
               onClick={() => onMessageUser(user._id)}
               style={{ flex: 1, padding: '10px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
            >
              Message User
            </button>
            <button
               onClick={() => handleAction('terminate')}
               style={{ flex: 1, padding: '10px', background: '#fef2f2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
            >
              Terminate User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Admin Component ---

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Debug drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerContent, setDrawerContent] = useState(null);
  const [recipientId, setRecipientId] = useState('');

  const handleMessageUser = (userId) => {
    setRecipientId(userId);
    setActiveTab('messaging');
    setDrawerOpen(false);
  };

  const fetchData = async (tab, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    if (!silent) setData(null); // Clear previous data only if generic loading
    
    try {
      if (tab === 'messaging') {
        setLoading(false);
        return; // Messaging handles its own data
      }

      let endpoint = `admin/${tab}`;
      const response = await api.get(endpoint);
      
      let normalizedData = response;
      if (response && response.data) {
        normalizedData = response.data;
      }

      if (tab === 'users' && !Array.isArray(normalizedData) && normalizedData.data) {
        normalizedData = normalizedData.data;
      }
      
      setData(normalizedData);
    } catch (err) {
      console.error(`[Admin] Error fetching ${tab}:`, err);
      // For user-requests, it might be a 404 if route doesn't exist, handle gracefully
      if (tab === 'user-requests' && err.message.includes('404')) {
         setData([]); // just empty
      } else {
         setError(err.message || "Failed to load data");
         setData(tab === 'overview' ? {} : []); 
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'storage', label: 'Storage' },
    { id: 'audit-logs', label: 'Audit Logs' },
    { id: 'user-requests', label: 'Requests' },
    { id: 'messaging', label: 'Messaging' },
  ];

  const renderContent = () => {
    if (loading) return <div className="loading-state">Loading {activeTab}...</div>;
    if (error) return <div className="error-state">Error: {error}</div>;

    switch (activeTab) {
      case 'overview':
        return <OverviewSection data={data} />;
      
      case 'users':
        return (
          <div className="table-section">
            <GenericTable 
              data={Array.isArray(data) ? data : []}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role', render: (val) => <StatusBadge status={val} /> },
                { key: 'isActive', label: 'Status', render: (val) => <StatusBadge status={val ? 'Active' : 'Suspended'} /> },
                { key: 'createdAt', label: 'Joined', render: (val) => new Date(val).toLocaleDateString() },
              ]}
              actions={[
                { label: 'View Details', onClick: (u) => openUserDetails(u) }
              ]}
            />
          </div>
        );

      case 'subscriptions':
        return (
          <div className="table-section">
             <GenericTable 
              data={Array.isArray(data) ? data : []}
              columns={[
                { key: 'user', label: 'User', render: (u) => u?.name || 'Unknown' },
                { key: 'plan', label: 'Plan' },
                { key: 'amount', label: 'Amount', render: (v) => `$${v}` },
                { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
              ]}
            />
          </div>
        );

      case 'storage':
        const storageList = data?.perUser || (Array.isArray(data) ? data : []);
        return (
          <div className="table-section">
            <h3 style={{ marginBottom: '1rem' }}>Storage Usage</h3>
            <GenericTable 
              data={storageList}
              columns={[
                { key: 'user', label: 'User', render: (u) => u?.name || 'Unknown' },
                { key: 'usedStorage', label: 'Used (GB)', render: (v) => (v / (1024**3)).toFixed(2) },
                { key: 'storageLimit', label: 'Limit (GB)', render: (v) => (v / (1024**3)).toFixed(2) },
              ]}
            />
          </div>
        );

      case 'audit-logs':
        return (
          <div className="table-section">
             <GenericTable 
              data={Array.isArray(data) ? data : []}
              columns={[
                { key: 'action', label: 'Action' },
                { key: 'actor', label: 'Actor', render: (u) => u?.name || 'System' },
                { key: 'createdAt', label: 'Time', render: (v) => new Date(v).toLocaleString() },
              ]}
            />
          </div>
        );

      case 'user-requests':
        return (
           <div className="table-section">
            <GenericTable 
              data={Array.isArray(data) ? data : []}
              columns={[
                { key: 'title', label: 'Request' },
                { key: 'user', label: 'From', render: (u) => u?.name || 'Unknown' },
                { key: 'type', label: 'Type' },
                { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
              ]}
              actions={[
                { label: 'Details', onClick: (r) => { setDrawerContent(<pre>{JSON.stringify(r, null, 2)}</pre>); setDrawerOpen(true); setSelectedUser(null); } }
              ]}
            />
          </div>
        );

      case 'messaging':
        return <MessagingTab initialRecipientId={recipientId} />;

      default:
        return <EmptyState message="Unknown Tab" />;
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage system, users, and content</p>
        </div>
        <button 
          onClick={() => fetchData(activeTab)} 
          style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
        >
          Refresh Data
        </button>
      </div>

      <div className="admin-tabs">
        {tabs.map(t => (
          <button 
            key={t.id} 
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        <div style={{ padding: '1.5rem' }}>
          {renderContent()}
        </div>
      </div>

      <SideDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        title={selectedUser ? "User Details" : "Details"}
      >
        {selectedUser ? (
          <UserDetailsView 
            user={selectedUser} 
            onClose={() => setDrawerOpen(false)}
            onRefresh={() => fetchData(activeTab, true)}
            onMessageUser={handleMessageUser}
          />
        ) : (
          <div style={{ padding: '1rem', overflowX: 'auto' }}>
            {drawerContent}
          </div>
        )}
      </SideDrawer>
    </div>
  );
};

export default Admin;