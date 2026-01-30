import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Tenants.css'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import AddTenantModal from '../../components/ui/AddTenantModal'
import DetailsModal from '../../components/ui/DetailsModal'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'

export default function TenantsPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tenants, setTenants] = useState([])
  const [properties, setProperties] = useState([])
  const [units, setUnits] = useState([])
  const [leases, setLeases] = useState([])
  const [openActionId, setOpenActionId] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionId && !event.target.closest('.action-dropdown')) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionId]);

  useEffect(() => {
    (async () => {
      const ts = await api.get('tenants')
      const ps = await api.get('properties')
      const us = await api.get('units')
      const ls = await api.get('leases')
      setTenants(ts || [])
      setProperties(ps.properties || [])
      setUnits(us || [])
      setLeases(ls || [])
    })()
  }, [])

  const getLeaseStatus = (lease) => {
    if (!lease) return { text: 'No Lease', class: 'status-expired' }
    const today = new Date().setHours(0,0,0,0)
    // Use a fixed date or a default value that doesn't change on re-render if lease.startDate/endDate is missing
    const start = new Date(lease.startDate || '1970-01-01').setHours(0,0,0,0)
    const end = new Date(lease.endDate || '1970-01-01').setHours(0,0,0,0)
    if (today > end) return { text: 'Expired', class: 'status-expired' }
    if (today >= start && today <= end) return { text: 'Active', class: 'status-active' }
    return { text: 'Upcoming', class: 'status-upcoming' }
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return tenants.filter(t => {
      const unit = units.find(u => u.id === t.unitId)
      const prop = unit ? properties.find(p => p.id === unit.propertyId) : null
      return (t.name||'').toLowerCase().includes(s) || (t.email||'').toLowerCase().includes(s) || (prop?.name||'').toLowerCase().includes(s)
    })
  }, [search, tenants, units, properties])



  const handleViewDetails = (tenant) => {
    navigate(`/tenants/${tenant.id}`)
  }

  const handleEditTenant = (tenant) => {
    navigate(`/tenants/${tenant.id}/edit`)
  }

  const handleDeleteTenant = async (tenant) => {
    if (window.confirm(t('Are you sure you want to delete this tenant?'))) {
      try {
        await api.delete(`tenants/${tenant.id}`)
        setTenants(prev => prev.filter(t => t.id !== tenant.id))
        alert(t('Tenant deleted successfully'))
      } catch (error) {
        console.error('Failed to delete tenant:', error)
        alert(t('Failed to delete tenant'))
      }
    }
  }



  return (
    <div className="tenants-page">
      <div className="page-header">
        <div>
          <h1>{t('Tenants')}</h1>
          <p>{t('Manage all tenants across your properties.')}</p>
        </div>
        <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}> <i className="fa-solid fa-plus"></i> <span>{t('Add Tenant')}</span></Button>
      </div>

      <Card>
        <div className="table-header">
          <input type="text" className="form-input" placeholder={t('Search by name, email, or property...')} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Name')}</th>
                <th>{t('Contact')}</th>
                <th>{t('Property / Unit')}</th>
                <th>{t('Lease Period')}</th>
                <th>{t('TIN Number')}</th>
                <th>{t('Status')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-4">{t('No Tenants Found')}</td></tr>
              ) : filtered.map(tenant => {
                const unit = units.find(u=>u.id===tenant.unitId)
                const prop = unit ? properties.find(p=>p.id===unit.propertyId) : null
                const lease = leases.find(l=>l.tenantId===tenant.id) || null
                const status = getLeaseStatus(lease)
                return (
                  <tr key={tenant.id}>
                    <td>{tenant.name}</td>
                    <td>{tenant.email}<br/><span className="text-sm text-gray-500">{tenant.phone}</span></td>
                    <td>{prop?.name || t('N/A')} <span className="lease-property-unit">{t('Unit')} {unit?.unitNumber || t('N/A')}</span></td>
                    <td>{lease ? `${new Date(lease.startDate).toLocaleDateString()} - ${new Date(lease.endDate).toLocaleDateString()}` : t('N/A')}</td>
                    <td>{tenant.tinNumber || t('N/A')}</td>
                    <td><span className={`status-badge ${status.class}`}>{t(status.text)}</span></td>
                    <td>
                      <div className="action-dropdown">
                        <button className="action-dropdown-btn" onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionId(openActionId === tenant.id ? null : tenant.id);
                        }}>
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        {openActionId === tenant.id && (
                        <div className="dropdown-menu align-right show">
                          <a key="view" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleViewDetails(tenant); }}>
                            <i className="fa-solid fa-eye"></i>{t('View Details')}
                          </a>
                          <a key="edit" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleEditTenant(tenant); }}>
                            <i className="fa-solid fa-pencil"></i>{t('Edit')}
                          </a>
                          <a key="delete" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleDeleteTenant(tenant); }}>
                            <i className="fa-solid fa-trash-can"></i>{t('Delete')}
                          </a>
                        </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <AddTenantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTenantAdded={(newTenant) => {
          setTenants(prev => [newTenant, ...prev])
        }}
      />

    </div>
  )
}
