import React, { useState, useEffect } from 'react';
import './Admin.css';
import MetricCard from '../../components/ui/MetricCard';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import AlertPanel from '../../components/ui/AlertPanel';
import Chart from '../../components/ui/Chart';
import SideDrawer from '../../components/ui/SideDrawer';
import EmptyState from '../../components/shared/EmptyState';
import Button from '../../components/ui/Button';
import api from '../../utils/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerContent, setDrawerContent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null); // ← new: show error per tab

  const fetchData = async (tab, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setFetchError(null);

    try {
      const endpoint = tab === 'user-requests'
        ? 'user-requests'
        : `admin/${tab}`;

      console.log(`→ Fetching /api/${endpoint}`);
      const payload = await api.get(endpoint);
      console.log(`← Data for ${tab}:`, payload);

      // Normalize data shape
      if (['users', 'subscriptions', 'audit-logs', 'user-requests'].includes(tab)) {
        setData(Array.isArray(payload) ? payload : []);
      } else if (tab === 'storage') {
        setData({
          globalOverview: payload.globalOverview || {},
          perUser: payload.perUser || []
        });
      } else {
        setData(payload ?? {});
      }
    } catch (error) {
      console.error(`Fetch error [${tab}]:`, error);
      const msg = error.message || 'Failed to load data';

      setFetchError(msg);
      // Reset to safe empty state
      if (['users', 'subscriptions', 'audit-logs', 'user-requests'].includes(tab)) {
        setData([]);
      } else if (tab === 'storage') {
        setData({ globalOverview: {}, perUser: [] });
      } else {
        setData({});
      }
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch data based on active tab
    const loadData = async () => {
      await fetchData(activeTab);
    };
    loadData();
  }, [activeTab]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'storage', label: 'Storage' },
    { id: 'audit-logs', label: 'Audit Logs' },
    { id: 'user-requests', label: 'User Requests' },
    { id: 'messaging', label: 'Messaging' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Owner/Admin Management</h1>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {fetchError && (
          <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
            <strong>Error:</strong> {fetchError}
          </div>
        )}

        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'users' && (
          <UsersTab
            data={data}
            onDrawerOpen={(title, content) => {
              setDrawerTitle(title);
              setDrawerContent(content);
              setDrawerOpen(true);
            }}
            onRefreshData={(isRefresh) => fetchData('users', isRefresh)}
            refreshing={refreshing}
          />
        )}
        {activeTab === 'subscriptions' && <SubscriptionsTab data={data} onRefreshData={() => fetchData('subscriptions')} />}
        {activeTab === 'storage' && <StorageTab data={data} onRefreshData={() => fetchData('storage')} />}
        {activeTab === 'audit-logs' && <ReportsTab data={data} />}
        {activeTab === 'user-requests' && (
          <UserRequestsTab
            data={data}
            onDrawerOpen={(title, content) => {
              setDrawerTitle(title);
              setDrawerContent(content);
              setDrawerOpen(true);
            }}
            onRefreshData={() => fetchData('user-requests')}
          />
        )}
        {activeTab === 'messaging' && (
          <MessagingTab
            onRefreshData={() => fetchData('messaging')}
          />
        )}
      </div>

  {drawerOpen && (
  <SideDrawer
    isOpen={drawerOpen}
    onClose={() => setDrawerOpen(false)}
    title={drawerTitle}
  >
    {drawerContent}
  </SideDrawer>
)}

    </div>
  );
};

const OverviewTab = ({ data = {} }) => {
  const mrrHistory = data.mrrHistory || [];
  const userGrowth = data.userGrowth || [];
  const storageGrowth = data.storageGrowth || [];

  const mrrChartData = mrrHistory.map(item => ({
    label: item._id || 'Unknown',
    value: item.total || 0
  }));

  const userGrowthData = userGrowth.map(item => ({
    label: item._id || 'Unknown',
    value: item.newUsers || 0
  }));

  const storageGrowthData = storageGrowth.map(item => ({
    label: item._id || 'Unknown',
    value: item.totalStorage || 0
  }));

  return (
    <div>
      <div className="metrics-grid">
        <MetricCard title="Total Users"          value={data.totalUsers ?? 0}         trend={5.2} />
        <MetricCard title="Active Subscribers"   value={data.activeSubscribers ?? 0}  trend={12.8} />
        <MetricCard title="Trial Users"          value={data.trialUsers ?? 0}         trend={-3.1} />
        <MetricCard title="Monthly Revenue"      value={`$${data.mrr ?? 0}`}          trend={8.5} />
        <MetricCard title="Failed Payments"      value={data.failedPayments ?? 0}     trend={-15.3} />
        <MetricCard title="Total Storage Used"   value={`${(data.totalStorage ?? 0).toFixed(2)} GB`} trend={22.1} />
      </div>

      <div className="alerts-section">
        {data.alerts?.failedPayments > 0 && (
          <AlertPanel type="danger" title="Failed Payments" message={`${data.alerts.failedPayments} payments failed recently.`} />
        )}
        {data.alerts?.expiringTrials > 0 && (
          <AlertPanel type="warning" title="Expiring Trials" message={`${data.alerts.expiringTrials} trials expire soon.`} />
        )}
        {data.alerts?.nearLimitUsers > 0 && (
          <AlertPanel type="warning" title="Storage Limits" message={`${data.alerts.nearLimitUsers} users near limit.`} />
        )}
      </div>

      <div className="charts-container">
        {mrrChartData.length > 0 && <Chart type="line" data={mrrChartData} title="MRR (Last 6 Months)" />}
        {userGrowthData.length > 0 && <Chart type="bar" data={userGrowthData} title="New Users" />}
        {storageGrowthData.length > 0 && <Chart type="area" data={storageGrowthData} title="Storage Growth" />}
      </div>

      {mrrChartData.length === 0 && userGrowthData.length === 0 && storageGrowthData.length === 0 && (
        <EmptyState title="No overview data yet" description="Metrics will appear once platform activity begins." />
      )}
    </div>
  );
};

const UsersTab = ({ data, onDrawerOpen, onRefreshData, refreshing }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={(e) => {
            setSelectAll(e.target.checked);
            setSelectedUsers(e.target.checked ? data.map(user => user._id) : []);
          }}
        />
      ),
      render: (value, item) => (
        <input
          type="checkbox"
          checked={selectedUsers.includes(item._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUsers([...selectedUsers, item._id]);
            } else {
              setSelectedUsers(selectedUsers.filter(id => id !== item._id));
              setSelectAll(false);
            }
          }}
        />
      )
    },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'subscriptionStatus', label: 'Subscription' },
    { key: 'storageUsage', label: 'Storage Used', render: (value) => `${(value / 1024 / 1024 / 1024).toFixed(2)} GB` },
    { key: 'lastLogin', label: 'Last Active', render: (value) => value ? new Date(value).toLocaleDateString() : 'Never' },
    { key: 'isActive', label: 'Status', render: (value) => <Badge variant={value ? 'success' : 'danger'}>{value ? 'Active' : 'Suspended'}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      actions: [
        { key: 'view', label: 'View' },
        { key: 'changeRole', label: 'Change Role' },
        { key: 'toggleStatus', label: 'Toggle Status' }
      ]
    }
  ];

  const handleAction = async (action, user) => {
    switch (action) {
      case 'view': {
        // Open side drawer with user details
        const content = (
          <div className="user-details">
            <div className="detail-row">
              <strong>Name:</strong> {user.name}
            </div>
            <div className="detail-row">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="detail-row">
              <strong>Role:</strong> {user.role}
            </div>
            <div className="detail-row">
              <strong>Subscription:</strong> {user.subscriptionStatus}
            </div>
            <div className="detail-row">
              <strong>Storage Used:</strong> {(user.storageUsage / 1024 / 1024 / 1024).toFixed(2)} GB
            </div>
            <div className="detail-row">
              <strong>Last Login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
            </div>
            <div className="detail-row">
              <strong>Status:</strong> {user.isActive ? 'Active' : 'Suspended'}
            </div>
          </div>
        );
        onDrawerOpen(`User Details: ${user.name}`, content);
        break;
      }
      case 'changeRole': {
        const validRoles = ['tenant', 'property_manager', 'admin', 'owner'];
        const newRole = prompt(`Change role for ${user.name} (current: ${user.role}). Enter new role:`, user.role);
        if (newRole && newRole !== user.role) {
          if (!validRoles.includes(newRole)) {
            alert('Invalid role. Valid roles are: tenant, property_manager, admin, owner');
            break;
          }
          // Prevent self-demotion for owners
          if (user.role === 'owner' && newRole !== 'owner') {
            alert('Cannot change role of owner users');
            break;
          }
          try {
            await api.put(`admin/users/${user._id}/role`, { role: newRole });
            alert('Role updated successfully');
            onRefreshData();
          } catch {
            alert('Error updating role');
          }
        }
        break;
      }
      case 'toggleStatus': {
        const actionText = user.isActive ? 'suspend' : 'activate';
        if (window.confirm(`Are you sure you want to ${actionText} user ${user.name}?`)) {
          try {
            await api.put(`admin/users/${user._id}/status`, { isActive: !user.isActive });
            alert(`User ${actionText}d successfully`);
            onRefreshData();
          } catch {
            alert(`Error ${actionText}ing user`);
          }
        }
        break;
      }
      default:
        break;
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Subscription', 'Storage Used (GB)', 'Last Active', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(user => [
        user.name,
        user.email,
        user.role,
        user.subscriptionStatus,
        (user.storageUsage / 1024 / 1024 / 1024).toFixed(2),
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
        user.isActive ? 'Active' : 'Suspended'
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) return;
    if (window.confirm(`Activate ${selectedUsers.length} selected users?`)) {
      try {
        await Promise.all(selectedUsers.map(id => api.put(`admin/users/${id}/status`, { isActive: true })));
        alert('Users activated successfully');
        setSelectedUsers([]);
        setSelectAll(false);
        onRefreshData();
      } catch {
        alert('Error activating users');
      }
    }
  };

  const handleBulkSuspend = async () => {
    if (selectedUsers.length === 0) return;
    if (window.confirm(`Suspend ${selectedUsers.length} selected users?`)) {
      try {
        await Promise.all(selectedUsers.map(id => api.put(`admin/users/${id}/status`, { isActive: false })));
        alert('Users suspended successfully');
        setSelectedUsers([]);
        setSelectAll(false);
        onRefreshData();
      } catch {
        alert('Error suspending users');
      }
    }
  };

  return (
    <div>
      <div className="tab-header">
        <button onClick={() => onRefreshData(true)} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        <button onClick={exportToCSV} className="export-btn">Export CSV</button>
        {selectedUsers.length > 0 && (
          <>
            <button onClick={handleBulkActivate} className="bulk-btn activate">Activate Selected ({selectedUsers.length})</button>
            <button onClick={handleBulkSuspend} className="bulk-btn suspend">Suspend Selected ({selectedUsers.length})</button>
          </>
        )}
      </div>
      <DataTable
        data={data}
        columns={columns}
        onAction={handleAction}
      />
    </div>
  );
};

const SubscriptionsTab = ({ data, onRefreshData }) => {
  const columns = [
    { key: 'user', label: 'User', render: (user) => user?.name || 'N/A' },
    { key: 'plan', label: 'Plan', render: (plan) => <Badge variant="info">{plan}</Badge> },
    { key: 'billingCycle', label: 'Cycle' },
    { key: 'amount', label: 'Amount', render: (amount) => `$${amount}` },
    { key: 'status', label: 'Status', render: (status) => {
      const variants = {
        active: 'success',
        trial: 'warning',
        past_due: 'danger',
        canceled: 'default'
      };
      return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    }},
    { key: 'nextBillingDate', label: 'Next Billing', render: (date) => new Date(date).toLocaleDateString() },
    {
      key: 'actions',
      label: 'Actions',
      actions: [
        { key: 'viewInvoices', label: 'View Invoices' },
        { key: 'retryPayment', label: 'Retry Payment' },
        { key: 'upgrade', label: 'Upgrade' },
        { key: 'cancel', label: 'Cancel' }
      ]
    }
  ];

  const handleAction = async (action, subscription) => {
    switch (action) {
      case 'viewInvoices': {
        // Open invoices view - placeholder
        alert('Invoice viewing not implemented yet');
        break;
      }
      case 'retryPayment': {
        if (window.confirm('Retry payment for this subscription?')) {
          try {
            await api.put(`admin/subscriptions/${subscription._id}/retry`);
            alert('Payment retry initiated successfully');
          } catch {
            alert('Error retrying payment');
          }
        }
        break;
      }
      case 'upgrade': {
        const newPlan = prompt('Enter new plan (basic/professional/enterprise):', subscription.plan);
        const newAmount = prompt('Enter new amount:', subscription.amount);
        if (newPlan && newPlan !== subscription.plan && newAmount && !isNaN(newAmount)) {
          if (window.confirm(`Are you sure you want to upgrade this subscription to ${newPlan} for $${newAmount}?`)) {
            try {
              await api.put(`admin/subscriptions/${subscription._id}/upgrade`, { newPlan, newAmount: parseFloat(newAmount) });
              alert('Subscription upgraded successfully');
              onRefreshData();
            } catch {
              alert('Error upgrading subscription');
            }
          }
        }
        break;
      }
      case 'cancel': {
        if (window.confirm('Cancel this subscription? This action cannot be undone.')) {
          try {
            await api.put(`admin/subscriptions/${subscription._id}/cancel`);
            alert('Subscription cancelled successfully');
            onRefreshData();
          } catch {
            alert('Error cancelling subscription');
          }
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <div>
      <DataTable
        data={data}
        columns={columns}
        onAction={handleAction}
      />
    </div>
  );
};

const StorageTab = ({ data, onRefreshData }) => {
  const globalOverview = data.globalOverview || {};
  const perUser = data.perUser || [];

  const columns = [
    { key: 'user', label: 'User', render: (user) => user?.name || 'N/A' },
    { key: 'usedStorage', label: 'Used Storage', render: (value) => `${(value / 1024 / 1024 / 1024).toFixed(2)} GB` },
    { key: 'storageLimit', label: 'Storage Limit', render: (value) => `${(value / 1024 / 1024 / 1024).toFixed(2)} GB` },
    {
      key: 'usagePercent',
      label: '% Used',
      render: (value, item) => {
        const percent = ((item.usedStorage / item.storageLimit) * 100).toFixed(1);
        return <ProgressBar value={percent} showLabel={true} color={percent > 90 ? 'danger' : percent > 70 ? 'warning' : 'success'} />;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      actions: [
        { key: 'increaseLimit', label: 'Increase Limit' },
        { key: 'viewFiles', label: 'View Files' },
        { key: 'lockUploads', label: 'Lock Uploads' }
      ]
    }
  ];

  const handleAction = async (action, storage) => {
    switch (action) {
      case 'increaseLimit': {
        const newLimitGB = prompt('Enter new storage limit in GB:', (storage.storageLimit / 1024 / 1024 / 1024).toFixed(2));
        if (newLimitGB && !isNaN(newLimitGB)) {
          const newLimitBytes = parseFloat(newLimitGB) * 1024 * 1024 * 1024;
          if (window.confirm(`Are you sure you want to increase storage limit to ${newLimitGB} GB?`)) {
            try {
              await api.put(`admin/storage/${storage._id}/limit`, { storageLimit: newLimitBytes });
              alert('Storage limit updated successfully');
              window.location.reload(); // Refresh data
            } catch {
              alert('Error updating storage limit');
            }
          }
        }
        break;
      }
      case 'viewFiles': {
        // Open file browser - placeholder
        alert('File viewing not implemented yet');
        break;
      }
      case 'lockUploads': {
        if (window.confirm('Lock uploads for this user?')) {
          try {
            await api.put(`admin/storage/${storage._id}/lock`);
            alert('Uploads locked successfully');
            onRefreshData();
          } catch {
            alert('Error locking uploads');
          }
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <div>
      <div className="storage-overview">
        <div className="metrics-grid">
          <MetricCard title="Total Used" value={`${globalOverview.totalUsed || 0} GB`} />
          <MetricCard title="Avg Per User" value={`${globalOverview.avgPerUser || 0} GB`} />
          <MetricCard title="Top Consumers" value={globalOverview.topConsumers?.length || 0} />
          <MetricCard title="Near Limit" value={globalOverview.nearLimit?.length || 0} />
        </div>
      </div>

      <DataTable
        data={perUser}
        columns={columns}
        onAction={handleAction}
      />
    </div>
  );
};

const ReportsTab = ({ data }) => {
  const [filters, setFilters] = useState({
    action: '',
    actor: '',
    dateFrom: '',
    dateTo: ''
  });

  const filteredData = (Array.isArray(data) ? data : []).filter(log => {
    const matchesAction = !filters.action || log.action.includes(filters.action);
    const matchesActor = !filters.actor || log.actor?.name?.toLowerCase().includes(filters.actor.toLowerCase());
    const logDate = new Date(log.createdAt);
    const matchesDateFrom = !filters.dateFrom || logDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || logDate <= new Date(filters.dateTo);
    return matchesAction && matchesActor && matchesDateFrom && matchesDateTo;
  });

  const exportToCSV = () => {
    const headers = ['Actor', 'Action', 'Target', 'Details', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(log => [
        log.actor?.name || 'N/A',
        log.action,
        log.target?.name || 'N/A',
        JSON.stringify(log.details).replace(/"/g, '""'), // Escape quotes
        new Date(log.createdAt).toLocaleString()
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'audit_logs.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { key: 'actor', label: 'Actor', render: (actor) => actor?.name || 'N/A' },
    { key: 'action', label: 'Action' },
    { key: 'target', label: 'Target', render: (target) => target?.name || 'N/A' },
    { key: 'details', label: 'Details', render: (details) => JSON.stringify(details) },
    { key: 'createdAt', label: 'Date', render: (date) => new Date(date).toLocaleString() }
  ];

  return (
    <div>
      <div className="reports-filters">
        <div className="filter-row">
          <input
            type="text"
            placeholder="Filter by action..."
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Filter by actor..."
            value={filters.actor}
            onChange={(e) => setFilters(prev => ({ ...prev, actor: e.target.value }))}
          />
          <input
            type="date"
            placeholder="From date..."
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
          <input
            type="date"
            placeholder="To date..."
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />
          <button onClick={exportToCSV} className="export-btn">Export CSV</button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No audit logs found"
          description="There are no audit logs matching your filters. Try adjusting your search criteria."
        />
      ) : (
        <DataTable
          data={filteredData}
          columns={columns}
        />
      )}
    </div>
  );
};

const UserRequestsTab = ({ data, onDrawerOpen, onRefreshData }) => {
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={(e) => {
            setSelectAll(e.target.checked);
            setSelectedRequests(e.target.checked ? data.map(req => req._id) : []);
          }}
        />
      ),
      render: (value, item) => (
        <input
          type="checkbox"
          checked={selectedRequests.includes(item._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRequests([...selectedRequests, item._id]);
            } else {
              setSelectedRequests(selectedRequests.filter(id => id !== item._id));
              setSelectAll(false);
            }
          }}
        />
      )
    },
    { key: 'user', label: 'User', render: (user) => user?.name || 'N/A' },
    { key: 'type', label: 'Type', render: (type) => <Badge variant="info">{type}</Badge> },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status', render: (status) => {
      const variants = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger'
      };
      return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    }},
    { key: 'createdAt', label: 'Created', render: (date) => new Date(date).toLocaleDateString() },
    {
      key: 'actions',
      label: 'Actions',
      actions: [
        { key: 'view', label: 'View Details' },
        { key: 'approve', label: 'Approve' },
        { key: 'reject', label: 'Reject' }
      ]
    }
  ];

  const handleAction = async (action, request) => {
    switch (action) {
      case 'view': {
        const content = (
          <div className="request-details">
            <div className="detail-row">
              <strong>User:</strong> {request.user?.name}
            </div>
            <div className="detail-row">
              <strong>Type:</strong> {request.type}
            </div>
            <div className="detail-row">
              <strong>Title:</strong> {request.title}
            </div>
            <div className="detail-row">
              <strong>Description:</strong> {request.description}
            </div>
            <div className="detail-row">
              <strong>Status:</strong> {request.status}
            </div>
            <div className="detail-row">
              <strong>Created:</strong> {new Date(request.createdAt).toLocaleString()}
            </div>
            {request.adminResponse && (
              <div className="detail-row">
                <strong>Admin Response:</strong> {request.adminResponse}
              </div>
            )}
          </div>
        );
        onDrawerOpen(`Request Details: ${request.title}`, content);
        break;
      }
      case 'approve': {
        const response = prompt('Enter approval message (optional):');
        if (window.confirm('Are you sure you want to approve this request?')) {
          try {
            await api.patch(`user-requests/${request._id}`, { status: 'approved', adminResponse: response });
            // Send notification to user
            await api.post('notifications/send', {
              toUser: request.user._id,
              title: 'Request Approved',
              message: `Your request "${request.title}" has been approved.${response ? ` Message: ${response}` : ''}`,
              type: 'admin'
            });
            alert('Request approved successfully and notification sent');
            onRefreshData();
          } catch (error) {
            alert('Error approving request: ' + error.message);
          }
        }
        break;
      }
      case 'reject': {
        const response = prompt('Enter rejection reason:');
        if (response && window.confirm('Are you sure you want to reject this request?')) {
          try {
            await api.patch(`user-requests/${request._id}`, { status: 'rejected', adminResponse: response });
            // Send notification to user
            await api.post('notifications/send', {
              toUser: request.user._id,
              title: 'Request Rejected',
              message: `Your request "${request.title}" has been rejected. Reason: ${response}`,
              type: 'admin'
            });
            alert('Request rejected successfully and notification sent');
            onRefreshData();
          } catch (error) {
            alert('Error rejecting request: ' + error.message);
          }
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <div>
      <DataTable
        data={data}
        columns={columns}
        onAction={handleAction}
      />
    </div>
  );
};

const MessagingTab = ({ onRefreshData }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Fetch users for the dropdown
    const fetchUsers = async () => {
      try {
        const response = await api.get('admin/users');
        setUsers(response.data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSendMessage = async () => {
    if (!selectedUser || !title.trim() || !message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await api.post('notifications/send', {
        toUser: selectedUser,
        title: title.trim(),
        message: message.trim(),
        type: 'admin'
      });
      alert('Message sent successfully');
      setSelectedUser('');
      setTitle('');
      setMessage('');
      onRefreshData();
    } catch (error) {
      alert('Error sending message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h3>Send Admin Message</h3>
      <div className="message-form">
        <div className="form-group">
          <label htmlFor="user-select">Select User:</label>
          <select
            id="user-select"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Choose a user...</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="message-title">Title:</label>
          <input
            id="message-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter message title"
            maxLength="200"
          />
        </div>
        <div className="form-group">
          <label htmlFor="message-content">Message:</label>
          <textarea
            id="message-content"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            rows="5"
          />
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </div>
  );
};

export default Admin;
