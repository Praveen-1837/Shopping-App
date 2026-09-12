import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { formatRoleLabel } from "../utils/formatters";
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { ArrowLeft, CheckCircle2, Sprout, ShoppingBag, BookOpen, Send, AlertCircle, Truck } from 'lucide-react';

export default function ApplyRole() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getToken, isSignedIn } = useAuth();
  
  const isRoleLocked = !!searchParams.get('role');
  const defaultRole = (searchParams.get('role')?.toUpperCase() as any) || 'FARMER';
  const isValidRole = ['SELLER', 'FARMER', 'ARTISAN', 'EDUCATOR', 'DELIVERY_PARTNER'].includes(defaultRole);

  const [requestedRole, setRequestedRole] = useState<'SELLER' | 'FARMER' | 'ARTISAN' | 'EDUCATOR' | 'DELIVERY_PARTNER'>(isValidRole ? defaultRole : 'FARMER');
  
  useEffect(() => {
    if (searchParams.get('role')) {
      const role = searchParams.get('role')?.toUpperCase();
      if (['SELLER', 'FARMER', 'ARTISAN', 'EDUCATOR', 'DELIVERY_PARTNER'].includes(role || '')) {
        setRequestedRole(role as any);
      }
    }
  }, [searchParams]);

  // Generic fields
  const [businessName, setBusinessName] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  
  // Delivery Partner specific fields
  const [fullName, setFullName] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('Bike/Scooter');
  const [serviceArea, setServiceArea] = useState<string>('');
  const [availability, setAvailability] = useState<string>('Full-time');
  const [idProofType, setIdProofType] = useState<string>('Aadhaar Card');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState<string>('');
  const [vehicleRegistrationNumber, setVehicleRegistrationNumber] = useState<string>('');
  
  const [submitted, setSubmitted] = useState<boolean>(false);

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        navigate('/login');
        return;
      }
      const token = await getToken();
      
      const requiresVehicleDocs = vehicleType === 'Bike/Scooter' || vehicleType === 'Car';
      
      const details = requestedRole === 'DELIVERY_PARTNER' 
        ? { 
            fullName, 
            phone, 
            vehicleType, 
            serviceArea, 
            availability, 
            reason,
            idProofType,
            ...(requiresVehicleDocs ? { drivingLicenseNumber, vehicleRegistrationNumber } : {})
          }
        : { businessName, experience, reason, phone };
        
      await apiClient.post(
        '/onboarding/apply',
        { requestedRole, details },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-success-light border border-success/30 rounded-3xl p-8 space-y-4 shadow-soft">
          <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
          <h2 className="text-2xl font-bold font-heading text-success">Application Submitted!</h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Your application to become a verified <strong>{formatRoleLabel(requestedRole)}</strong> has been received. Our team will review your application shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const roleDisplayNames = {
    SELLER: 'Eco Seller',
    FARMER: 'Farmer',
    ARTISAN: 'Artisan',
    EDUCATOR: 'Educator',
    DELIVERY_PARTNER: 'Delivery Partner'
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs text-text-muted hover:text-primary transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold font-heading text-primary">
          {isRoleLocked ? `Apply to Become a ${roleDisplayNames[requestedRole]}` : 'Apply for Partner Role'}
        </h1>
        <p className="text-xs text-text-muted">
          {isRoleLocked 
            ? `Submit your details below to join EcoMarket as a ${roleDisplayNames[requestedRole]}.` 
            : 'Join our eco-marketplace ecosystem as a verified Farmer, Seller, Artisan, Educator, or Delivery Partner.'}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyMutation.mutate();
        }}
        className="bg-background-card rounded-3xl p-6 md:p-8 border border-text-muted/15 shadow-soft space-y-6"
      >
        {applyMutation.isError && (
          <div className="p-4 bg-error-light border border-error/30 text-error text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{(applyMutation.error as any)?.response?.data?.error?.message || 'Failed to submit application'}</span>
          </div>
        )}

        {!isRoleLocked && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
              Select Desired Partner Role *
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { role: 'FARMER', label: 'Farmer', icon: Sprout, desc: 'Organic produce' },
                { role: 'SELLER', label: 'Eco Seller', icon: ShoppingBag, desc: 'Sustainable goods' },
                { role: 'ARTISAN', label: 'Handicrafts', icon: Sprout, desc: 'Handmade items' },
                { role: 'EDUCATOR', label: 'Educator', icon: BookOpen, desc: 'Masterclasses' },
                { role: 'DELIVERY_PARTNER', label: 'Delivery', icon: Truck, desc: 'Eco Deliveries' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = requestedRole === item.role;
                return (
                  <button
                    type="button"
                    key={item.role}
                    onClick={() => setRequestedRole(item.role as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary-light text-primary ring-2 ring-primary/20'
                        : 'border-text-muted/20 bg-background-card text-text-secondary hover:border-text-muted'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <div>
                      <span className="block font-heading font-bold text-sm">{item.label}</span>
                      <span className="block text-[10px] text-text-muted">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {requestedRole === 'DELIVERY_PARTNER' ? (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Contact Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Vehicle Type *</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Bicycle">Bicycle</option>
                <option value="Bike/Scooter">Bike/Scooter</option>
                <option value="Car">Car</option>
                <option value="On Foot">On Foot</option>
              </select>
            </div>

            {(vehicleType === 'Bike/Scooter' || vehicleType === 'Car') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-primary">Driving License Number *</label>
                  <input
                    type="text"
                    required
                    value={drivingLicenseNumber}
                    onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                    placeholder="e.g. MH0420110012345"
                    className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-primary">Vehicle Registration Number *</label>
                  <input
                    type="text"
                    required
                    value={vehicleRegistrationNumber}
                    onChange={(e) => setVehicleRegistrationNumber(e.target.value)}
                    placeholder="e.g. MH 02 AB 1234"
                    className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">ID Proof Type *</label>
              <select
                value={idProofType}
                onChange={(e) => setIdProofType(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Service Area / Preferred Zone *</label>
              <input
                type="text"
                required
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. Mumbai — Andheri/Bandra"
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Availability *</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Weekends only">Weekends only</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Statement of Intent</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you want to join our eco-delivery fleet?"
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                {requestedRole === 'EDUCATOR' ? 'Institute / Background *' : 'Business / Farm / Brand Name *'}
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={requestedRole === 'EDUCATOR' ? 'e.g. Green Education Institute' : 'e.g. Green Valley Organic Farms'}
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Contact Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                Years of Experience & Methods
              </label>
              <textarea
                rows={3}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Describe your practices, certifications, or teaching history..."
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                Why would you like to join EcoMarket?
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Share your eco-mission..."
                className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={applyMutation.isPending}
          className="w-full py-3.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-soft flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          {applyMutation.isPending ? (
            'Submitting...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Partner Application</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
