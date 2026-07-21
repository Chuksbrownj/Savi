import 'package:flutter/material.dart';
import 'package:core/core.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Savi Customer'),
        backgroundColor: SaviColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Welcome to Savi', style: SaviTypography.heading1),
            const SizedBox(height: SaviSpacing.md),
            const Text('Your laundry, delivered.', style: SaviTypography.body),
            const SizedBox(height: SaviSpacing.xl),
            ElevatedButton(
              onPressed: () {
                // Navigate to order placement or tracking
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: SaviColors.secondary,
                padding: const EdgeInsets.symmetric(horizontal: SaviSpacing.xl, vertical: SaviSpacing.md),
              ),
              child: const Text('Track Order', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
