import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Documents.css'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import UploadDocumentModal from '../../components/ui/UploadDocumentModal'
import DetailsModal from '../../components/ui/DetailsModal'
import api from '../../utils/api'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B'
  const sizes = ['B','KB','MB','GB','TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const getFileIcon = (mime) => {
  if (!mime) return { icon: 'fa-solid fa-file', className: 'icon-other' }
  if (mime.startsWith('image/')) return { icon: 'fa-solid fa-file-image', className: 'icon-image' }
  if (mime === 'application/pdf') return { icon: 'fa-solid fa-file-pdf', className: 'icon-pdf' }
  if (mime.includes('wordprocessingml')) return { icon: 'fa-solid fa-file-word', className: 'icon-doc' }
  return { icon: 'fa-solid fa-file', className: 'icon-other' }
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [documents, setDocuments] = useState([])
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [openActionId, setOpenActionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const loadDocumentsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [docs, props, tens] = await Promise.all([
        api.get('documents'),
        api.get('properties'),
        api.get('tenants')
      ])
      setDocuments(docs || [])
      setProperties(props.properties || [])
      setTenants(tens || [])
    } catch (err) {
      setError('Failed to load documents. Please try again.')
      console.error('Documents data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocumentsData()
  }, [])

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

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return (documents || []).filter(d => {
      const matchesCategory = category === 'all' || d.category === category
      const matchesSearch = (d.name || '').toLowerCase().includes(s) || (d.category || '').toLowerCase().includes(s)
      return matchesCategory && matchesSearch
    })
  }, [documents, search, category])

  const linkedTo = (doc) => {
    if (!doc) return 'General'
    if (doc.propertyId) {
      const p = properties.find(x => x.id === doc.propertyId)
      return p?.name || 'Property'
    }
    if (doc.tenantId) {
      const t = tenants.find(x => x.id === doc.tenantId)
      return t?.name || 'Tenant'
    }
    return 'General'
  }

  const handleDocumentUploaded = (newDocument) => {
    setDocuments(prev => [newDocument, ...prev])
  }

  const handleViewDocument = (doc) => {
    navigate(`/documents/${doc.id}`)
  }

  const handleDownloadDocument = (doc) => {
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Document URL not available');
    }
  }

  const handleDeleteDocument = async (doc) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`documents/${doc.id}`)
        setDocuments(prev => prev.filter(d => d.id !== doc.id))
        alert('Document deleted successfully')
      } catch (error) {
        console.error('Failed to delete document:', error)
        alert('Failed to delete document')
      }
    }
  }

  if (loading) {
    return (
      <div className="documents-page">
        <div className="page-header">
          <h1>Documents</h1>
          <p>Loading your documents...</p>
        </div>
        <div className="loading-state">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="documents-page">
        <div className="page-header">
          <h1>Documents</h1>
          <p>Manage all your important documents in one place.</p>
        </div>
        <div className="error-state">
          <i className="fa-solid fa-exclamation-triangle"></i>
          <h3>Error Loading Documents</h3>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Button onClick={() => { setRetryCount(0); loadDocumentsData(); }}>Retry</Button>
            {retryCount >= 2 && <Button onClick={() => window.location.reload()}>Reload Page</Button>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="documents-page">
      {!isOnline && (
        <div className="offline-banner">
          <i className="fa-solid fa-wifi-slash"></i>
          <span>You are currently offline. Some features may not be available.</span>
        </div>
      )}
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p>Manage all your important documents in one place.</p>
        </div>
        <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
          <i className="fa-solid fa-upload"></i>
          <span>Upload Document</span>
        </Button>
      </div>

      <Card>
        <div className="table-header">
          <input type="text" className="form-input" placeholder="Search by document name..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="filter-nav">
          {[
            { key: 'all', label: 'All Agreements' },
            { key: 'Lease Agreement', label: 'Lease Agreements' },
            { key: 'Payment Receipt', label: 'Receipts' },
            { key: 'Tax Document', label: 'Tax Documents' },
            { key: 'Other', label: 'Others' },
          ].map(f => (
            <button key={f.key} className={`filter-btn ${category===f.key ? 'active' : ''}`} onClick={() => setCategory(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Linked To</th>
                <th>Size</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4">No Documents Found</td></tr>
              ) : filtered.map(doc => {
                const { icon, className } = getFileIcon(doc.type)
                return (
                  <tr key={doc.id}>
                    <td>
                      <div className="document-name-cell">
                        <i className={`${icon} ${className}`}></i>
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td>{doc.category}</td>
                    <td>{linkedTo(doc)}</td>
                    <td>{formatBytes(doc.size)}</td>
                    <td>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="action-dropdown">
                        <button
                          className="action-dropdown-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionId(openActionId === doc.id ? null : doc.id);
                          }}
                        >
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        {openActionId === doc.id && (
                          <div className="dropdown-menu align-right show">
                            <a key="view" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleViewDocument(doc); }}>
                              <i className="fa-solid fa-eye"></i>View Details
                            </a>
                            <a key="edit" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); navigate(`/documents/${doc.id}/edit`); }}>
                              <i className="fa-solid fa-pencil"></i>Edit
                            </a>
                            <a key="download" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleDownloadDocument(doc); }}>
                              <i className="fa-solid fa-download"></i>Download
                            </a>
                            <a key="delete" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleDeleteDocument(doc); }}>
                              <i className="fa-solid fa-trash-can"></i>Delete
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

      {filtered.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-folder-open"></i>
          <h3>No Documents Found</h3>
          <p>Get started by uploading a new document.</p>
        </div>
      )}

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentUploaded={handleDocumentUploaded}
      />


    </div>
  )
}
