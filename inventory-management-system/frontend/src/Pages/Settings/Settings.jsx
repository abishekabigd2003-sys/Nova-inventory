import { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Company');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure system-wide preferences and integrations</p>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar card">
          <nav className="profile-nav" style={{padding: '16px 12px'}}>
            {['Company', 'Team Members', 'Warehouses', 'Billing', 'Integrations'].map(tab => (
              <button
                key={tab}
                className={`profile-nav-item ${activeTab === tab ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        <main className="profile-content card">
          <div className="profile-content-header">
            <h3>{activeTab} Settings</h3>
            <p className="text-secondary">Update your {activeTab.toLowerCase()} configuration</p>
          </div>

          <form className="standard-form profile-form" onSubmit={(e) => e.preventDefault()}>
            {activeTab === 'Company' && (
              <>
                <div className="form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <input type="text" id="companyName" defaultValue="NovaStock Logistics" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="taxId">Tax ID / VAT</label>
                    <input type="text" id="taxId" defaultValue="GB123456789" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="currency">Default Currency</label>
                    <select id="currency" defaultValue="USD">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Business Address</label>
                  <textarea id="address" rows="3" defaultValue="123 Innovation Drive, Tech Park, CA 94103" />
                </div>
              </>
            )}

            {activeTab === 'Team Members' && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <h3 className="empty-state-title">Manage your team</h3>
                <p className="empty-state-desc">Invite members to your workspace and manage their access permissions.</p>
                <button className="btn btn-primary" style={{marginTop: '16px'}}>Invite Member</button>
              </div>
            )}
            
            {activeTab === 'Warehouses' && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"/></svg>
                </div>
                <h3 className="empty-state-title">Warehouse Locations</h3>
                <p className="empty-state-desc">Set up multiple warehouses to track inventory across different physical locations.</p>
                <button className="btn btn-primary" style={{marginTop: '16px'}}>Add Warehouse</button>
              </div>
            )}

            {activeTab === 'Company' && (
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save Settings</button>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}
