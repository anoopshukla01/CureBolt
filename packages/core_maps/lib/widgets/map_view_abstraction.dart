import 'package:flutter/material.dart';
import '../models/geo_point.dart';

class MapViewAbstraction extends StatefulWidget {
  final GeoPoint initialCenter;
  final ValueChanged<GeoPoint>? onPositionChanged;
  final bool isDraggable;
  final double zoom;
  final List<GeoPoint> routePolyline;
  final GeoPoint? riderPosition;

  const MapViewAbstraction({
    super.key,
    required this.initialCenter,
    this.onPositionChanged,
    this.isDraggable = true,
    this.zoom = 15.0,
    this.routePolyline = const [],
    this.riderPosition,
  });

  @override
  State<MapViewAbstraction> createState() => _MapViewAbstractionState();
}

class _MapViewAbstractionState extends State<MapViewAbstraction> {
  late GeoPoint _currentCenter;

  @override
  void initState() {
    super.initState();
    _currentCenter = widget.initialCenter;
  }

  @override
  void didUpdateWidget(covariant MapViewAbstraction oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialCenter != widget.initialCenter) {
      _currentCenter = widget.initialCenter;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Grid lines mimicking map tiles
          Positioned.fill(
            child: CustomPaint(
              painter: _MapTilePainter(),
            ),
          ),

          // Accuracy radius indicator if accuracy is wide
          if (_currentCenter.accuracyMeters != null && _currentCenter.accuracyMeters! > 25.0)
            Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF0284C7).withOpacity(0.12),
                border: Border.all(color: const Color(0xFF0284C7).withOpacity(0.4), width: 1.5),
              ),
            ),

          // Draggable pin at center
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [
                    BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
                  ],
                ),
                child: const Text(
                  'Order delivery here',
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
              const Icon(
                Icons.location_on,
                size: 42,
                color: Color(0xFFDC2626),
              ),
              Container(
                width: 8,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black38,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),

          // Top location coordinates readout
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(8),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 2)],
              ),
              child: Text(
                'Lat: ${_currentCenter.latitude.toStringAsFixed(4)}, Lng: ${_currentCenter.longitude.toStringAsFixed(4)}',
                style: const TextStyle(fontSize: 10, color: Color(0xFF475569), fontFamily: 'monospace'),
              ),
            ),
          ),

          // Accuracy warning if > 100m
          if (!_currentCenter.isAccurate)
            Positioned(
              bottom: 12,
              left: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFF59E0B)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, size: 16, color: Color(0xFFB45309)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'GPS accuracy is low (±${_currentCenter.accuracyMeters?.round()}m). Please drag map to confirm exact door.',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF92400E)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _MapTilePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 1.0;

    const spacing = 36.0;
    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
