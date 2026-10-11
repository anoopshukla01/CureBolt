import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_auth/core_auth.dart';
import '../services/pharmacy_auth_service.dart';
import '../services/pharmacy_onboarding_service.dart';
import 'login_screen.dart';
import 'onboarding_screen.dart';
import 'onboarding_status_screen.dart';
import 'active_sessions_screen.dart';

class MerchantHomeScreen extends StatefulWidget {
  final PharmacyAuthService authService;

  const MerchantHomeScreen({Key? key, required this.authService}) : super(key: key);

  @override
  State<MerchantHomeScreen> createState() => _MerchantHomeScreenState();
}

class _MerchantHomeScreenState extends State<MerchantHomeScreen> {
  late PharmacyOnboardingService _onboardingService;

  @override
  void initState() {
    super.initState();
    _onboardingService = PharmacyOnboardingService();
    _loadOnboarding();
  }

  Future<void> _loadOnboarding() async {
    final user = widget.authService.currentUser;
    if (user != null) {
      await _onboardingService.fetchApplication(pharmacyId: user.pharmacyId);
    }
  }

  Future<void> _handleLogout() async {
    await widget.authService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => LoginScreen(authService: widget.authService)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.authService.currentUser;
    final app = _onboardingService.application;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              user?.pharmacyName ?? 'Medcure Pharmacy Counter',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
            const Text(
              'Gorakhpur Quick-Commerce Pilot',
              style: TextStyle(fontSize: 11, color: PharmacyColors.textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Active Devices & Sessions',
            icon: const Icon(Icons.security),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => ActiveSessionsScreen(authService: widget.authService)),
              );
            },
          ),
          IconButton(
            tooltip: 'Sign Out',
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User & Role Header Card
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: PharmacyColors.cardBorder),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: PharmacyColors.primaryLight,
                      child: Icon(
                        user?.isPharmacist == true
                            ? Icons.verified_user
                            : (user?.isOwner == true ? Icons.admin_panel_settings : Icons.badge),
                        color: PharmacyColors.primary,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'Pharmacy Operator',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: PharmacyColors.primary,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  (user?.role ?? 'STAFF').toUpperCase().replaceAll('_', ' '),
                                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                                ),
                              ),
                              if (user?.registrationNumber != null) ...[
                                const SizedBox(width: 8),
                                Text(
                                  'Reg: ${user!.registrationNumber}',
                                  style: const TextStyle(fontSize: 11, color: PharmacyColors.textSecondary),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Statutory Licence Warning Banner (if present)
            if (app != null) ...[
              ExpiryAlertBanner(
                daysUntilExpiry: app.daysUntilExpiry,
                isExpired: app.isLicenceExpired,
                licenceNumber: app.licenceForm20,
              ),
              const SizedBox(height: 8),
            ],

            // Milestone P1: Verification & Onboarding Card
            Card(
              color: const Color(0xFFF0FDF4),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFBBF7D0)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'P1: Pharmacy Onboarding & Licences',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: PharmacyColors.primaryDark),
                        ),
                        if (app != null) StatusBadge.fromStatus(app.status),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      app != null
                          ? 'Licence Form 20: ${app.licenceForm20} • Expires in ${app.daysUntilExpiry} days'
                          : 'Complete and submit statutory drug sale documents for platform verification.',
                      style: const TextStyle(fontSize: 12, color: PharmacyColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (user?.isOwner == true) ...[
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: PharmacyColors.primary,
                              minimumSize: const Size(140, 38),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                            ),
                            icon: const Icon(Icons.assignment, size: 16),
                            label: Text(app == null ? 'START ONBOARDING' : 'EDIT APPLICATION', style: const TextStyle(fontSize: 12)),
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => OnboardingScreen(
                                    onboardingService: _onboardingService,
                                    ownerUserId: user?.id ?? '',
                                  ),
                                ),
                              );
                            },
                          ),
                          const SizedBox(width: 8),
                        ],
                        if (app != null)
                          OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(120, 38),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                            ),
                            icon: const Icon(Icons.info_outline, size: 16),
                            label: const Text('VIEW STATUS', style: TextStyle(fontSize: 12)),
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => OnboardingStatusScreen(
                                    onboardingService: _onboardingService,
                                    application: app,
                                  ),
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Operational Modules Grid
            const Text(
              'Pharmacy Operations Workflow',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: PharmacyColors.textPrimary),
            ),
            const SizedBox(height: 10),

            _buildModuleTile(
              milestone: 'P2',
              title: 'Master Inventory & FEFO Batches',
              subtitle: 'Catalog mapping, batch expiry control, MRP enforcement & stock-take',
              icon: Icons.inventory_2_outlined,
              isPermitted: user?.capabilities.canManageInventoryAndPrices == true || user?.isStaff == true,
            ),
            const SizedBox(height: 8),

            _buildModuleTile(
              milestone: 'P3',
              title: 'Order Dispatch Inbox & Audible Alerts',
              subtitle: 'Multi-layer looping sound alarms, accept/reject SLA timer, partial availability',
              icon: Icons.notifications_active_outlined,
              isPermitted: true,
            ),
            const SizedBox(height: 8),

            _buildModuleTile(
              milestone: 'P4',
              title: 'Prescription Review (Pharmacist Only)',
              subtitle: 'Watermarked Rx viewer, secure flags, statutory checklist, Schedule H/X guard',
              icon: Icons.document_scanner_outlined,
              isPermitted: PharmacyPermissions.canReviewPrescription(user),
              restrictedMessage: 'Restricted: Dispensing law requires Registered Pharmacist credentials',
            ),
            const SizedBox(height: 8),

            _buildModuleTile(
              milestone: 'P5',
              title: 'Pick, Pack & QR Handover',
              subtitle: 'Barcode confirmation, batch assignment, thermal invoice printing & rider OTP',
              icon: Icons.qr_code_scanner_outlined,
              isPermitted: user?.capabilities.canPickAndPack == true,
            ),
            const SizedBox(height: 8),

            _buildModuleTile(
              milestone: 'P6',
              title: 'Staff, Settings & Settlement Reports',
              subtitle: 'Staff invitations, operating radius, encrypted bank statements & audit trails',
              icon: Icons.query_stats_outlined,
              isPermitted: user?.capabilities.canViewReportsAndSettlements == true,
              restrictedMessage: 'Restricted: Pharmacy Owner access only',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModuleTile({
    required String milestone,
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isPermitted,
    String? restrictedMessage,
  }) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: isPermitted ? PharmacyColors.cardBorder : Colors.grey.shade200),
      ),
      color: isPermitted ? Colors.white : const Color(0xFFF8FAFC),
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isPermitted ? PharmacyColors.primaryLight : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: isPermitted ? PharmacyColors.primary : Colors.grey.shade500, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: isPermitted ? const Color(0xFFE0E7FF) : Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          milestone,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: isPermitted ? const Color(0xFF3730A3) : Colors.grey.shade700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: isPermitted ? PharmacyColors.textPrimary : PharmacyColors.textMuted,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isPermitted ? subtitle : (restrictedMessage ?? 'Permission restricted'),
                    style: TextStyle(
                      fontSize: 11,
                      color: isPermitted ? PharmacyColors.textSecondary : PharmacyColors.danger.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isPermitted ? Icons.arrow_forward_ios : Icons.lock_outline,
              size: 14,
              color: isPermitted ? PharmacyColors.textMuted : Colors.grey.shade400,
            ),
          ],
        ),
      ),
    );
  }
}
