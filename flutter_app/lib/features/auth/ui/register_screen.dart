import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/auth/session.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/util/validators.dart';
import 'package:niwa/features/auth/ui/auth_form.dart';
import 'package:niwa/features/auth/ui/auth_layout.dart';
import 'package:niwa/features/auth/ui/password_field.dart';

/// Port of `web_app/src/auth/RegisterPage.tsx`. A closed instance answers
/// `REGISTRATION_CLOSED`, whose server message is shown in the banner.
class RegisterScreen extends ConsumerStatefulWidget {
  const new({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen>
    with AuthFormState {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() => submitWith(
    () => ref
        .read(sessionProvider.notifier)
        .register(email: _email.text.trim(), password: _password.text),
  );

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: NiwaTokens.spacingUnit * 5);
    return AuthLayout(
      title: 'Plant your garden',
      subtitle: 'NIWA is personal — one account per instance.',
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
                helperText: 'At least 12 characters.',
                autofillHint: AutofillHints.newPassword,
                textInputAction: TextInputAction.next,
                validator: validateNewPassword,
              ),
              gap,
              PasswordField(
                controller: _confirm,
                label: 'Confirm password',
                autofillHint: AutofillHints.newPassword,
                validator: validateConfirmation(() => _password.text),
                onSubmitted: (_) => _submit(),
              ),
              gap,
              SubmitButton(
                label: 'Create account',
                busy: submitting,
                onPressed: _submit,
              ),
              gap,
              AuthSwitchPrompt(
                question: 'Already have an account?',
                action: 'Log in',
                onPressed: () => context.go('/login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
