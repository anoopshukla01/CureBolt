import 'package:flutter/material.dart';

class DeliveryLocation {
  final String label;
  final String fullAddress;
  final String pinCode;
  final double latitude;
  final double longitude;
  final bool isServiceable;
  final String estimatedEtaMinutes;

  const DeliveryLocation({
    required this.label,
    required this.fullAddress,
    required this.pinCode,
    required this.latitude,
    required this.longitude,
    this.isServiceable = true,
    this.estimatedEtaMinutes = '10–12 mins',
  });
}

class LocationPickerScreen extends StatefulWidget {
  final DeliveryLocation? currentLocation;
  final ValueChanged<DeliveryLocation> onLocationSelected;

  const LocationPickerScreen({
    super.key,
    this.currentLocation,
    required this.onLocationSelected,
  });

  static const List<DeliveryLocation> popularGorakhpurZones = [
    DeliveryLocation(
      label: 'Golghar (City Center)',
      fullAddress: 'Shop #12, Golghar Main Road, Gorakhpur',
      pinCode: '273001',
      latitude: 26.7588,
      longitude: 83.3732,
      estimatedEtaMinutes: '9–11 mins',
    ),
    DeliveryLocation(
      label: 'BRD Medical College Campus',
      fullAddress: 'Gate #2, Medical College Road, Gorakhpur',
      pinCode: '273013',
      latitude: 26.7933,
      longitude: 83.3912,
      estimatedEtaMinutes: '12–15 mins',
    ),
    DeliveryLocation(
      label: 'Civil Lines',
      fullAddress: 'Near St. Andrew’s College, Civil Lines, Gorakhpur',
      pinCode: '273001',
      latitude: 26.7521,
      longitude: 83.3814,
      estimatedEtaMinutes: '10–12 mins',
    ),
    DeliveryLocation(
      label: 'Taramandal / Naukkavihar',
      fullAddress: 'Near Lake View Point, Taramandal, Gorakhpur',
      pinCode: '273016',
      latitude: 26.7289,
      longitude: 83.3887,
      estimatedEtaMinutes: '14–17 mins',
    ),
    DeliveryLocation(
      label: 'Rapti Nagar Phase 4',
      fullAddress: 'H.No 412, Rapti Nagar, Gorakhpur',
      pinCode: '273004',
      latitude: 26.7794,
      longitude: 83.3765,
      estimatedEtaMinutes: '11–13 mins',
    ),
    DeliveryLocation(
      label: 'Mohaddipur Chowk',
      fullAddress: 'Near Police Station, Mohaddipur, Gorakhpur',
      pinCode: '273008',
      latitude: 26.7455,
      longitude: 83.3988,
      estimatedEtaMinutes: '10–14 mins',
    ),
    DeliveryLocation(
      label: 'Basharatpur',
      fullAddress: 'Christian Colony, Basharatpur, Gorakhpur',
      pinCode: '273004',
      latitude: 26.7820,
      longitude: 83.3640,
      estimatedEtaMinutes: '12–15 mins',
    ),
  ];

  @override
  State<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends State<LocationPickerScreen> {
  final _searchController = TextEditingController();
  List<DeliveryLocation> _filteredLocations = LocationPickerScreen.popularGorakhpurZones;
  bool _isDetectingGps = false;

  void _onSearchChanged(String query) {
    setState(() {
      if (query.trim().isEmpty) {
        _filteredLocations = LocationPickerScreen.popularGorakhpurZones;
      } else {
        final q = query.toLowerCase();
        _filteredLocations = LocationPickerScreen.popularGorakhpurZones.where((loc) =>
          loc.label.toLowerCase().contains(q) ||
          loc.fullAddress.toLowerCase().contains(q) ||
          loc.pinCode.contains(q)
        ).toList();
      }
    });
  }

  void _detectGpsLocation() {
    setState(() => _isDetectingGps = true);
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      setState(() => _isDetectingGps = false);
      // Detected Golghar Zone
      const detected = DeliveryLocation(
        label: 'Current GPS Location (Golghar)',
        fullAddress: 'Park Road, Golghar Market, Gorakhpur',
        pinCode: '273001',
        latitude: 26.7588,
        longitude: 83.3732,
        estimatedEtaMinutes: '9–11 mins',
      );
      widget.onLocationSelected(detected);
      Navigator.of(context).pop();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Delivery Location'),
      ),
      body: Column(
        children: [
          // GPS detection button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: InkWell(
              onTap: _isDetectingGps ? null : _detectGpsLocation,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDFA),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF0D9488), width: 1.5),
                ),
                child: Row(
                  children: [
                    _isDetectingGps
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0D9488)),
                          )
                        : const Icon(Icons.my_location_rounded, color: Color(0xFF0D9488)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isDetectingGps ? 'Detecting high-precision GPS...' : 'Detect My Exact Location',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Using Gorakhpur high-speed delivery geo-fence',
                            style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF0D9488)),
                  ],
                ),
              ),
            ),
          ),

          // Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Search Gorakhpur area, landmark or PIN (e.g. 273001)...',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),
          const Divider(),

          // Section header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                const Icon(Icons.flash_on_rounded, color: Color(0xFFEAB308), size: 18),
                const SizedBox(width: 6),
                const Text(
                  'Quick-Commerce Hubs in Gorakhpur',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
          ),

          // Locations list
          Expanded(
            child: ListView.separated(
              itemCount: _filteredLocations.length,
              separatorBuilder: (_, __) => const Divider(height: 1, indent: 64),
              itemBuilder: (context, index) {
                final loc = _filteredLocations[index];
                final isSelected = widget.currentLocation?.fullAddress == loc.fullAddress;

                return ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF0D9488) : const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.location_on_rounded,
                      color: isSelected ? Colors.white : const Color(0xFF64748B),
                      size: 20,
                    ),
                  ),
                  title: Text(
                    loc.label,
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  subtitle: Text(
                    '${loc.fullAddress} • PIN ${loc.pinCode}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      loc.estimatedEtaMinutes,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                    ),
                  ),
                  onTap: () {
                    widget.onLocationSelected(loc);
                    Navigator.of(context).pop();
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
