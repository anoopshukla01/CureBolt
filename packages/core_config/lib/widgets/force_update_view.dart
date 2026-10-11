import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_l10n/core_l10n.dart';
import '../services/app_config_service.dart';

class ForceUpdateView extends StatelessWidget {
  final AppConfigState configState;
  final VoidCallback? onStoreLaunchPressed;

  const ForceUpdateView({
    Key? key,
    required this.configState,
    this.onStoreLaunchPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async => false, // Blocking: cannot dismiss
      child: Scaffold(
        backgroundColor: PharmacyColors.background,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: PharmacyColors.cardBorder),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(28.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: const BoxDecoration(
                            color: PharmacyColors.warningBg,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.system_update_alt,
                            size: 48,
                            color: PharmacyColors.warning,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          configState.forceUpdateTitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: PharmacyColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          configState.forceUpdateMessage,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 13,
                            color: PharmacyColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Minimum Required:', style: TextStyle(fontSize: 12, color: PharmacyColors.textSecondary)),
                              Text('v${configState.minSupportedVersion}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: PharmacyColors.primary)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: onStoreLaunchPressed,
                          icon: const Icon(Icons.open_in_new, size: 18),
                          label: Text(CoreL10n.updateNow, style: const TextStyle(fontWeight: FontWeight.w700)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: PharmacyColors.primary,
                            minimumSize: const Size(double.infinity, 50),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
