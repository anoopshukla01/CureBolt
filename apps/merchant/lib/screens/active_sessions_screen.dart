import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_auth/core_auth.dart';
import '../services/pharmacy_auth_service.dart';
import 'login_screen.dart';

class ActiveSessionsScreen extends StatefulWidget {
  final PharmacyAuthService authService;

  const ActiveSessionsScreen({Key? key, required this.authService}) : super(key: key);

  @override
  State<ActiveSessionsScreen> createState() => _ActiveSessionsScreenState();
}

class _ActiveSessionsScreenState extends State<ActiveSessionsScreen> {
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() => _isLoading = true);
    await widget.authService.fetchActiveSessions();
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _handleSignOutEverywhere() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out Everywhere?'),
        content: const Text(
          'This will revoke all active sessions across all counter tablets and phones. You will need to log in again with your credentials and TOTP code.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('CANCEL')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: PharmacyColors.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('REVOKE ALL SESSIONS'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await widget.authService.signOutEverywhere();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => LoginScreen(authService: widget.authService)),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessions = widget.authService.activeSessions;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Device Sessions & Security'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadSessions),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // Warning Card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: PharmacyColors.infoBg,
                    borderRadius: BorderRadius.circular(10),
                    border: BorderSide(color: PharmacyColors.info.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.shield, color: PharmacyColors.info, size: 24),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Active POS & counter terminal sessions. Revoking sessions immediately kills JWT tokens on the server.',
                          style: TextStyle(fontSize: 12, color: PharmacyColors.info, height: 1.3),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Sessions List
                if (sessions.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        children: [
                          const Icon(Icons.devices, size: 40, color: PharmacyColors.textMuted),
                          const SizedBox(height: 8),
                          Text(
                            'Current Terminal: ${defaultTargetPlatform.name}',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Session is active with statutory 30-day rolling expiration.',
                            style: TextStyle(fontSize: 12, color: PharmacyColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ...sessions.map((s) => Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: Icon(
                            s.isCurrent ? Icons.phone_android : Icons.tablet_android,
                            color: s.isCurrent ? PharmacyColors.primary : PharmacyColors.textSecondary,
                          ),
                          title: Text(
                            s.deviceInfo,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          subtitle: Text(
                            'IP: ${s.ipAddress} • Last active: ${s.lastActiveAt.toLocal().toString().split('.')[0]}',
                            style: const TextStyle(fontSize: 11),
                          ),
                          trailing: s.isCurrent
                              ? const Chip(
                                  label: Text('THIS DEVICE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
                                  backgroundColor: PharmacyColors.primaryLight,
                                )
                              : null,
                        ),
                      )),

                const SizedBox(height: 24),

                // Revoke All Button
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: PharmacyColors.danger,
                    minimumSize: const Size(double.infinity, 50),
                  ),
                  icon: const Icon(Icons.exit_to_app),
                  label: const Text('SIGN OUT EVERYWHERE (REVOKE ALL TOKENS)'),
                  onPressed: _handleSignOutEverywhere,
                ),
              ],
            ),
    );
  }
}
