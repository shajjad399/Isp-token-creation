import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, logout, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/profile', formData);
      toast.success('Profile updated successfully!');
      // Refresh user data
      const response = await api.get('/auth/profile');
      if (response.data?.success) {
        const userData = response.data.data;
        localStorage.setItem('user', JSON.stringify(userData));
        login(userData.email, userData.password); // Re-login to update context
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      const response = await api.post('/users/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Profile photo updated!');
      setFormData(prev => ({ ...prev, avatar: response.data.data.avatar }));
      
      // Refresh user data
      const userResponse = await api.get('/auth/profile');
      if (userResponse.data?.success) {
        const userData = userResponse.data.data;
        localStorage.setItem('user', JSON.stringify(userData));
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      return;
    }

    try {
      await api.delete('/users/account');
      toast.success('Account deleted successfully');
      logout();
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account settings</p>
      </div>

      <Card>
        <CardBody>
          {/* Profile Photo */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar 
                name={user?.name} 
                src={formData.avatar || user?.avatar} 
                size="2xl" 
                className="border-4 border-blue-500"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="Change Profile Photo"
              >
                <CameraIcon className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            {uploading && (
              <p className="text-sm text-blue-600 mt-2">Uploading...</p>
            )}
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Role: {user?.role}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email"
              type="email"
              value={user?.email}
              disabled
            />

            <Input
              label="Phone Number"
              name="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                rows="3"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
              <Button type="submit" variant="primary" loading={loading}>
                Update Profile
              </Button>
              <Button type="button" variant="secondary" onClick={logout}>
                Logout
              </Button>
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDeleteAccount}
                className="ml-auto"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete Account
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default Profile;