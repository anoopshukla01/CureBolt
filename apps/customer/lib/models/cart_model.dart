import 'package:flutter/foundation.dart';
import 'package:core_models/core_models.dart';

class CartItem {
  final ProductModel product;
  int quantity;

  CartItem({
    required this.product,
    this.quantity = 1,
  });

  double get lineTotal => product.sellingPrice * quantity;
}

class CartModel extends ChangeNotifier {
  final Map<String, CartItem> _items = {};
  String? _prescriptionPath;

  Map<String, CartItem> get items => Map.unmodifiable(_items);
  String? get prescriptionPath => _prescriptionPath;

  int get itemCount => _items.values.fold(0, (sum, i) => sum + i.quantity);

  double get subtotal => _items.values.fold(0.0, (sum, i) => sum + i.lineTotal);

  double get mrpTotal => _items.values.fold(0.0, (sum, i) => sum + (i.product.mrp * i.quantity));

  double get totalSavings => mrpTotal - subtotal;

  double get deliveryFee => subtotal >= 199.0 ? 0.0 : 15.0;

  double get packagingFee => 5.0;

  double get total => subtotal > 0 ? (subtotal + deliveryFee + packagingFee) : 0.0;

  bool get requiresPrescription => _items.values.any((i) => i.product.requiresPrescription);

  bool get hasValidPrescription => !requiresPrescription || (_prescriptionPath != null && _prescriptionPath!.isNotEmpty);

  int getQuantity(String productId) => _items[productId]?.quantity ?? 0;

  void add(ProductModel product) {
    if (_items.containsKey(product.id)) {
      if (_items[product.id]!.quantity < product.maxOrderQuantity) {
        _items[product.id]!.quantity++;
      }
    } else {
      _items[product.id] = CartItem(product: product, quantity: 1);
    }
    notifyListeners();
  }

  void remove(String productId) {
    if (!_items.containsKey(productId)) return;
    if (_items[productId]!.quantity > 1) {
      _items[productId]!.quantity--;
    } else {
      _items.remove(productId);
    }
    notifyListeners();
  }

  void setQuantity(ProductModel product, int qty) {
    if (qty <= 0) {
      _items.remove(product.id);
    } else {
      final safeQty = qty > product.maxOrderQuantity ? product.maxOrderQuantity : qty;
      _items[product.id] = CartItem(product: product, quantity: safeQty);
    }
    notifyListeners();
  }

  void attachPrescription(String path) {
    _prescriptionPath = path;
    notifyListeners();
  }

  void clearPrescription() {
    _prescriptionPath = null;
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _prescriptionPath = null;
    notifyListeners();
  }
}
