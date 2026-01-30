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
import api from '../../utils/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerContent, setDrawerContent] = useState(null);

  const fetchData = async (tab) => {
    try {
      console.log(`Fetching admin/${tab} data...`);
      const response = await api.get(`admin/${tab}`);
      console.log(`Received data for ${tab}:`, response);
      setData(response);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Failed to load ${tab} data. Please try again. Error: ${error.message}`);
      setData({}); // Reset data on error
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
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'users' && (
          <UsersTab
            data={data}
            onDrawerOpen={(title, content) => {
              setDrawerTitle(title);
              setDrawerContent(content);
              setDrawerOpen(true);
            }}
            onRefreshData={() => fetchData('users')}
          />
        )}
        {activeTab === 'subscriptions' && <SubscriptionsTab data={data} />}
        {activeTab === 'storage' && <StorageTab data={data} />}
        {activeTab === 'audit-logs' && <ReportsTab data={data} />}
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

const OverviewTab = ({ data }) => {
  const safeData = data || {};
  const mrrChartData = safeData.mrrHistory?.map(item => ({
    label: item._id,
    value: item.total || 0
  })) || [];

  const userGrowthData = safeData.userGrowth?.map(item => ({
    label: item._id,
    value: item.newUsers || 0
  })) || [];

  const storageGrowthData = safeData.storageGrowth?.map(item => ({
    label: item._id,
    value: item.totalStorage || 0
  })) || [];

  return (
    <div>
      {/* Temporary verification - remove after confirming data renders correctly */}
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <div className="metrics-grid">
        <MetricCard
          title="Total Users"
          value={data.totalUsers || 0}
          trend={5.2}
          tooltip="Total registered users across the platform"
        />
        <MetricCard
          title="Active Subscribers"
          value={data.activeSubscribers || 0}
          trend={12.8}
          tooltip="Users with active paid subscriptions"
        />
        <MetricCard
          title="Trial Users"
          value={data.trialUsers || 0}
          trend={-3.1}
          tooltip="Users currently on trial period"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${data.mrr || 0}`}
          trend={8.5}
          tooltip="Monthly Recurring Revenue from active subscriptions"
        />
        <MetricCard
          title="Failed Payments"
          value={data.failedPayments || 0}
          trend={-15.3}
          tooltip="Number of failed payment attempts this month"
        />
        <MetricCard
          title="Total Storage Used"
          value={`${data.totalStorage?.toFixed(2) || 0} GB`}
          trend={22.1}
          tooltip="Total storage consumed by all users"
        />
      </div>

      <div className="alerts-section">
        {data.alerts?.failedPayments > 0 && (
          <AlertPanel type="danger" title="Failed Payments" message={`${data.alerts.failedPayments} payments have failed recently.`} />
        )}
        {data.alerts?.expiringTrials > 0 && (
          <AlertPanel type="warning" title="Expiring Trials" message={`${data.alerts.expiringTrials} trial subscriptions expire in the next 7 days.`} />
        )}
        {data.alerts?.nearLimitUsers > 0 && (
          <AlertPanel type="warning" title="Storage Limits" message={`${data.alerts.nearLimitUsers} users are near their storage limit.`} />
        )}
      </div>

      <div className="charts-container">
        {mrrChartData.length > 0 && (
          <Chart type="line" data={mrrChartData} title="MRR Over Last 6 Months" />
        )}
        {userGrowthData.length > 0 && (
          <Chart type="bar" data={userGrowthData} title="New Users Growth" />
        )}
        {storageGrowthData.length > 0 && (
          <Chart type="area" data={storageGrowthData} title="Storage Growth" />
        )}
      </div>
    </div>
  );
};

const UsersTab = ({ data, onDrawerOpen, onRefreshData }) => {
  const columns = [
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

const SubscriptionsTab = ({ data }) => {
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
          try {
            await api.put(`admin/subscriptions/${subscription._id}/upgrade`, { newPlan, newAmount: parseFloat(newAmount) });
            alert('Subscription upgraded successfully');
            window.location.reload(); // Refresh data
          } catch {
            alert('Error upgrading subscription');
          }
        }
        break;
      }
      case 'cancel': {
        if (window.confirm('Cancel this subscription? This action cannot be undone.')) {
          try {
            await api.put(`admin/subscriptions/${subscription._id}/cancel`);
            alert('Subscription cancelled successfully');
            window.location.reload(); // Refresh data
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

const StorageTab = ({ data }) => {
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
          try {
            await api.put(`admin/storage/${storage._id}/limit`, { storageLimit: newLimitBytes });
            alert('Storage limit updated successfully');
            window.location.reload(); // Refresh data
          } catch {
            alert('Error updating storage limit');
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
            window.location.reload(); // Refresh data
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

export default Admin;
