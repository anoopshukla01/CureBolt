import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Navigation,
  DollarSign,
  Award
} from 'lucide-react';

export const RiderPortal: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [hasIncomingOrder, setHasIncomingOrder] = useState(true);
  const [countdown, setCountdown] = useState(28);
  const [activeStep, setActiveStep] = useState<'idle' | 'pickup' | 'dropoff' | 'delivered'>('idle');
  const [handoverPin, setHandoverPin] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [coldChainChecked, setColdChainChecked] = useState(true);
  const [pinError, setPinError] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (!isOnline || !hasIncomingOrder || activeStep !== 'idle') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setHasIncomingOrder(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOnline, hasIncomingOrder, activeStep]);

  const handleAcceptOrder = () => {
    setActiveStep('pickup');
  };

  const handleConfirmPickup = () => {
    if (handoverPin.trim().length < 4) {
      setPinError('Please enter 4-digit pharmacy handover PIN');
      return;
    }
    setPinError('');
    setActiveStep('dropoff');
  };

  const handleConfirmDelivery = () => {
    if (deliveryOtp.trim() !== '4829' && deliveryOtp.trim() !== '1234') {
      setOtpError('Invalid customer OTP. Please check the code.');
      return;
    }
    setOtpError('');
    setActiveStep('delivered');
  };

  const handleReset = () => {
    setActiveStep('idle');
    setHasIncomingOrder(false);
    setHandoverPin('');
    setDeliveryOtp('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* TOP STATUS BAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <Bike className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">Ramesh Verma</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  UP-53-BK-8821
                </span>
              </div>
              <p className="text-xs text-slate-400">Gorakhpur Central Hub • Hero Splendor / Green EV</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {isOnline ? 'ONLINE (DUTY ACTIVE)' : 'OFFLINE (PAUSED)'}
              </span>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isOnline ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-orange-600 hover:bg-orange-500 text-white'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Today's Earnings</span>
            </div>
            <p className="text-2xl font-black text-white">₹840.00</p>
            <p className="text-[11px] text-emerald-400 mt-1 font-semibold">+₹120 surge bonus</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Bike className="w-4 h-4 text-orange-400" />
              <span>Trips Completed</span>
            </div>
            <p className="text-2xl font-black text-white">14</p>
            <p className="text-[11px] text-slate-400 mt-1">Target: 16 trips</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>On-Time SLA</span>
            </div>
            <p className="text-2xl font-black text-white">98.5%</p>
            <p className="text-[11px] text-sky-400 mt-1 font-semibold">Avg 9.8 mins in GKP</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Partner Rating</span>
            </div>
            <p className="text-2xl font-black text-white">4.95 ★</p>
            <p className="text-[11px] text-amber-400 mt-1">1,240 lifetime reviews</p>
          </div>
        </div>

        {/* STEP 1: INCOMING ORDER ALERT */}
        {activeStep === 'idle' && isOnline && hasIncomingOrder && (
          <div className="bg-gradient-to-r from-orange-950/40 to-slate-900 border-2 border-orange-500 rounded-2xl p-6 shadow-2xl relative animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-lg text-xs font-black bg-orange-500 text-white tracking-wider">
                ⚡ NEW MEDICINE DISPATCH
              </span>
              <span className="text-orange-400 font-black text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" /> {countdown}s to accept
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Pickup (0.8 km)</p>
                  <p className="text-sm font-bold text-white">Apollo Pharmacy — Golghar Hub</p>
                  <p className="text-xs text-slate-400">Shop #12, Golghar Main Road, Gorakhpur</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Drop-Off (2.4 km)</p>
                  <p className="text-sm font-bold text-white">H.No 412, Rapti Nagar Phase 4</p>
                  <p className="text-xs text-slate-400">Gorakhpur (PIN: 273004)</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl mb-6">
              <div>
                <p className="text-xs text-slate-400">Estimated Earnings:</p>
                <p className="text-lg font-black text-emerald-400">₹60.00 <span className="text-xs font-normal text-slate-400">(₹45 base + ₹15 speed incentive)</span></p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-bold">
                Thermal Insulated Bag
              </span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setHasIncomingOrder(false)}
                className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-sm transition-all"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptOrder}
                className="flex-[2] py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm transition-all shadow-lg shadow-orange-600/30"
              >
                Accept Order & Start Pickup
              </button>
            </div>
          </div>
        )}

        {/* STEP 1 IDLE NO ORDER */}
        {activeStep === 'idle' && (!hasIncomingOrder || !isOnline) && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Bike className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {isOnline ? 'Waiting for New Dispatches in Gorakhpur...' : 'You are currently offline'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isOnline
                ? 'High-demand zones active near Golghar, BRD Medical College & Taramandal. Keep GPS on.'
                : 'Tap "Go Online" at the top to start receiving medicine delivery requests.'}
            </p>
            {isOnline && (
              <button
                onClick={() => {
                  setHasIncomingOrder(true);
                  setCountdown(30);
                }}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all"
              >
                Simulate Incoming Dispatch
              </button>
            )}
          </div>
        )}

        {/* STEP 2: PHARMACY COUNTER PICKUP */}
        {activeStep === 'pickup' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">STEP 1 OF 2</span>
                <h2 className="text-xl font-bold text-white">Pharmacy Counter Pickup</h2>
              </div>
              <span className="px-3 py-1 rounded bg-slate-800 text-xs font-mono text-slate-300">
                Order #MED-99214
              </span>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-xl space-y-2">
              <p className="text-xs text-slate-400 font-semibold">PICKUP LOCATION:</p>
              <p className="font-bold text-white text-base">Apollo Pharmacy — Golghar Hub</p>
              <p className="text-xs text-slate-400">Shop #12, Golghar Main Road, Gorakhpur</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-300">PACKAGE CHECKLIST:</p>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1.5">
                <p className="text-slate-200">• Dolo 650 Tablets (1 Strip)</p>
                <p className="text-slate-200">• Azee 500 Tablets (1 Strip - Schedule H)</p>
                <p className="text-emerald-400 font-semibold">✓ Tamper-evident seal barcode verified (#CB-GKP-882190)</p>
              </div>
            </div>

            <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="coldChain"
                checked={coldChainChecked}
                onChange={e => setColdChainChecked(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0"
              />
              <label htmlFor="coldChain" className="text-xs text-blue-200 font-medium cursor-pointer">
                Statutory Cold-Chain Verified: Insulated temperature box active (4.2°C compliant).
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                ENTER PHARMACY HANDOVER PIN (FROM COUNTER):
              </label>
              <input
                type="text"
                maxLength={4}
                value={handoverPin}
                onChange={e => setHandoverPin(e.target.value)}
                placeholder="4-digit PIN (e.g. 9182)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-orange-500"
              />
              {pinError && <p className="text-xs text-rose-400">{pinError}</p>}
            </div>

            <button
              onClick={handleConfirmPickup}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-orange-600/30"
            >
              Confirm Pickup & Start Customer Route
            </button>
          </div>
        )}

        {/* STEP 3: CUSTOMER DROPOFF */}
        {activeStep === 'dropoff' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">STEP 2 OF 2</span>
                <h2 className="text-xl font-bold text-white">Customer Doorstep Drop-Off</h2>
              </div>
              <span className="px-3 py-1 rounded bg-slate-800 text-xs font-mono text-slate-300">
                Order #MED-99214
              </span>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-xl space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-semibold">CUSTOMER DESTINATION:</p>
                <p className="font-bold text-white text-base">H.No 412, Rapti Nagar Phase 4</p>
                <p className="text-xs text-slate-400">Gorakhpur (PIN: 273004)</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => alert('Calling customer via masked caller relay...')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Call Customer
                </button>
                <button
                  onClick={() => alert('Opening turn-by-turn Gorakhpur route...')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-600/20 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-lg transition-all"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Live Navigation
                </button>
              </div>
            </div>

            <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400 font-bold">PREPAID VIA ONLINE UPI</p>
                <p className="text-xs text-slate-400">Do not collect any cash from recipient.</p>
              </div>
              <span className="text-emerald-400 font-black text-sm">₹0.00 Due</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                ENTER CUSTOMER DELIVERY OTP (Demo OTP: 4829):
              </label>
              <input
                type="text"
                maxLength={4}
                value={deliveryOtp}
                onChange={e => setDeliveryOtp(e.target.value)}
                placeholder="4-digit OTP"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-2xl font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              {otpError && <p className="text-xs text-rose-400">{otpError}</p>}
            </div>

            <button
              onClick={handleConfirmDelivery}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/30"
            >
              Verify OTP & Complete Delivery
            </button>
          </div>
        )}

        {/* STEP 4: DELIVERED CELEBRATION */}
        {activeStep === 'delivered' && (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Delivery Completed!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Medicines handed over at Rapti Nagar Phase 4, Gorakhpur.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl max-w-sm mx-auto flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Credited to Wallet:</span>
              <span className="text-xl font-black text-emerald-400">₹60.00</span>
            </div>

            <button
              onClick={handleReset}
              className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-sm rounded-xl transition-all"
            >
              Ready for Next Order
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
