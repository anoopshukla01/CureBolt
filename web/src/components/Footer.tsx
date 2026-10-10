import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#141416] border-t border-[#27272a] mt-20 pt-16 pb-12 text-[#a1a1aa] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Useful Links Column 1 */}
          <div>
            <h4 className="text-white font-extrabold text-sm mb-4">Useful Links</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:text-white transition-colors">About Medcure Gorakhpur</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy & DPDP Compliance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Licensed Pharmacy Partners</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pharmacist Verification Council</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact & Grievance Officer</a></li>
            </ul>
          </div>

          {/* Useful Links Column 2 */}
          <div>
            <h4 className="text-white font-extrabold text-sm mb-4">Partner With Us</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:text-white transition-colors">Pharmacy Onboarding (Gorakhpur)</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Veterinary Clinic Network</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Rider Fleet & Delivery Partner</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cash on Delivery Settlement</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Emergency Medicine Hotline</a></li>
            </ul>
          </div>

          {/* Categories Column 1: Human Healthcare */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-white font-extrabold text-sm">Human Care</h4>
              <span className="text-emerald-400 text-[11px] font-bold cursor-pointer hover:underline">see all</span>
            </div>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:text-white transition-colors">Prescription Drugs (Schedule H)</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Antiseptics & First Aid</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Derma & Therapeutic Skincare</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Fever, Pain & Cold Relief</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Diabetic Management</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Vitamins & Immunity Boosters</a></li>
            </ul>
          </div>

          {/* Categories Column 2: Veterinary Healthcare */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-white font-extrabold text-sm">Animal Healthcare</h4>
              <span className="text-emerald-400 text-[11px] font-bold cursor-pointer hover:underline">see all</span>
            </div>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:text-white transition-colors">Livestock Calcium & Minerals (Cattle)</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Canine & Feline Dewormers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Veterinary Injectable Antibiotics</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pet Nutrition & Coat Care</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Poultry & Dairy Disinfectants</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Veterinary Wound Healers</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-8 border-t border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#71717a]">
          <p>
            © 2026 Medcure Technologies Pvt Ltd. Serving Gorakhpur, UP (Golghar, Medical Road, Rapti Nagar, Taramandal). 
            Statutory compliance: Drugs and Cosmetics Act, 1940 & Rules, 1945. Selling price strictly ≤ MRP.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-500 font-bold">10-Minute Delivery Guarantee</span>
            <span>•</span>
            <span className="text-zinc-400">100% Genuine Pharmacy Stock</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
