import 'package:core_config/core_config.dart';

class RiderEnvironment {
  static const appId = 'com.medcure.rider';
  static const appName = 'Medcure Delivery Partner';

  static FlavorConfig currentConfig({AppFlavor flavor = AppFlavor.dev}) {
    switch (flavor) {
      case AppFlavor.dev:
        return FlavorConfig.devForApp(appId: appId, appName: appName);
      case AppFlavor.staging:
        return FlavorConfig.stagingForApp(appId: appId, appName: appName);
      case AppFlavor.prod:
        return FlavorConfig.prodForApp(appId: appId, appName: appName);
    }
  }
}
