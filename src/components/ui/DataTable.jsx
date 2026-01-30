import React, { useState, useMemo } from 'react';
import './DataTable.css';

const DataTable = ({
  data,
  columns,
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onAction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const dataArray = Array.isArray(data) ? data : [];

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return dataArray;
    return dataArray.filter(item =>
      columns.some(column =>
        String(item[column.key]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [dataArray, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const sortedDataArray = Array.isArray(sortedData) ? sortedData : [];
    if (!pagination) return sortedDataArray;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedDataArray.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAction = (action, item) => {
    if (onAction) onAction(action, item);
  };

  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item[column.key], item);
    }
    return item[column.key];
  };

  return (
    <div className="data-table-container">
      {searchable && (
        <div className="data-table-search">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {dataArray.length === 0 ? (
        <div className="no-data-message">No data available</div>
      ) : (
        <>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th
                      key={column.key}
                      className={sortable && column.sortable !== false ? 'sortable' : ''}
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label}
                      {sortConfig.key === column.key && (
                        <span className="sort-indicator">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={item._id || index}>
                    {columns.map(column => (
                      <td key={column.key}>
                        {column.key === 'actions' ? (
                          <div>
                            {column.actions?.map(action => (
                              <button
                                key={action.key}
                                className="action-btn"
                                onClick={() => handleAction(action.key, item)}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          renderCell(item, column)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && totalPages > 1 && (
            <div className="data-table-pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataTable;
