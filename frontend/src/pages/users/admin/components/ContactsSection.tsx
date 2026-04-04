import React, { useState, useEffect } from 'react';
import type { ContactInfo } from '../../../../schemas/contact-schema';
import { DEFAULT_CONTACT_INFO } from '../../../../schemas/contact-schema';
import { ContactApi } from '../../../../services/ContactApi';
import { Building2, Phone, Mail, Clock, AlertTriangle, LayoutTemplate } from 'lucide-react';
import PageLoader from "../../../../components/shared/PageLoader";

export const ContactsSection: React.FC = () => {
  const [formData, setFormData] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      const data = await ContactApi.getContacts();
      // Deep merge with defaults so new 'hero' field always has a value
      setFormData({
        ...DEFAULT_CONTACT_INFO,
        ...data,
        hero: {
          ...DEFAULT_CONTACT_INFO.hero,
          ...(data?.hero || {}),
        },
      });
    } catch (error) {
      console.error('Failed to fetch contact data:', error);
      setMessage({ text: 'Failed to load contact information.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section: keyof ContactInfo, field: string, value: string) => {
    if (!formData) return;
    setFormData((prev: ContactInfo | null) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    setMessage(null);
    try {
      await ContactApi.updateContacts(formData);
      setMessage({ text: 'Contact information updated successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Failed to update contact data:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to update contact information. Please check your inputs.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader text="Loading contact information..." className="min-h-[400px]" />;
  }

  if (!formData) {
    return <div className="p-6 text-center text-red-500">Failed to load contact data. Please try again later.</div>;
  }

  return (
    <div className='p-4 sm:p-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6'>
        <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>
          Contact Information
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className='bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm sm:text-base font-medium'
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 mb-6'>
        {/* Hero Section */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <LayoutTemplate className="w-5 h-5 text-gray-500" /> Page Hero Section
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Badge Text</label>
              <input
                type='text'
                value={formData.hero.badge}
                onChange={(e) => handleChange('hero', 'badge', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                placeholder='e.g., Connect With Us'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Page Title</label>
              <input
                type='text'
                value={formData.hero.title}
                onChange={(e) => handleChange('hero', 'title', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                placeholder='e.g., Research Support Center'
              />
            </div>
            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
              <textarea
                rows={3}
                value={formData.hero.description}
                onChange={(e) => handleChange('hero', 'description', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none'
                placeholder='Short description displayed below the title...'
              />
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Office Location */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Building2 className="w-5 h-5 text-gray-500" /> Office Location
          </h3>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Office Name</label>
              <input type='text' value={formData.location.officeName} onChange={(e) => handleChange('location', 'officeName', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>University</label>
              <input type='text' value={formData.location.university} onChange={(e) => handleChange('location', 'university', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
              <input type='text' value={formData.location.address} onChange={(e) => handleChange('location', 'address', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Additional Details</label>
              <input type='text' value={formData.location.details} onChange={(e) => handleChange('location', 'details', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' placeholder='e.g., 2nd Floor, Main Building' />
            </div>
          </div>
        </div>

        {/* Phone Numbers */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Phone className="w-5 h-5 text-gray-500" /> Phone Numbers
          </h3>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Main Office Line</label>
              <input type='text' value={formData.phones.main} onChange={(e) => handleChange('phones', 'main', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Research Help Desk</label>
              <input type='text' value={formData.phones.researchDesk} onChange={(e) => handleChange('phones', 'researchDesk', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Proposal Hotline</label>
              <input type='text' value={formData.phones.proposalHotline} onChange={(e) => handleChange('phones', 'proposalHotline', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
          </div>
        </div>

        {/* Email Addresses */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Mail className="w-5 h-5 text-gray-500" /> Email Addresses
          </h3>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>General Research Inquiries</label>
              <input type='email' value={formData.emails.research} onChange={(e) => handleChange('emails', 'research', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Proposal Submissions</label>
              <input type='email' value={formData.emails.proposals} onChange={(e) => handleChange('emails', 'proposals', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Technical Support</label>
              <input type='email' value={formData.emails.support} onChange={(e) => handleChange('emails', 'support', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
          </div>
        </div>

        {/* Office Hours */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Clock className="w-5 h-5 text-gray-500" /> Office Hours
          </h3>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Weekdays (Mon-Fri)</label>
              <input type='text' value={formData.officeHours.weekdays} onChange={(e) => handleChange('officeHours', 'weekdays', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' placeholder='e.g., 8:00 AM - 5:00 PM' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Saturday</label>
              <input type='text' value={formData.officeHours.saturday} onChange={(e) => handleChange('officeHours', 'saturday', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' placeholder='e.g., 8:00 AM - 12:00 PM' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Sunday</label>
              <input type='text' value={formData.officeHours.sunday} onChange={(e) => handleChange('officeHours', 'sunday', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' placeholder='e.g., Closed' />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className='bg-gray-50 p-5 rounded-lg border border-gray-200 lg:col-span-2'>
          <h3 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <AlertTriangle className="w-5 h-5 text-red-500" /> Emergency / Urgent Research Line
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Emergency Phone Line</label>
              <input type='text' value={formData.emergency.line} onChange={(e) => handleChange('emergency', 'line', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Availability Note</label>
              <input type='text' value={formData.emergency.availability} onChange={(e) => handleChange('emergency', 'availability', e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500' placeholder='e.g., 24/7 during submission periods' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
