
const NOTIFICATIONS = [
  { id: 1, title: 'Low Stock Alert', desc: 'Halo Smart Charger is down to 9 units.', time: '2 hours ago', type: 'warning', read: false },
  { id: 2, title: 'New Order Received', desc: 'Order #NV-10234 for $1,240.00 is ready for processing.', time: '5 hours ago', type: 'info', read: false },
  { id: 3, title: 'Edit Request Approved', desc: 'Price change for Wireless Mouse approved by admin.', time: 'Yesterday', type: 'success', read: true },
  { id: 4, title: 'Supplier Shipment Delayed', desc: 'Orion Textiles shipment #3911 is delayed by 2 days.', time: 'Yesterday', type: 'danger', read: true },
  { id: 5, title: 'Weekly Report Ready', desc: 'Your weekly inventory valuation report has been generated.', time: 'Oct 24', type: 'info', read: true },
];

export default function Notifications() {
  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div className="page-header-left">
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated on inventory alerts and system events</p>
        </div>
        <button className="btn btn-secondary">Mark All as Read</button>
      </div>

      <div className="card">
        <div className="panel-header" style={{borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px'}}>
          <div className="tabs">
            <button className="tab-btn is-active">All</button>
            <button className="tab-btn">Unread (2)</button>
            <button className="tab-btn">Archived</button>
          </div>
        </div>

        <ul className="notification-list" style={{listStyle: 'none', padding: 0, margin: 0}}>
          {NOTIFICATIONS.map((notif) => (
            <li key={notif.id} style={{
              display: 'flex', gap: '16px', padding: '20px 24px', 
              borderBottom: '1px solid var(--border-subtle)',
              background: notif.read ? 'transparent' : 'var(--bg-hover)'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `var(--${notif.type}-50)`, color: `var(--${notif.type}-600)`
              }}>
                {notif.type === 'warning' && <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>}
                {notif.type === 'info' && <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>}
                {notif.type === 'success' && <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"/></svg>}
                {notif.type === 'danger' && <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
              </div>
              <div style={{flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                  <h4 style={{fontSize: '14px', fontWeight: notif.read ? '500' : '700', color: 'var(--text-primary)'}}>{notif.title}</h4>
                  <span style={{fontSize: '12px', color: 'var(--text-tertiary)'}}>{notif.time}</span>
                </div>
                <p style={{fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '12px'}}>{notif.desc}</p>
                {!notif.read && (
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button className="btn btn-sm btn-secondary">Acknowledge</button>
                    {notif.type === 'warning' && <button className="btn btn-sm btn-outline">View Item</button>}
                    {notif.type === 'info' && <button className="btn btn-sm btn-outline">View Order</button>}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
