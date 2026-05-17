import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Radio, BarChart3, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const portals = [
    {
      id: 'public',
      title: 'Public portal',
      description: 'Report incidents, get alerts, volunteer',
      icon: Shield,
      color: 'from-[#1D9E75] to-[#0F6E56]',
      hoverColor: 'hover:shadow-card-elevated',
      path: '/public/home',
      emoji: '🏥'
    },
    {
      id: 'responder',
      title: 'Responder portal',
      description: 'Manage tickets, dispatch resources',
      icon: Radio,
      color: 'from-[#EF9F27] to-[#BA7517]',
      hoverColor: 'hover:shadow-card-elevated',
      path: '/responder/queue',
      emoji: '📻'
    },
    {
      id: 'government',
      title: 'Government portal',
      description: 'Command dashboard, analytics, broadcasts',
      icon: BarChart3,
      color: 'from-[#042C53] to-[#185FA5]',
      hoverColor: 'hover:shadow-card-elevated',
      path: '/gov/dashboard',
      emoji: '📊'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-10 h-10 text-[#042C53]" />
          <h1 className="text-4xl font-semibold text-[#042C53]">QuickAid</h1>
        </div>
        <p className="text-lg text-text-muted">
          Fast response. Clear decisions. Every second counts.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 max-w-6xl">
        {portals.map((portal) => {
          const Icon = portal.icon;
          return (
            <Link
              key={portal.id}
              to={portal.path}
              className={`group bg-gradient-to-br ${portal.color} ${portal.hoverColor}
                w-[380px] h-[200px] rounded-[24px] p-6 flex flex-col justify-between
                transition-all duration-300 hover:scale-105 cursor-pointer`}
            >
              <div className="flex items-start justify-between">
                <span className="text-5xl">{portal.emoji}</span>
                <Icon className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-semibold mb-2">{portal.title}</h2>
                <p className="text-sm text-white/90 mb-4">{portal.description}</p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  Enter <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-text-muted">
          Singapore Crisis Command Platform © 2025
        </p>
      </div>
    </div>
  );
}