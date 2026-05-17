import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, User } from 'lucide-react';
import { BackButton, Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Slider } from '../../components/Slider';
import { Switch } from '../../components/Switch';
import { SuccessState } from '../../components/LoadingSpinner';
import mockVolunteers from '../../data/mockVolunteers';

const skillOptions = [
  { id: 'first-aid', label: 'First Aid', emoji: '🩺' },
  { id: 'logistics', label: 'Logistics', emoji: '📦' },
  { id: 'translation', label: 'Translation', emoji: '🌐' },
  { id: 'mental-health', label: 'Mental Health', emoji: '💬' },
  { id: 'search-rescue', label: 'Search & Rescue', emoji: '🔦' },
  { id: 'tech-support', label: 'Tech Support', emoji: '💻' },
];

const availabilityOptions = [
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'on-call', label: 'On-call' },
];

export default function VolunteerSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skills: [],
    availability: { weekdays: false, weekends: false, 'on-call': false },
    radius: 2,
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSkillToggle = (skillId) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId]
    }));
  };

  const handleAvailabilityToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability[day]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Add to mock volunteers
    const newVolunteer = {
      id: `VOL-${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      skills: formData.skills.map(skillId =>
        skillOptions.find(s => s.id === skillId)?.label || skillId
      ),
      available: true,
      radius: formData.radius,
      location: 'Singapore', // Would normally get from geolocation
    };

    mockVolunteers.push(newVolunteer);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleAnotherSignup = () => {
    setFormData({
      name: '',
      phone: '',
      skills: [],
      availability: { weekdays: false, weekends: false, 'on-call': false },
      radius: 2,
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-4">
        <SuccessState
          title="Thank you for signing up!"
          message="You're now part of our volunteer network. We'll contact you when your skills are needed in your area."
          action={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate('/public/home')}>
                Back to home
              </Button>
              <Button onClick={handleAnotherSignup}>
                Register another
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
          <h1 className="text-lg font-semibold text-text-primary">Join as a volunteer</h1>
        </div>
      </div>

      {/* Subtitle */}
      <div className="px-4 py-4">
        <p className="text-text-muted text-sm">
          Help your community when it matters most
        </p>
      </div>

      {/* Form */}
      <div className="px-4 pb-8">
        <form onSubmit={handleSubmit} className="bg-[#F8F7F4] rounded-card p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Your name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Phone number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                placeholder="+65 XXXX XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Your skills (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => handleSkillToggle(skill.id)}
                  className={`
                    px-4 py-2 rounded-pill text-sm font-medium transition-all duration-200
                    ${formData.skills.includes(skill.id)
                      ? 'bg-primary text-white'
                      : 'bg-white text-text-primary border border-border hover:bg-gray-50'
                    }
                  `}
                >
                  {skill.emoji} {skill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Availability
            </label>
            <div className="space-y-3">
              {availabilityOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{option.label}</span>
                  <Switch
                    checked={formData.availability[option.id]}
                    onChange={() => handleAvailabilityToggle(option.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Response radius */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-text-primary">
                Response radius
              </label>
              <span className="text-sm font-semibold text-primary">{formData.radius}km</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
              className="accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>1km</span>
              <span>10km</span>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={!formData.name || !formData.phone || formData.skills.length === 0 || isSubmitting}
            className="w-full py-3 rounded-pill"
            loading={isSubmitting}
          >
            {isSubmitting ? 'Signing up...' : 'Sign up as volunteer'}
          </Button>
        </form>

        <div className="text-center mt-4">
          <Link to="/public/home" className="text-primary text-sm hover:underline">
            Already registered? Update profile
          </Link>
        </div>
      </div>
    </div>
  );
}