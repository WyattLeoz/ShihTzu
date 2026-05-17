import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateIncident } from '../../api/incidents';
import { INCIDENT_TYPES, SEVERITY_LEVELS } from '../../lib/constants';
import { Button } from '../../components/Button';
import { ArrowLeft } from 'lucide-react';
import { IncidentType } from '../../types';

const schema = z.object({
  type: z.enum(['medical', 'flood', 'fire', 'road', 'infrastructure', 'civil', 'other']),
  title: z.string().min(10).max(120),
  severity: z.enum(['1', '2', '3']),
  locationText: z.string().min(1),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  description: z.string().min(20),
});

type FormData = z.infer<typeof schema>;

export function NewIncidentForm() {
  const navigate = useNavigate();
  const { mutate: createIncident, isPending } = useCreateIncident();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'medical',
      severity: '2',
    },
  });

  const onSubmit = (data: FormData) => {
    createIncident(
      {
        ...data,
        severity: parseInt(data.severity) as any,
      },
      {
        onSuccess: (response) => {
          navigate(`/responder/ticket/${response.ticketNumber}`);
        },
      }
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/responder')}
          className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to Queue
        </button>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-ink mb-6">New Incident</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Incident Type</label>
            <div className="flex gap-2">
              {INCIDENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => document.getElementById(`type-${type.value}`)?.click()}
                  className={`
                    flex-1 p-4 rounded-sm border-2 text-center transition-all
                    ${watch('type') === type.value
                      ? 'border-navy bg-navy-light'
                      : 'border-paper-border hover:border-navy-border'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{type.emoji}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                </button>
              ))}
            </div>
            <input
              {...register('type')}
              id={`type-${watch('type')}`}
              type="radio"
              className="hidden"
            />
            {errors.type && (
              <p className="mt-1 text-xs text-red">{errors.type.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Title</label>
            <input
              {...register('title')}
              type="text"
              placeholder="Brief incident description"
              className="w-full px-4 py-2 border border-paper-border rounded-sm
                text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-navy
              "
            />
            <div className="flex justify-between mt-1">
              {errors.title && (
                <p className="text-xs text-red">{errors.title.message}</p>
              )}
              <p className="text-xs text-ink-muted ml-auto">
                {watch('title')?.length || 0} / 120
              </p>
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Severity</label>
            <div className="grid grid-cols-3 gap-3">
              {SEVERITY_LEVELS.map((level) => (
                <label key={level.value} className="cursor-pointer">
                  <input
                    {...register('severity')}
                    type="radio"
                    value={level.value}
                    className="hidden peer"
                  />
                  <div
                    className={`
                      p-4 rounded-sm border-2 transition-all
                      peer-checked:border-navy peer-checked:bg-navy-light
                      border-paper-border hover:border-navy-border
                    `}
                  >
                    <div className={`text-xs font-mono font-semibold mb-1 ${level.color} text-white`}>
                      {level.label}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {level.value === 1 ? 'Life-threatening, immediate action' :
                       level.value === 2 ? 'Serious, requires response' :
                       'Moderate, routine response'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Location</label>
            <input
              {...register('locationText')}
              type="text"
              placeholder="e.g. 123 Orchard Road, Singapore"
              className="w-full px-4 py-2 border border-paper-border rounded-sm
                text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-navy
              "
            />
            {errors.locationText && (
              <p className="mt-1 text-xs text-red">{errors.locationText.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Detailed description of the incident..."
              className="w-full px-4 py-2 border border-paper-border rounded-sm
                text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-navy resize-none
              "
            />
            <div className="flex justify-between mt-1">
              {errors.description && (
                <p className="text-xs text-red">{errors.description.message}</p>
              )}
              <p className="text-xs text-ink-muted ml-auto">
                {watch('description')?.length || 0} / min 20
              </p>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" isLoading={isPending} className="w-full">
            Submit Incident
          </Button>
        </form>
      </div>
    </div>
  );
}