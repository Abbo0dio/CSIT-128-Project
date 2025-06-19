class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = {};
        this.rules = {
            required: (value) => value.trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            minlength: (value, min) => value.length >= parseInt(min),
            maxlength: (value, max) => value.length <= parseInt(max),
            min: (value, min) => parseFloat(value) >= parseFloat(min),
            max: (value, max) => parseFloat(value) <= parseFloat(max),
            pattern: (value, pattern) => new RegExp(pattern).test(value),
            confirm: (value, confirmFieldId) => {
                const confirmField = document.getElementById(confirmFieldId);
                return confirmField ? value === confirmField.value : false;
            },
            phone: (value) => /^[\+]?[0-9\s\-\(\)]{10,15}$/.test(value),
            url: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            strongPassword: (value) => {
                // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(value);
            },
            date: (value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            },
            futureDate: (value) => {
                const date = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date >= today;
            }
        };

        this.messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            minlength: 'Must be at least {min} characters long',
            maxlength: 'Must be no more than {max} characters long',
            min: 'Value must be at least {min}',
            max: 'Value must be no more than {max}',
            pattern: 'Please match the required format',
            confirm: 'Fields do not match',
            phone: 'Please enter a valid phone number',
            url: 'Please enter a valid URL',
            strongPassword: 'Password must be at least 8 characters with uppercase, lowercase, and number',
            date: 'Please enter a valid date',
            futureDate: 'Date must be in the future'
        };

        this.init();
    }

    init() {
        if (!this.form) {
            console.error('Form not found');
            return;
        }

        this.setupEventListeners();
        this.createErrorElements();
    }

    setupEventListeners() {
        // Real-time validation on blur
        this.form.addEventListener('blur', (e) => {
            if (this.isValidationTarget(e.target)) {
                this.validateField(e.target);
            }
        }, true);

        // Clear errors on input
        this.form.addEventListener('input', (e) => {
            if (this.isValidationTarget(e.target)) {
                this.clearFieldError(e.target);
            }
        });

        // Validate on form submission
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.scrollToFirstError();
            }
        });
    }

    isValidationTarget(element) {
        return element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA';
    }

    createErrorElements() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (!field.id) return;

            const errorId = field.id + 'Error';
            let errorElement = document.getElementById(errorId);

            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = errorId;
                errorElement.className = 'error-message';
                errorElement.style.cssText = `
                color: var(--danger-color, #dc2626);
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: none;
                `;

                // Insert after the field or its parent
                const insertAfter = field.parentNode.querySelector('label') ? field : field.parentNode;
                insertAfter.parentNode.insertBefore(errorElement, insertAfter.nextSibling);
            }
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const rules = this.getFieldRules(field);

        this.clearFieldError(field);

        for (const [rule, ruleValue] of Object.entries(rules)) {
            if (!this.rules[rule]) continue;

            let isValid;
            if (rule === 'required') {
                isValid = this.rules[rule](value);
            } else if (value === '' && !rules.required) {
                // Skip validation for empty optional fields
                continue;
            } else {
                isValid = this.rules[rule](value, ruleValue);
            }

            if (!isValid) {
                this.showFieldError(field, rule, ruleValue);
                return false;
            }
        }

        this.showFieldSuccess(field);
        return true;
    }

    validateForm() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getFieldRules(field) {
        const rules = {};

        // Standard HTML5 validation attributes
        if (field.required) rules.required = true;
        if (field.type === 'email') rules.email = true;
        if (field.minLength) rules.minlength = field.minLength;
        if (field.maxLength) rules.maxlength = field.maxLength;
        if (field.min) rules.min = field.min;
        if (field.max) rules.max = field.max;
        if (field.pattern) rules.pattern = field.pattern;

        // Custom data attributes
        if (field.dataset.confirm) rules.confirm = field.dataset.confirm;
        if (field.dataset.phone) rules.phone = true;
        if (field.dataset.url) rules.url = true;
        if (field.dataset.strongPassword) rules.strongPassword = true;
        if (field.dataset.futureDate) rules.futureDate = true;

        return rules;
    }

    showFieldError(field, rule, ruleValue) {
        const errorElement = document.getElementById(field.id + 'Error');
        if (!errorElement) return;

        let message = this.messages[rule] || 'Invalid value';

        // Replace placeholders in message
        if (ruleValue && typeof ruleValue === 'string') {
            message = message.replace(`{${rule}}`, ruleValue);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('show');

        field.classList.add('input-error');
        field.classList.remove('input-success');

        // Store error for form-level validation
        this.errors[field.id] = message;
    }

    showFieldSuccess(field) {
        const errorElement = document.getElementById(field.id + 'Error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.classList.remove('show');
        }

        field.classList.remove('input-error');
        field.classList.add('input-success');

        // Remove error from errors object
        delete this.errors[field.id];
    }

    clearFieldError(field) {
        if (field.value.trim() !== '') {
            const errorElement = document.getElementById(field.id + 'Error');
            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.classList.remove('show');
            }
            field.classList.remove('input-error');
        }
    }

    scrollToFirstError() {
        const firstErrorField = this.form.querySelector('.input-error');
        if (firstErrorField) {
            firstErrorField.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            firstErrorField.focus();
        }
    }

    // Public methods for external use
    addCustomRule(name, validator, message) {
        this.rules[name] = validator;
        this.messages[name] = message;
    }

    setCustomMessage(rule, message) {
        this.messages[rule] = message;
    }

    getErrors() {
        return this.errors;
    }

    hasErrors() {
        return Object.keys(this.errors).length > 0;
    }

    reset() {
        this.errors = {};
        const fields = this.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.classList.remove('input-error', 'input-success');
            const errorElement = document.getElementById(field.id + 'Error');
            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.classList.remove('show');
            }
        });
    }

    // Static method for easy initialization
    static init(formId) {
        return new FormValidator(formId);
    }
}

// Utility functions for common validations
const ValidationUtils = {
    // Password strength checker
    checkPasswordStrength(password) {
        const strength = {
            score: 0,
            feedback: []
        };

        if (password.length >= 8) strength.score++;
        else strength.feedback.push('Use at least 8 characters');

        if (/[a-z]/.test(password)) strength.score++;
        else strength.feedback.push('Include lowercase letters');

        if (/[A-Z]/.test(password)) strength.score++;
        else strength.feedback.push('Include uppercase letters');

        if (/\d/.test(password)) strength.score++;
        else strength.feedback.push('Include numbers');

        if (/[^a-zA-Z\d]/.test(password)) strength.score++;
        else strength.feedback.push('Include special characters');

        return strength;
    },

    // Format phone number
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    },

    // Validate file upload
    validateFile(file, options = {}) {
        const {
            maxSize = 5 * 1024 * 1024, // 5MB default
            allowedTypes = ['image/*', 'application/pdf'],
            maxFiles = 1
        } = options;

        const errors = [];

        if (file.size > maxSize) {
            errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
        }

        const isAllowedType = allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        });

        if (!isAllowedType) {
            errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// Auto-initialize forms with data-validate attribute
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        if (form.id) {
            FormValidator.init(form.id);
        }
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormValidator, ValidationUtils };
}

// Global access
window.FormValidator = FormValidator;
window.ValidationUtils = ValidationUtils;
