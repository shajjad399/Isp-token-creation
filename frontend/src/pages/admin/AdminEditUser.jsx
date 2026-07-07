// frontend/src/pages/admin/AdminEditUser.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const AdminEditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer',
    phone: '',
    isActive: true
  });

  const roleOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'agent', label: 'Agent' },
    { value: 'admin', label: 'Admin' }
  ];

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setFetching(true);

      const response = await adminApi.get(`/users/${id}`);

      console.log('✅ User data:', response.data);

      if (response.data?.success) {
        const user = response.data.data;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'customer',
          phone: user.phone || '',
          isActive: user.isActive !== undefined ? user.isActive : true
        });
      }
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      toast.error(error.response?.data?.message || 'Failed to load user data');
      navigate('/admin/users');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminApi.put(`/users/${id}`, formData);

      console.log('✅ User updated:', response.data);
      toast.success('User updated successfully!');
      navigate('/admin/users');
    } catch (error) {
      console.error('❌ Update error:', error);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/admin/login');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin only.');
        navigate('/admin/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update user');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading user data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit User</h1>
            <p className="text-gray-500 dark:text-gray-400">Update user account information</p>
          </div>
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="card-premium p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
            />

            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              required
            />

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Account</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Inactive users cannot login</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="submit" variant="primary" fullWidth loading={loading}>
                <PencilIcon className="h-5 w-5 mr-2" />
                Update User
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEditUser;