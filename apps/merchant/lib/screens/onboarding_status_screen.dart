import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import '../models/onboarding_model.dart';
import '../services/pharmacy_onboarding_service.dart';

class OnboardingStatusScreen extends StatefulWidget {
  final PharmacyOnboardingService onboardingService;
  final PharmacyOnboardingModel application;

  const OnboardingStatusScreen({
    Key? key,
    required this.onboardingService,
    required this.application,
  }) : super(key: key);

  @override
  State<OnboardingStatusScreen> createState() => _OnboardingStatusScreenState();
}

class _OnboardingStatusScreenState extends State<OnboardingStatusScreen> {
  late PharmacyOnboardingModel _app;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _app = widget.application;
  }

  Future<void> _refresh() async {
    setState(() => _isRefreshing = true);
    final updated = await widget.onboardingService.fetchApplication(pharmacyId: _app.pharmacyId);
    if (updated != null && mounted) {
      setState(() => _app = updated);
    }
    if (mounted) setState(() => _isRefreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pharmacy Verification Status'),
        actions: [
          IconButton(
            icon: _isRefreshing
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.refresh),
            onPressed: _isRefreshing ? null : _refresh,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Statutory Licence Warning Banner (if expiring or expired)
            ExpiryAlertBanner(
              daysUntilExpiry: _app.daysUntilExpiry,
              isExpired: _app.isLicenceExpired,
              licenceNumber: _app.licenceForm20,
            ),
            const SizedBox(height: 12),

            // Main Status Hero Card
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: PharmacyColors.cardBorder),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _app.businessName,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: PharmacyColors.textPrimary),
                        ),
                        StatusBadge.fromStatus(_app.status),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _app.addressLine1,
                      style: const TextStyle(fontSize: 13, color: PharmacyColors.textSecondary),
                    ),
                    const Divider(height: 28),

                    // State-specific explanation
                    if (_app.status == 'submitted') ...[
                      _buildInfoRow(
                        Icons.hourglass_top,
                        PharmacyColors.info,
                        'Verification In Progress',
                        'Platform administrators are validating your Form 20/21 drug licences with the UP FDA portal. The pharmacy remains invisible to customers until approved.',
                      ),
                    ] else if (_app.status == 'verified') ...[
                      _buildInfoRow(
                        Icons.check_circle,
                        PharmacyColors.success,
                        'Active & Customer-Visible',
                        'Your pharmacy is verified and active for quick-commerce delivery in Gorakhpur.',
                      ),
                    ] else if (_app.status == 'needs_changes') ...[
                      _buildInfoRow(
                        Icons.warning,
                        PharmacyColors.warning,
                        'Changes Requested by Admin',
                        _app.reviewerComments ?? 'Please review licence files and resubmit.',
                      ),
                    ] else if (_app.status == 'suspended') ...[
                      _buildInfoRow(
                        Icons.block,
                        PharmacyColors.danger,
                        'Account Suspended',
                        _app.reviewerComments ?? 'Suspended due to statutory compliance or licence expiration.',
                      ),
                    ],

                    if (_app.reviewerComments != null && _app.reviewerComments!.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(8),
                          border: BorderSide(color: Colors.grey.shade300),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Reviewer Comments:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                            const SizedBox(height: 4),
                            Text(_app.reviewerComments!, style: const TextStyle(fontSize: 12, height: 1.3)),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Registered Pharmacist Card
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Registered Pharmacist on Record', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(Icons.verified_user, color: PharmacyColors.primary, size: 20),
                        const SizedBox(width: 8),
                        Text(_app.pharmacistName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('Reg No: ${_app.pharmacistRegNumber} (${_app.pharmacistCouncil})', style: const TextStyle(fontSize: 12, color: PharmacyColors.textSecondary)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons
            if (_app.status == 'needs_changes' || _app.status == 'draft') ...[
              ElevatedButton.icon(
                icon: const Icon(Icons.edit),
                label: const Text('EDIT & RESUBMIT APPLICATION'),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, Color color, String title, String body) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: color)),
              const SizedBox(height: 4),
              Text(body, style: const TextStyle(fontSize: 12, color: PharmacyColors.textSecondary, height: 1.3)),
            ],
          ),
        ),
      ],
    );
  }
}
