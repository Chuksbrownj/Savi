import 'package:flutter/material.dart';
import 'package:core/core.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(SaviSpacing.lg),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Dispatch Login', style: SaviTypography.heading1, textAlign: TextAlign.center),
            const SizedBox(height: SaviSpacing.xl),
            TextFormField(
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: SaviSpacing.md),
            TextFormField(
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: SaviSpacing.xl),
            ElevatedButton(
              onPressed: () {
                // Perform Login logic here
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: SaviColors.primaryDark,
                padding: const EdgeInsets.symmetric(vertical: SaviSpacing.md),
              ),
              child: const Text('Login', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
