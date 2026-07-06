import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { validatePersonName, validateEmail, validatePassword } from '../../utils/validation';
import './UserProfile.css';

export default function UserProfile() {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState('General');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'Staff',
      });
    }
  }, [user]);

  const handleSave = (e) => {
    e.preventDefault();
    
    if (activeTab === 'General') {
      const nameError = validatePersonName(formData.name);
      if (nameError) {
        showToast(nameError, 'error');
        return;
      }
    } else if (activeTab === 'Security') {
      const currentPassword = e.target.elements.currentPassword?.value;
      const newPassword = e.target.elements.newPassword?.value;
      const confirmPassword = e.target.elements.confirmPassword?.value;

      if (!currentPassword) {
        showToast('Please enter your current password.', 'error');
        return;
      }

      if (newPassword) {
        const passError = validatePassword(newPassword);
        if (passError) {
          showToast(passError, 'error');
          return;
        }
        if (newPassword !== confirmPassword) {
          showToast('Passwords do not match.', 'error');
          return;
        }
      }
    }

    // Assuming backend endpoint for updating profile isn't fully built for users, just show toast
    showToast('Profile updated successfully (mock)', 'success');
  };

  if (!user) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <ToastContainer />
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
              {user.name ? user.name[0].toUpperCase() : 'U'}
              <div className="profile-status-indicator" />
            </div>
            <h2 className="profile-name-large">{user.name || 'User'}</h2>
            <p className="profile-role-large">{user.role}</p>
          </div>
          <nav className="profile-nav">
            {['General', 'Security', 'Notifications'].map(tab => (
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

          <form className="standard-form profile-form" onSubmit={handleSave}>
            {activeTab === 'General' && (
              <>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      disabled
                      title="Email cannot be changed"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <input
                      type="text"
                      id="role"
                      value={formData.role}
                      disabled
                    />
                  </div>
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
              </>
            )}

            {activeTab === 'Notifications' && (
              <div className="empty-state">
                <p>Notification preferences coming soon.</p>
              </div>
            )}

            {activeTab !== 'Notifications' && (
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}
