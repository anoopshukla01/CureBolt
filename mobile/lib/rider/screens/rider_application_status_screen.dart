import 'package:flutter/material.dart';
import '../services/rider_auth_service.dart';
import 'rider_home_screen.dart';
import 'rider_login_screen.dart';
import 'rider_onboarding_screen.dart';

class RiderApplicationStatusScreen extends StatefulWidget {
  final RiderAuthService authService;

  const RiderApplicationStatusScreen({super.key, required this.authService});

  @override
  State<RiderApplicationStatusScreen> createState() => _RiderApplicationStatusScreenState();
}

class _RiderApplicationStatusScreenState extends State<RiderApplicationStatusScreen> {
  bool _isRefreshing = false;

  Future<void> _refreshStatus() async {
    setState(() => _isRefreshing = true);
    await widget.authService.refreshOnboardingStatus();
    setState(() => _isRefreshing = false);

    final profile = widget.authService.currentProfile;
    if (profile != null && profile.isApproved && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RiderHomeScreen(authService: widget.authService),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = widget.authService.currentApplication;
    final profile = widget.authService.currentProfile;
    final status = profile?.approvalStatus ?? app?.status ?? 'submitted';
    final reviewerComments = profile?.reviewerComments ?? app?.reviewerComments;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Application Status'),
        backgroundColor: Colors.white,
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out',
            onPressed: () async {
              await widget.authService.signOut();
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => RiderLoginScreen(authService: widget.authService)),
                );
              }
            },
          )
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              _buildStatusCard(status, reviewerComments),
              const SizedBox(height: 24),

              // Application Details Card
              if (app != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Submitted Details',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const Divider(height: 20),
                      _buildDetailRow('Applicant Name', app.fullName),
                      _buildDetailRow('Vehicle Registration', app.vehicleRegistrationNumber),
                      _buildDetailRow('Vehicle Type', app.vehicleType.toUpperCase()),
                      _buildDetailRow('Driving Licence No.', app.drivingLicenceNumber),
                      _buildDetailRow('Emergency Contact', '${app.emergencyContactName} (${app.emergencyContactRelation})'),
                      if (app.bankAccountMasked != null)
                        _buildDetailRow('Masked Settlement', app.bankAccountMasked!),
                    ],
                  ),
                ),
              ],

              const Spacer(),

              // Action Buttons
              if (status == 'needs_changes') ...[
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RiderOnboardingScreen(authService: widget.authService),
                      ),
                    );
                  },
                  icon: const Icon(Icons.edit_document),
                  label: const Text('Update & Resubmit Application'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD97706),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
                const SizedBox(height: 12),
              ] else if (status == 'approved') ...[
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RiderHomeScreen(authService: widget.authService),
                      ),
                    );
                  },
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Enter Delivery Dashboard'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              OutlinedButton.icon(
                onPressed: _isRefreshing ? null : _refreshStatus,
                icon: _isRefreshing
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.refresh),
                label: const Text('Refresh Verification Status'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusCard(String status, String? comments) {
    Color bg;
    Color border;
    Color text;
    IconData icon;
    String title;
    String description;

    switch (status) {
      case 'approved':
        bg = const Color(0xFFECFDF5);
        border = const Color(0xFF10B981);
        text = const Color(0xFF065F46);
        icon = Icons.verified;
        title = 'Application Approved';
        description = 'Your driving credentials, identity, and vehicle RC have been verified. You may now go online and receive pharmacy delivery dispatches.';
        break;
      case 'needs_changes':
        bg = const Color(0xFFFFFBEB);
        border = const Color(0xFFF59E0B);
        text = const Color(0xFF92400E);
        icon = Icons.warning_amber_rounded;
        title = 'Revisions Requested';
        description = comments ?? 'Reviewer requested changes to your uploaded documents or registration details.';
        break;
      case 'suspended':
        bg = const Color(0xFFFEF2F2);
        border = const Color(0xFFEF4444);
        text = const Color(0xFF991B1B);
        icon = Icons.block;
        title = 'Account Suspended';
        description = 'Your delivery partner account has been temporarily suspended by fleet operations.';
        break;
      default:
        bg = const Color(0xFFEFF6FF);
        border = const Color(0xFF3B82F6);
        text = const Color(0xFF1E40AF);
        icon = Icons.hourglass_top_rounded;
        title = 'Verification In Progress';
        description = 'Your documents are being checked against Parivahan RTO and regional pharmacy compliance regulations. Review usually completes within 24 hours.';
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border, width: 1.5),
      ),
      child: Column(
        children: [
          Icon(icon, size: 44, color: text),
          const SizedBox(height: 10),
          Text(
            title,
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: text),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: text, height: 1.4),
          ),
          if (status == 'needs_changes' && comments != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFBBF24)),
              ),
              child: Text(
                'Notes from Reviewer: $comments',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF78350F)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}
