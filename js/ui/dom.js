import { debounce } from '../utils/helpers.js';

// DOM Manipulation Utilities
export class DOMManager {
    constructor() {
        this.eventListeners = new Map();
    }

    // Element selection utilities
    $(selector) {
        return document.querySelector(selector);
    }

    $$(selector) {
        return document.querySelectorAll(selector);
    }

    // Create element with attributes and classes
    createElement(tag, { classes = [], attributes = {}, textContent = '', innerHTML = '' } = {}) {
        const element = document.createElement(tag);
        
        if (classes.length > 0) {
            element.classList.add(...classes);
        }
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        if (textContent) {
            element.textContent = textContent;
        }
        
        if (innerHTML) {
            element.innerHTML = innerHTML;
        }
        
        return element;
    }

    // Add event listener with cleanup tracking
    addEventListener(element, event, handler, options = {}) {
        const wrappedHandler = options.debounce 
            ? debounce(handler, options.debounce)
            : handler;

        element.addEventListener(event, wrappedHandler, options);
        
        // Track for cleanup
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({ event, handler: wrappedHandler, options });
        
        return wrappedHandler;
    }

    // Remove all event listeners from an element
    removeAllListeners(element) {
        if (this.eventListeners.has(element)) {
            const listeners = this.eventListeners.get(element);
            listeners.forEach(({ event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
            this.eventListeners.delete(element);
        }
    }

    // Cleanup all tracked event listeners
    cleanup() {
        this.eventListeners.forEach((listeners, element) => {
            this.removeAllListeners(element);
        });
    }

    // Animation utilities
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        return new Promise(resolve => {
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    fadeOut(element, duration = 300) {
        return new Promise(resolve => {
            const start = performance.now();
            const initialOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = initialOpacity * (1 - progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    // Slide animations
    slideDown(element, duration = 300) {
        element.style.display = 'block';
        const height = element.scrollHeight;
        element.style.height = '0px';
        element.style.overflow = 'hidden';
        
        return new Promise(resolve => {
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (height * progress) + 'px';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.height = 'auto';
                    element.style.overflow = 'visible';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    slideUp(element, duration = 300) {
        const height = element.scrollHeight;
        element.style.height = height + 'px';
        element.style.overflow = 'hidden';
        
        return new Promise(resolve => {
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (height * (1 - progress)) + 'px';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    element.style.height = 'auto';
                    element.style.overflow = 'visible';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    // Toast notification system
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = this.$('#toast-container') || this.createToastContainer();
        
        const toast = this.createElement('div', {
            classes: [
                'toast', 'transform', 'transition-all', 'duration-300', 'translate-y-2', 'opacity-0',
                'bg-white', 'border', 'border-gray-200', 'rounded-lg', 'shadow-lg', 'p-4', 'mb-2',
                'flex', 'items-center', 'space-x-3', 'min-w-80', 'max-w-md'
            ]
        });

        const iconColors = {
            success: 'text-green-500',
            error: 'text-red-500',
            warning: 'text-yellow-500',
            info: 'text-blue-500'
        };

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${iconColors[type]} bg-gray-100">
                <span class="text-sm font-bold">${icons[type]}</span>
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-800">${message}</p>
            </div>
            <button class="flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.remove()">
                <span class="text-lg">×</span>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);

        return toast;
    }

    createToastContainer() {
        const container = this.createElement('div', {
            attributes: { id: 'toast-container' },
            classes: ['fixed', 'top-4', 'right-4', 'z-50', 'space-y-2']
        });
        document.body.appendChild(container);
        return container;
    }

    // Form validation helpers
    validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');
        const errors = [];

        inputs.forEach(input => {
            const value = input.value.trim();
            const fieldName = input.getAttribute('data-field-name') || input.name || input.id;

            if (!value) {
                errors.push(`${fieldName} is required`);
                this.addFieldError(input, `${fieldName} is required`);
            } else {
                this.removeFieldError(input);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    addFieldError(input, message) {
        // Remove existing error
        this.removeFieldError(input);
        
        // Add error styling
        input.classList.add('border-red-500', 'focus:border-red-500');
        
        // Add error message
        const errorElement = this.createElement('p', {
            classes: ['text-red-500', 'text-xs', 'mt-1', 'field-error'],
            textContent: message
        });
        
        input.parentElement.appendChild(errorElement);
    }

    removeFieldError(input) {
        // Remove error styling
        input.classList.remove('border-red-500', 'focus:border-red-500');
        
        // Remove error message
        const errorElement = input.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Loading state management
    showLoading(element, text = 'Loading...') {
        const originalContent = element.innerHTML;
        element.setAttribute('data-original-content', originalContent);
        
        element.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
                <span>${text}</span>
            </div>
        `;
        
        element.disabled = true;
    }

    hideLoading(element) {
        const originalContent = element.getAttribute('data-original-content');
        if (originalContent) {
            element.innerHTML = originalContent;
            element.removeAttribute('data-original-content');
        }
        element.disabled = false;
    }
}
