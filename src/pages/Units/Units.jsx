import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import './Units.css'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../utils/api'

const fmtCurrency = (v) => {
  try { return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v || 0) } catch { return `ETB ${Number(v||0).toLocaleString()}` }
}

export default function UnitsPage() {
  const [searchParams] = useSearchParams()
  const propertyIdFromUrl = searchParams.get('propertyId')
  const [propertyId, setPropertyId] = useState(propertyIdFromUrl || '')
  const [properties, setProperties] = useState([])
  const [units, setUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  // const [isModalOpen, setIsModalOpen] = useState(false)
  // const [editingUnit, setEditingUnit] = useState(null)
  // const [formData, setFormData] = useState({
  //   unitNumber: '',
  //   floor: '',
  //   bedrooms: 0,
  //   bathrooms: 0,
  //   size: 0,
  //   rent: 0,
  //   notes: '',
  //   image: null
  // })

  useEffect(() => {
    (async () => {
      const ps = await api.get('properties')
      const ts = await api.get('tenants')
      setProperties(ps.properties || [])
      setTenants(ts || [])
      if (propertyIdFromUrl) {
        setPropertyId(propertyIdFromUrl)
        const us = await api.get(`units/property/${propertyIdFromUrl}`)
        setUnits(us || [])
      } else if (ps.properties && ps.properties.length > 0) {
        setPropertyId(ps.properties[0]._id)
        const us = await api.get(`units/property/${ps.properties[0]._id}`)
        setUnits(us || [])
      }
    })()
  }, [propertyIdFromUrl])

  const currentProperty = useMemo(() => properties.find(p => p._id === propertyId) || null, [properties, propertyId])

  const handlePropertyChange = async (newPropertyId) => {
    setPropertyId(newPropertyId)
    const us = await api.get(`units/property/${newPropertyId}`)
    setUnits(us || [])
  }

  const refreshProperties = async () => {
    setIsRefreshing(true)
    try {
      const ps = await api.get('properties')
      setProperties(ps.properties || [])
    } catch (error) {
      console.error('Error refreshing properties:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // const handleAddUnit = () => {
  //   setEditingUnit(null)
  //   setFormData({
  //     unitNumber: '',
  //     floor: '',
  //     bedrooms: 0,
  //     bathrooms: 0,
  //     size: 0,
  //     rent: 0,
  //     notes: '',
  //     image: null
  //   })
  //   setIsModalOpen(true)
  // }

  // const handleEditUnit = (unit) => {
  //   setEditingUnit(unit)
  //   setFormData({
  //     unitNumber: unit.unitNumber,
  //     floor: unit.floor || '',
  //     bedrooms: unit.bedrooms || 0,
  //     bathrooms: unit.bathrooms || 0,
  //     size: unit.size || 0,
  //     rent: unit.rent || 0,
  //     notes: unit.notes || '',
  //     image: null
  //   })
  //   setIsModalOpen(true)
  // }

  // const handleFormSubmit = async (e) => {
  //   e.preventDefault()

  //   try {
  //     let imageUrl = editingUnit?.imageUrl || null
  //     if (formData.image) {
  //       const formDataUpload = new FormData()
  //       formDataUpload.append('file', formData.image)
  //       const uploadResponse = await api.post('uploads/image', formDataUpload, {
  //         headers: { 'Content-Type': 'multipart/form-data' }
  //       })
  //       imageUrl = uploadResponse.url
  //     }

  //     const unitData = {
  //       propertyId,
  //       unitNumber: formData.unitNumber,
  //       floor: formData.floor,
  //       bedrooms: formData.bedrooms,
  //       bathrooms: formData.bathrooms,
  //       size: formData.size,
  //       rent: formData.rent,
  //       notes: formData.notes,
  //       imageUrl
  //     }

  //     if (editingUnit) {
  //       await api.put(`units/${editingUnit._id}`, unitData)
  //       setUnits(prev => prev.map(u => u._id === editingUnit._id ? { ...u, ...unitData } : u))
  //     } else {
  //       const newUnit = await api.post('units', unitData)
  //       setUnits(prev => [...prev, newUnit])
  //     }

  //     setIsModalOpen(false)
  //   } catch (error) {
  //     console.error('Error saving unit:', error)
  //   }
  // }

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target
  //   setFormData(prev => ({ ...prev, [name]: value }))
  // }

  // const handleImageChange = (e) => {
  //   const file = e.target.files[0]
  //   setFormData(prev => ({ ...prev, image: file }))
  // }

  return (
    <div className="units-page">
      <div className="page-header">
        <div>
          <h1 id="property-name-header">{currentProperty ? `Units for ${currentProperty.name}` : 'Units'}</h1>
          <p id="property-address-subheader">{currentProperty?.address || 'Manage units for the selected property.'}</p>
        </div>
        <div className="header-actions">
          <a href="/properties" className="btn-secondary"><i className="fa-solid fa-arrow-left"></i><span>Back to Properties</span></a>
          <Button variant="secondary" onClick={refreshProperties} disabled={isRefreshing}>
            <i className={`fa-solid ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-refresh'}`}></i>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Properties'}</span>
          </Button>
          {/* <Button variant="primary" onClick={handleAddUnit}><i className="fa-solid fa-plus"></i><span>Add Unit</span></Button> */}
        </div>
      </div>

      <Card>
        <div className="form-group">
          <label className="form-label" htmlFor="prop">Property</label>
          <select id="prop" className="form-input" value={propertyId} onChange={e => handlePropertyChange(e.target.value)}>
            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
      </Card>

      <div id="unit-list" className="unit-grid">
        {units.length === 0 ? (
          <div id="empty-state" className="empty-state"><i className="fa-solid fa-door-open"></i><h3>No Units Found</h3><p>Get started by adding a new unit to this property.</p></div>
        ) : (
          units.map(u => {
            const tenant = tenants.find(t => t.id === u.tenantId)
            return (
              <div key={u.id} className="unit-card" data-id={u.id}>
                <div className="unit-card-header">
                  <h3>Unit {u.unitNumber}</h3>
                  <span className={`status-badge ${tenant ? 'status-occupied' : 'status-vacant'}`}>{tenant ? 'Occupied' : 'Vacant'}</span>
                </div>
                <div className="unit-card-details">
                  <div><span>Tenant</span><span>{tenant?.name || 'N/A'}</span></div>
                  <div><span>Rent</span><span>{fmtCurrency(u.rent)}</span></div>
                  <div><span>Bedrooms / Bathrooms</span><span>{u.bedrooms || 0} / {u.bathrooms || 0}</span></div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
