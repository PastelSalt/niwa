import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/util/validators.dart';
import 'package:niwa/features/auth/ui/auth_form.dart';
import 'package:niwa/features/auth/ui/auth_layout.dart';
import 'package:niwa/features/auth/ui/password_field.dart';

/// Port of `web_app/src/auth/LoginPage.tsx`.
class LoginScreen extends ConsumerStatefulWidget {
  const new({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with AuthFormState {
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() => submitWith(
    () => ref
        .read(sessionProvider.notifier)
        .login(email: _email.text.trim(), password: _password.text),
  );

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: NiwaTokens.spacingUnit * 5);
    return AuthLayout(
      title: 'Welcome back',
      subtitle: 'Log in to tend your garden.',
      child: Form(
        key: formKey,
        child: AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (error case final message?) ...[FormErrorBanner(message), gap],
              TextFormField(
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                autocorrect: false,
                textInputAction: TextInputAction.next,
                validator: validateEmail,
              ),
              gap,
              PasswordField(
                controller: _password,
                label: 'Password',
                autofillHint: AutofillHints.password,
                validator: validateLoginPassword,
                onSubmitted: (_) => _submit(),
              ),
              gap,
              SubmitButton(
                label: 'Log in',
                busy: submitting,
                onPressed: _submit,
              ),
              gap,
              AuthSwitchPrompt(
                question: 'First time here?',
                action: 'Create your account',
                onPressed: () => context.go('/register'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
