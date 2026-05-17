import { useState } from 'react';
import { UserPlus, Phone, Mail, MapPin, CheckCircle, X, Shield } from 'lucide-react';

const AVAILABLE_SKILLS = [
  'First Aid', 'CPR', 'Medical', 'Search & Rescue', 'Fire Safety',
  'Communication', 'Logistics', 'Language Translation', 'Driving',
  'Heavy Equipment', 'Psychological Support', 'Technical Support'
];

type VolunteerFormData = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  skills: string[];
  availability: 'full-time' | 'part-time' | 'emergency-only';
  emergencyContact: string;
  emergencyPhone: string;
  experience: string;
};

export function VolunteerRegistration({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<VolunteerFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    skills: [],
    availability: 'emergency-only',
    emergencyContact: '',
    emergencyPhone: '',
    experience: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call - in real app, this would call the actual API
    setTimeout(() => {
      setSubmitSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }, 1000);
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-sm p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-teal" />
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">Registration Submitted!</h3>
          <p className="text-sm text-ink-muted mb-4">
            Thank you for volunteering! Your application will be reviewed and you'll be contacted shortly.
          </p>
          <p className="text-xs text-ink-muted">
            Please keep your contact information updated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="h-14 bg-navy flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-white" />
            <h2 className="text-white font-semibold">Volunteer Registration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <Shield size={16} className="text-navy" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal pl-10"
                  />
                  <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Your phone number"
                    className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal pl-10"
                  />
                  <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Address *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Your address"
                    className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal pl-10"
                  />
                  <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted" />
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-sm font-semibold text-ink mb-3">
              Skills & Qualifications *
            </h3>
            <p className="text-xs text-ink-muted mb-3">Select all skills that apply to you:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AVAILABLE_SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-2 text-sm rounded-sm border transition-all ${
                    formData.skills.includes(skill)
                      ? 'bg-teal text-white border-teal'
                      : 'bg-white text-ink border-paper-border hover:border-teal'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            {formData.skills.length === 0 && (
              <p className="text-xs text-red mt-2">Please select at least one skill</p>
            )}
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-sm font-semibold text-ink mb-3">
              Availability
            </h3>
            <div className="space-y-2">
              {[
                { value: 'emergency-only', label: 'Emergency Only', desc: 'Available during major emergencies only' },
                { value: 'part-time', label: 'Part-Time', desc: 'Available on weekends and evenings' },
                { value: 'full-time', label: 'Full-Time', desc: 'Available for regular shifts' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition-all ${
                    formData.availability === option.value
                      ? 'border-teal bg-teal-light'
                      : 'border-paper-border hover:border-teal'
                  }`}
                >
                  <input
                    type="radio"
                    name="availability"
                    value={option.value}
                    checked={formData.availability === option.value}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-ink">{option.label}</div>
                    <div className="text-xs text-ink-muted">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Emergency contact name"
                  className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="Emergency contact phone"
                  className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Relevant Experience
            </label>
            <textarea
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="Describe any relevant experience, training, or certifications..."
              rows={3}
              className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || formData.skills.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal text-white font-medium rounded-sm hover:bg-teal-dark transition-colors disabled:bg-teal-light disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Shield size={16} />
                Submit Application
              </>
            )}
          </button>

          {/* Disclaimer */}
          <div className="bg-amber-light border border-amber rounded-sm p-3">
            <p className="text-xs text-amber-dark">
              <strong>Important:</strong> By submitting this application, you agree to be contacted during emergencies and to follow all safety protocols. False information may result in disqualification from the volunteer program.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}