import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService, authService } from '../services/api';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address Manager state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrDefault, setAddrDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      const data = await profileService.getProfile();
      setUser(data.user);
      setName(data.user.name || '');
      setPhone(data.user.phone || '');
      setAddresses(data.user.addresses || []);
    } catch (err) {
      setError('Please log in to view your profile.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      const data = await profileService.updateProfile({
        name: name.trim(),
        phone: phone.trim()
      });
      setUser(prev => ({ ...prev, name: data.user.name, phone: data.user.phone }));
      setSuccess('Profile details saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  function openNewAddressForm() {
    setEditingAddressId(null);
    setAddrStreet('');
    setAddrCity('');
    setAddrState('');
    setAddrZip('');
    setAddrLabel('Home');
    setAddrDefault(addresses.length === 0);
    setShowAddressForm(true);
  }

  function startEditAddress(addr) {
    setEditingAddressId(addr._id);
    setAddrStreet(addr.street);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrZip(addr.zipCode);
    setAddrLabel(addr.label || 'Home');
    setAddrDefault(addr.isDefault || false);
    setShowAddressForm(true);
  }

  async function handleSaveAddress(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!addrStreet.trim() || !addrCity.trim() || !addrState.trim() || !addrZip.trim()) {
      setError('Please fill in street, city, state, and postal code.');
      return;
    }

    setSavingAddress(true);
    try {
      const payload = {
        street: addrStreet.trim(),
        city: addrCity.trim(),
        state: addrState.trim(),
        zipCode: addrZip.trim(),
        label: addrLabel.trim(),
        isDefault: addrDefault
      };

      let res;
      if (editingAddressId) {
        res = await profileService.updateAddress(editingAddressId, payload);
        setSuccess('Delivery address updated successfully.');
      } else {
        res = await profileService.addAddress(payload);
        setSuccess('New delivery address added successfully.');
      }

      setAddresses(res.addresses);
      setShowAddressForm(false);
      setEditingAddressId(null);
    } catch (err) {
      setError(err.message || 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(id) {
    if (!window.confirm('Are you sure you want to delete this delivery address?')) return;
    setError('');
    try {
      const res = await profileService.deleteAddress(id);
      setAddresses(res.addresses);
      setSuccess('Address deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete address.');
    }
  }

  async function handleSetDefaultAddress(id) {
    setError('');
    try {
      const res = await profileService.setDefaultAddress(id);
      setAddresses(res.addresses);
      setSuccess('Default delivery address updated.');
    } catch (err) {
      setError(err.message || 'Failed to set default address.');
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header-banner">
          <div className="profile-avatar-large">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="profile-title-area">
            <h1>{user?.name}</h1>
            <p className="profile-role-badge">Role: {user?.role ? user.role.toUpperCase() : 'CUSTOMER'}</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-grid">
          {/* Column 1: Profile Information */}
          <section className="profile-card">
            <h2>Personal Information</h2>
            <p className="section-help-text">
              Keep your contact details up to date. (Email address is permanent and immutable).
            </p>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label htmlFor="prof-name">Full Name</label>
                <input
                  id="prof-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prof-email">Email Address (Immutable)</label>
                <input
                  id="prof-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="immutable-field"
                  title="Email cannot be modified per system security rules"
                />
                <span className="field-note">🔒 Email cannot be altered.</span>
              </div>

              <div className="form-group">
                <label htmlFor="prof-phone">Phone Number</label>
                <input
                  id="prof-phone"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={savingProfile}>
                {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </form>
          </section>

          {/* Column 2: Delivery Address Management */}
          <section className="profile-card">
            <div className="card-header-flex">
              <div>
                <h2>Delivery Addresses</h2>
                <p className="section-help-text">Manage your shipping and drop-off destinations.</p>
              </div>
              {!showAddressForm && (
                <button onClick={openNewAddressForm} className="fh-btn-primary add-addr-btn">
                  + Add Address
                </button>
              )}
            </div>

            {/* Address Edit/Add Form Modal or Box */}
            {showAddressForm && (
              <div className="address-form-box">
                <h3>{editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h3>
                <form onSubmit={handleSaveAddress}>
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label htmlFor="addr-label">Address Tag</label>
                      <select
                        id="addr-label"
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Farm / Stall">Farm / Stall</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group flex-2">
                      <label htmlFor="addr-street">Street Address *</label>
                      <input
                        id="addr-street"
                        type="text"
                        placeholder="House no., Building, Street"
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label htmlFor="addr-city">City / Town *</label>
                      <input
                        id="addr-city"
                        type="text"
                        placeholder="e.g. Erode"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label htmlFor="addr-state">State *</label>
                      <input
                        id="addr-state"
                        type="text"
                        placeholder="e.g. Tamil Nadu"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label htmlFor="addr-zip">Postal Code *</label>
                      <input
                        id="addr-zip"
                        type="text"
                        placeholder="e.g. 638060"
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={addrDefault}
                        onChange={(e) => setAddrDefault(e.target.checked)}
                      />
                      Set as primary default delivery address
                    </label>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={savingAddress}>
                      {savingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="fh-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Address List */}
            <div className="address-list">
              {addresses.length === 0 ? (
                <div className="no-address-state">
                  <span className="no-address-icon">📍</span>
                  <p>No delivery addresses saved yet.</p>
                  <button onClick={openNewAddressForm} className="link-button">
                    Add your first delivery address
                  </button>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr._id} className={`address-card ${addr.isDefault ? 'default-card' : ''}`}>
                    <div className="address-card-header">
                      <div className="address-label-badge">
                        <span>{addr.label || 'Address'}</span>
                        {addr.isDefault && <span className="default-pill">Default</span>}
                      </div>

                      <div className="address-actions">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr._id)}
                            className="action-btn text-green"
                            title="Set as Default Address"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => startEditAddress(addr)}
                          className="action-btn"
                          title="Edit this address"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="action-btn text-red"
                          title="Delete this address"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="address-card-body">
                      <p className="address-street">{addr.street}</p>
                      <p className="address-city-state">
                        {addr.city}, {addr.state} - {addr.zipCode}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Profile;
