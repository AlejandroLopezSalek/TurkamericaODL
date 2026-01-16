// Auth UI Logic

// Expose globally for onclick events - Defined immediately
// Expose globally for onclick events - Defined immediately
window.togglePassword = function (inputId) {
    console.log('Toggling password for:', inputId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + '-icon');
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    } else {
        console.error('Input or Icon not found:', inputId);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // initPasswordToggles(); // No longer needed as separate init
    initStrengthMeter();
});

function initStrengthMeter() {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('strengthBar');
    const strengthLabel = document.getElementById('strengthLabel');
    const submitBtn = document.getElementById('submitBtn');
    const reqLength = document.getElementById('req-length');
    const matchText = document.getElementById('matchText');

    // Only run if elements exist (Register page)
    if (!passwordInput || !strengthBar) return;

    function updateStrength() {
        const pass = passwordInput.value;
        let strength = 0;

        // Logic
        if (pass.length >= 6) strength += 30;
        if (pass.length >= 8) strength += 20;
        if (/[0-9]/.test(pass)) strength += 25;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 25;

        // UI Bar
        strengthBar.style.width = strength + '%';

        // Colors & Label
        if (strength < 30) {
            strengthBar.className = 'h-full transition-all duration-300 bg-red-500';
            strengthLabel.textContent = 'Débil';
            strengthLabel.className = 'text-red-500 font-bold';
        } else if (strength < 70) {
            strengthBar.className = 'h-full transition-all duration-300 bg-yellow-500';
            strengthLabel.textContent = 'Media';
            strengthLabel.className = 'text-yellow-500 font-bold';
        } else {
            strengthBar.className = 'h-full transition-all duration-300 bg-green-500';
            strengthLabel.textContent = 'Fuerte';
            strengthLabel.className = 'text-green-500 font-bold';
        }

        // Checks
        if (pass.length >= 8) {
            if (reqLength) {
                const icon = reqLength.querySelector('i');
                if (icon) icon.className = 'fas fa-check-circle text-[8px] mr-1 text-green-500';
                reqLength.classList.add('text-green-600');
            }
        } else {
            if (reqLength) {
                const icon = reqLength.querySelector('i');
                if (icon) icon.className = 'fas fa-circle text-[8px] mr-1 text-slate-300';
                reqLength.classList.remove('text-green-600');
            }
        }

        validateForm();
    }

    function validateForm() {
        const pass = passwordInput.value;
        const confirm = confirmInput ? confirmInput.value : '';
        let isValid = true;

        // 1. Password Strength Check
        if (pass.length < 8) {
            isValid = false;
        }

        // 2. Match Check
        if (confirmInput) {
            if (confirm.length > 0) {
                if (pass !== confirm) {
                    if (matchText) {
                        matchText.textContent = 'Las contraseñas no coinciden';
                        matchText.className = 'text-xs mt-1 font-medium text-red-500';
                        matchText.classList.remove('hidden');
                    }
                    isValid = false;
                } else {
                    if (matchText) {
                        matchText.textContent = '¡Coinciden!';
                        matchText.className = 'text-xs mt-1 font-medium text-green-500';
                        matchText.classList.remove('hidden');
                    }
                }
            } else {
                if (matchText) matchText.classList.add('hidden');
                if (pass.length > 0) isValid = false;
            }
        }

        if (isValid && pass.length >= 8) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.className = 'w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold shadow-lg transform transition hover:-translate-y-0.5 hover:shadow-indigo-500/30 active:scale-[0.98] cursor-pointer';
            }
        } else {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.className = 'w-full py-3 mt-4 bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed rounded-lg font-bold transition';
            }
        }
    }

    passwordInput.addEventListener('input', updateStrength);
    if (confirmInput) confirmInput.addEventListener('input', validateForm);
}

// Google Sign-In Callback
window.handleCredentialResponse = async function (response) {
    if (!response || !response.credential) {
        if (window.toastError) window.toastError('No credential received', 'Error', 4000);
        return;
    }

    // Send JWT to backend
    const result = await window.AuthService.loginWithGoogle(response.credential);

    if (result.success) {
        // Show success message
        if (window.toastSuccess) window.toastSuccess('Login con Google exitoso', 'Bienvenido', 3000);
        setTimeout(() => window.location.href = '/', 1500);
    } else {
        if (window.toastError) window.toastError(result.error, 'Error', 4000);
    }
};
