import React, { useState, useEffect } from 'react';
import { X, Bike, RefreshCw } from 'lucide-react';
import { Order, TrackingData } from '../types';

interface LiveTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const LiveTelemetryModal: React.FC<LiveTelemetryModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  if (!isOpen || !order) return null;

  const [tracking, setTracking] = useState<TrackingData | null>(null);

  const fetchTracking = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/orders/${order.id}/tracking`);
      const data = await res.json();
      if (data.tracking) {
        setTracking(data.tracking);
      }
    } catch {
      // Mock tracking fallback
      setTracking({
        order_id: order.id,
        order_code: order.orderCode,
        state: order.state,
        eta_minutes: 9,
        eta_display: '9 mins',
        distance_km: 1.2,
        is_stale: false,
        stale_warning: null,
        traffic_status: 'Moderate Gorakhpur Traffic',
        pharmacy_location: { latitude: 26.7598, longitude: 83.3725, name: 'Shop 14, Cinema Road, Golghar' },
        customer_location: { latitude: 26.7606, longitude: 83.3732, address: 'Medical College Road, Gorakhpur' },
        rider: {
          id: 'rider-1',
          name: 'Vikas Pandey',
          phone: '+919876543210',
          vehicle: 'Hero Electric Splendor (UP-53-EF-1290)',
          current_cash_in_hand: 485
        },
        rider_location: {
          latitude: 26.7601,
          longitude: 83.3728,
          speedKmh: 24,
          heading: 42,
          recordedAt: new Date().toISOString()
        }
      });
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 4000);
    return () => clearInterval(interval);
  }, [order.id]);

  const simulateGpsPing = async () => {
    try {
      await fetch(`http://localhost:4000/api/v1/rider/location-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: 'rider-1',
          latitude: 26.7602 + (Math.random() - 0.5) * 0.001,
          longitude: 83.3729 + (Math.random() - 0.5) * 0.001,
          speedKmh: 28,
          heading: 45
        })
      });
      fetchTracking();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-2xl text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">Live Gorakhpur Order Telemetry</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                  {order.orderCode}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Status: {order.state} • Delivery OTP: {order.deliveryOtp}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* ETA & Distance Card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#202024] border border-[#2c2c32] rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Dynamic ETA</span>
              <span className="text-2xl font-black text-emerald-400">
                {tracking?.eta_minutes || 9} mins
              </span>
            </div>
            <div className="bg-[#202024] border border-[#2c2c32] rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Distance Left</span>
              <span className="text-2xl font-black text-white">
                {tracking?.distance_km?.toFixed(1) || '1.2'} km
              </span>
            </div>
            <div className="bg-[#202024] border border-[#2c2c32] rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Rider Speed</span>
              <span className="text-2xl font-black text-amber-400">
                {tracking?.rider_location?.speedKmh?.toFixed(0) || '24'} km/h
              </span>
            </div>
          </div>

          {/* Gorakhpur Vector SVG Map */}
          <div className="relative bg-[#0d1117] rounded-2xl border border-zinc-800 p-4 h-64 overflow-hidden flex items-center justify-center">
            {/* Grid Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#38BDF8" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Road Path SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 240">
              {/* Golghar to Medical Road Curve */}
              <path
                d="M 80 180 Q 250 80 500 60"
                fill="none"
                stroke="#334155"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 80 180 Q 250 80 500 60"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />

              {/* Golghar Pharmacy Node */}
              <circle cx="80" cy="180" r="14" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
              <text x="50" y="210" fill="#38BDF8" fontSize="11" fontWeight="bold">Golghar Pharmacy</text>

              {/* Destination Medical Road Node */}
              <circle cx="500" cy="60" r="14" fill="#0F172A" stroke="#EF4444" strokeWidth="3" />
              <text x="440" y="90" fill="#F87171" fontSize="11" fontWeight="bold">Medical Road (Home)</text>

              {/* Rider Pulse & Motorcycle */}
              <g transform="translate(260, 115)">
                <circle cx="0" cy="0" r="22" fill="#10B981" opacity="0.3" className="rider-beacon-pulse" />
                <circle cx="0" cy="0" r="12" fill="#10B981" />
                <text x="-6" y="4" fill="#FFFFFF" fontSize="10">🏍️</text>
              </g>
            </svg>

            <div className="absolute bottom-3 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-zinc-800 text-[10px] text-zinc-300">
              Gorakhpur Dispatch Corridor: Golghar → Medical College Road
            </div>
          </div>

          {/* Rider Profile & Controls */}
          <div className="bg-[#202024] border border-[#2c2c32] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                🛵
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {tracking?.rider?.name || 'Vikas Pandey (Rider 1)'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {tracking?.rider?.vehicle || 'Hero Splendor (UP-53-EF-1290)'}
                </span>
              </div>
            </div>

            <button
              onClick={simulateGpsPing}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Simulate GPS Ping</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
