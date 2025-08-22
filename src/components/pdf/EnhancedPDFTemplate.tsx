import React from 'react';

interface PDFTemplateProps {
  documentType: 'quote' | 'invoice' | 'job_report' | 'maintenance';
  data: any;
  companySettings?: any;
}

export const EnhancedPDFTemplate: React.FC<PDFTemplateProps> = ({
  documentType,
  data,
  companySettings
}) => {
  const getDocumentTitle = () => {
    switch (documentType) {
      case 'quote': return 'QUOTE';
      case 'invoice': return 'INVOICE';
      case 'job_report': return 'JOB REPORT';
      case 'maintenance': return 'MAINTENANCE REPORT';
      default: return 'DOCUMENT';
    }
  };

  const getDocumentNumber = () => {
    switch (documentType) {
      case 'quote': return data.quote_number;
      case 'invoice': return data.invoice_number;
      case 'job_report': return data.job_number;
      case 'maintenance': return data.report_number;
      default: return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-700 border-gray-300',
      'sent': 'bg-blue-100 text-blue-700 border-blue-300',
      'accepted': 'bg-green-100 text-green-700 border-green-300',
      'rejected': 'bg-red-100 text-red-700 border-red-300',
      'paid': 'bg-green-100 text-green-700 border-green-300',
      'unpaid': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'overdue': 'bg-red-100 text-red-700 border-red-300',
      'completed': 'bg-green-100 text-green-700 border-green-300',
      'in_progress': 'bg-blue-100 text-blue-700 border-blue-300',
      'assigned': 'bg-blue-100 text-blue-700 border-blue-300'
    };
    
    return statusStyles[status.toLowerCase()] || statusStyles['pending'];
  };

  return (
    <div className="pdf-template bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .pdf-template {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #1f2937;
          line-height: 1.5;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid;
          border-image: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%)) 1;
        }
        
        .company-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .company-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }
        
        .company-details h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .company-details p {
          margin: 4px 0;
          font-size: 14px;
          color: #6b7280;
        }
        
        .document-banner {
          text-align: right;
        }
        
        .document-title {
          background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          display: inline-block;
        }
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          border: 1px solid;
        }
        
        .info-bar {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px 0;
          margin-bottom: 32px;
        }
        
        .info-bar-content {
          display: flex;
          justify-content: space-around;
          text-align: center;
        }
        
        .info-item strong {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .info-item span {
          font-size: 14px;
          color: #6b7280;
        }
        
        .document-info {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .info-card {
          flex: 1;
          background: #f9fafb;
          padding: 24px;
          border-radius: 12px;
          border-left: 4px solid hsl(214, 83%, 56%);
        }
        
        .info-card h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .customer-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0;
          font-size: 14px;
          color: #4b5563;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        
        .footer-brand {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        @media print {
          .pdf-template { padding: 20px; }
        }
      `}</style>

      {/* Header Section */}
      <div className="header-section">
        <div className="company-info">
          {companySettings?.company_logo && (
            <img src={companySettings.company_logo} alt="Company Logo" className="company-logo" />
          )}
          <div className="company-details">
            <h1>{companySettings?.company_name || 'PortaPro'}</h1>
            <p>Professional Portable Toilet Rental Services</p>
            {companySettings?.company_email && <p>📧 {companySettings.company_email}</p>}
            {companySettings?.company_phone && <p>📞 {companySettings.company_phone}</p>}
          </div>
        </div>
        <div className="document-banner">
          <div className="document-title">{getDocumentTitle()} {getDocumentNumber()}</div>
          <div className={`status-badge ${getStatusBadge(data.status || 'pending')}`}>
            {data.status?.replace('_', ' ') || 'Pending'}
          </div>
        </div>
      </div>

      {/* Document Info Bar */}
      <div className="info-bar">
        <div className="info-bar-content">
          <div className="info-item">
            <strong>{getDocumentNumber()}</strong>
            <span>{getDocumentTitle()} Number</span>
          </div>
          <div className="info-item">
            <strong>{new Date(data.created_at || Date.now()).toLocaleDateString()}</strong>
            <span>Date Issued</span>
          </div>
          {data.expiration_date && (
            <div className="info-item">
              <strong>{new Date(data.expiration_date).toLocaleDateString()}</strong>
              <span>Expires</span>
            </div>
          )}
          {data.due_date && (
            <div className="info-item">
              <strong>{new Date(data.due_date).toLocaleDateString()}</strong>
              <span>Due Date</span>
            </div>
          )}
        </div>
      </div>

      {/* Customer Information */}
      {data.customers && (
        <div className="document-info">
          <div className="info-card">
            <h3>📋 {documentType === 'quote' || documentType === 'invoice' ? 'Bill To' : 'Customer Information'}</h3>
            <div className="customer-name">{data.customers.name || 'N/A'}</div>
            {data.customers.service_street && (
              <div className="contact-item">
                <span>📍</span>
                <span>
                  {data.customers.service_street}<br />
                  {data.customers.service_city}, {data.customers.service_state} {data.customers.service_zip}
                </span>
              </div>
            )}
            {data.customers.email && (
              <div className="contact-item">
                <span>✉️</span>
                <span>{data.customers.email}</span>
              </div>
            )}
            {data.customers.phone && (
              <div className="contact-item">
                <span>☎️</span>
                <span>{data.customers.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content will be passed as children */}
      <div className="document-content">
        {/* This will be populated by specific document types */}
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-brand">{companySettings?.company_name || 'PortaPro'} - Professional Portable Toilet Rental Services</div>
        <div>Thank you for choosing us for your sanitation needs!</div>
        {companySettings?.company_address && (
          <div style={{ marginTop: '8px' }}>{companySettings.company_address}</div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPDFTemplate;