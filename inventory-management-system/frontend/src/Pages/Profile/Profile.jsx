import { useState } from 'react';
import './Profile.css';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('General');

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar card">
          <div className="profile-sidebar-header">
            <div className="profile-avatar-large">
              AB
              <div className="profile-status-indicator" />
            </div>
            <h2 className="profile-name-large">Alex Bennett</h2>
            <p className="profile-role-large">Inventory Manager</p>
          </div>
          <nav className="profile-nav">
            {['General', 'Security', 'Notifications', 'Preferences'].map(tab => (
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
            <p className="text-secondary">Update your {activeTab.toLowerCase()} information</p>
          </div>

          <form className="standard-form profile-form" onSubmit={(e) => e.preventDefault()}>
            {activeTab === 'General' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" defaultValue="Alex" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" defaultValue="Bennett" required />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" defaultValue="alex.bennett@novastock.com" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input type="tel" id="phone" defaultValue="+1 (555) 123-4567" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea id="bio" rows="3" defaultValue="Lead inventory manager for the West Coast distribution center." />
                </div>
              </>
            )}

            {activeTab === 'Security' && (
              <>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input type="password" id="currentPassword" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input type="password" id="newPassword" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" />
                  </div>
                </div>
                <div className="security-alert alert-warning" style={{marginTop: '10px'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
                  <span>Two-factor authentication is currently disabled. We recommend enabling it.</span>
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
