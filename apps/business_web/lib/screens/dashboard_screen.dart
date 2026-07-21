import 'package:flutter/material.dart';
import 'package:core/core.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Business Dashboard'),
        backgroundColor: SaviColors.textPrimary,
        foregroundColor: Colors.white,
      ),
      body: Row(
        children: [
          // Sidebar
          Container(
            width: 250,
            color: SaviColors.background,
            child: ListView(
              children: const [
                ListTile(
                  leading: Icon(Icons.dashboard),
                  title: Text('Overview'),
                ),
                ListTile(
                  leading: Icon(Icons.list_alt),
                  title: Text('Orders'),
                ),
                ListTile(
                  leading: Icon(Icons.people),
                  title: Text('Customers'),
                ),
                ListTile(
                  leading: Icon(Icons.delivery_dining),
                  title: Text('Dispatch'),
                ),
              ],
            ),
          ),
          // Main Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(SaviSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Active Orders', style: SaviTypography.heading2),
                  const SizedBox(height: SaviSpacing.lg),
                  Expanded(
                    child: Center(
                      child: Text('No active orders to display.', style: SaviTypography.body),
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
