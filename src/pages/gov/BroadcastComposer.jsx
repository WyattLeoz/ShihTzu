import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Radio, BarChart3, FileText, Send, Megaphone, Users, RadioTower, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { ToggleGroup, ToggleButton } from '../../components/Switch';
import { SuccessState } from '../../components/LoadingSpinner';

export default function BroadcastComposer() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [urgency, setUrgency] = useState('normal');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState([
    {
      id: 'BROADCAST-001',
      message: 'Heavy rainfall expected in western region. Stay away from low-lying areas.',
      audience: 'all',
      urgency: 'normal',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      status: 'sent',
      recipients: 1250000,
    },
    {
      id: 'BROADCAST-002',
      message: 'All responders: Additional medical resources requested at Tampines Mall incident.',
      audience: 'responders',
      urgency: 'urgent',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'sent',
      recipients: 850,
    },
  ]);

  const handleSendBroadcast = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newBroadcast = {
        id: `BROADCAST-${Date.now()}`,
        message,
        audience,
        urgency,
        timestamp: new Date().toISOString(),
        status: 'sent',
        recipients: audience === 'all' ? 1250000 : 850,
      };

      setBroadcastHistory([newBroadcast, ...broadcastHistory]);
      setSent(true);
    } catch (error) {
      alert('Failed to send broadcast. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleNewBroadcast = () => {
    setMessage('');
    setAudience('all');
    setUrgency('normal');
    setSent(false);
  };

  const getUrgencyColor = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'urgent': return 'text-[#E24B4A] bg-[#FCEBEB]';
      case 'high': return 'text-[#EF9F27] bg-[#FEF5E6]';
      default: return 'text-primary bg-[#E1F5EE]';
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top navigation bar */}
        <nav className="bg-[#042C53] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Shield className="w-6 h-6" />
            <h1 className="font-semibold text-lg">QuickAid Command</h1>
          </div>
        </nav>

        <div className="p-6">
          <SuccessState
            title="Broadcast sent successfully!"
            message={`Your alert has been sent to ${audience === 'all' ? '1,250,000' : '850'} recipients.`}
            action={
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => navigate('/gov/dashboard')}>
                  Back to dashboard
                </Button>
                <Button onClick={handleNewBroadcast}>
                  Send another broadcast
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <nav className="bg-[#042C53] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Shield className="w-6 h-6" />
          <h1 className="font-semibold text-lg">QuickAid Command</h1>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="px-6 py-4 border-b border-border">
        <Link to="/gov/dashboard" className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to dashboard</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Megaphone className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold text-text-primary">Compose broadcast</h1>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Broadcast composer */}
          <div className="col-span-2">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your broadcast message..."
                    rows={8}
                    className="w-full px-4 py-3 border border-border rounded-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-muted">
                      {message.length} characters
                    </span>
                    <span className="text-xs text-text-muted">
                      Recommended: Under 160 characters for SMS compatibility
                    </span>
                  </div>
                </div>

                {/* Audience */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    Target audience
                  </label>
                  <ToggleGroup value={audience} onChange={setAudience}>
                    <ToggleButton value="all">
                      <Users className="w-4 h-4 mr-2" />
                      All public
                    </ToggleButton>
                    <ToggleButton value="responders">
                      <RadioTower className="w-4 h-4 mr-2" />
                      Responders only
                    </ToggleButton>
                  </ToggleGroup>
                </div>

                {/* Urgency level */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    Urgency level
                  </label>
                  <div className="flex gap-2">
                    {['normal', 'high', 'urgent'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setUrgency(level)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${urgency === level
                            ? 'ring-2 ring-offset-2 ring-primary ' + getUrgencyColor(level)
                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                          }
                        `}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated reach */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted">Estimated reach</p>
                      <p className="text-2xl font-semibold text-text-primary mt-1">
                        {audience === 'all' ? '1,250,000' : '850'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-muted">Delivery time</p>
                      <p className="text-sm font-medium text-text-primary mt-1">
                        {urgency === 'urgent' ? '< 5 minutes' : '< 15 minutes'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Send button */}
                <Button
                  onClick={handleSendBroadcast}
                  disabled={!message.trim() || sending}
                  loading={sending}
                  variant="danger"
                  className="w-full py-3"
                  icon={Send}
                >
                  {sending ? 'Sending...' : 'Send broadcast'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Broadcast history */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent broadcasts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                  {broadcastHistory.slice(0, 5).map((broadcast) => (
                    <div key={broadcast.id} className="p-4 border-b border-border last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(broadcast.urgency)}`}>
                          {broadcast.urgency.toUpperCase()}
                        </div>
                        <span className="text-xs text-text-muted">
                          {new Date(broadcast.timestamp).toLocaleString('en-SG', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary mb-2 line-clamp-2">
                        {broadcast.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>
                          {broadcast.audience === 'all' ? 'Public' : 'Responders'}
                        </span>
                        <span>{broadcast.recipients.toLocaleString()} recipients</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}