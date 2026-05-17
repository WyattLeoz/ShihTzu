import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ChevronLeft, Camera, Upload } from 'lucide-react';
import { BackButton } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { Card, CardContent } from '../../components/Card';
import { SuccessState } from '../../components/LoadingSpinner';

const incidentTypes = [
  { id: 'flood', label: 'Flood', emoji: '🌊' },
  { id: 'fire', label: 'Fire', emoji: '🔥' },
  { id: 'medical', label: 'Medical', emoji: '🚑' },
  { id: 'road', label: 'Road', emoji: '🚧' },
  { id: 'infrastructure', label: 'Infrastructure', emoji: '⚡' },
  { id: 'other', label: 'Other', emoji: '📋' },
];

export default function ReportIncident() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location: '',
    type: '',
    description: '',
    photo: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (typeId) => {
    setFormData(prev => ({ ...prev, type: typeId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create new incident (would normally send to backend)
    const newIncident = {
      id: `INC-${Date.now()}`,
      type: formData.type,
      title: `${incidentTypes.find(t => t.id === formData.type)?.label} - ${formData.location}`,
      location: formData.location,
      description: formData.description,
      severity: formData.type === 'medical' ? 3 : 2,
      status: 'open',
      reportedAt: new Date().toISOString(),
      aiScore: 0.75,
      category: incidentTypes.find(t => t.id === formData.type)?.label || 'Other',
    };

    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleNewReport = () => {
    setFormData({ location: '', type: '', description: '', photo: null });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-4">
        <SuccessState
          title="Report submitted!"
          message="Your incident has been reported and is being processed. Emergency responders have been notified."
          action={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate('/public/home')}>
                Back to home
              </Button>
              <Button onClick={handleNewReport}>
                Report another
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => navigate('/public/home')} />
          <h1 className="text-lg font-semibold text-text-primary">Report an incident</h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                placeholder="Enter location or address"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="pl-10 bg-[#F8F7F4] border-0"
                required
              />
            </div>
          </div>

          {/* Incident type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Incident type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {incidentTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeSelect(type.id)}
                  className={`
                    aspect-square rounded-card p-3 flex flex-col items-center justify-center gap-2
                    transition-all duration-200
                    ${formData.type === type.id
                      ? 'border-2 border-primary bg-[#E1F5EE]'
                      : 'bg-[#F8F7F4] hover:bg-gray-100 border-2 border-transparent'
                    }
                  `}
                >
                  <span className="text-3xl">{type.emoji}</span>
                  <span className="text-xs font-medium text-text-primary">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <Textarea
              placeholder="Describe what happened..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="bg-[#F8F7F4] border-0 resize-none"
              required
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Attach photo (optional)
            </label>
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-card cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <Camera className="w-8 h-8" />
                <span className="text-sm">Tap to upload photo</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
              />
            </label>
            {formData.photo && (
              <p className="mt-2 text-sm text-text-primary">
                Selected: {formData.photo.name}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!formData.type || !formData.location || isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-pill transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit report'}
          </button>
        </form>
      </div>
    </div>
  );
}