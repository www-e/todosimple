import { COLORS } from '../utils/constants.js';

// Modal Management System
export class ModalManager {
    constructor(domManager, renderer) {
        this.dom = domManager;
        this.renderer = renderer;
        this.activeModal = null;
        this.modalContainer = null;
        this.setupModalContainer();
    }

    setupModalContainer() {
        this.modalContainer = this.dom.$('#modal-container');
        if (!this.modalContainer) {
            this.modalContainer = this.dom.createElement('div', {
                attributes: { id: 'modal-container' },
                classes: ['fixed', 'inset-0', 'z-50']
            });
            document.body.appendChild(this.modalContainer);
        }
    }

    // Base modal structure
    createModal(title, content, options = {}) {
        const modal = this.dom.createElement('div', {
            classes: [
                'modal-overlay', 'fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 
                'flex', 'items-center', 'justify-center', 'p-4', 'z-50',
                'opacity-0', 'transition-opacity', 'duration-300'
            ]
        });

        const modalContent = this.dom.createElement('div', {
            classes: [
                'modal-content', 'bg-white', 'rounded-xl', 'shadow-2xl', 
                'max-w-md', 'w-full', 'max-h-screen', 'overflow-hidden',
                'transform', 'scale-95', 'transition-transform', 'duration-300'
            ]
        });

        modalContent.innerHTML = `
            <div class="modal-header px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                <button class="modal-close text-gray-400 hover:text-gray-600 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        `;

        modal.appendChild(modalContent);
        return modal;
    }

    // Show modal with animation
    async showModal(modal) {
        if (this.activeModal) {
            await this.hideModal();
        }

        this.activeModal = modal;
        this.modalContainer.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Setup close handlers
        this.setupModalCloseHandlers(modal);

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('opacity-100');
            const content = modal.querySelector('.modal-content');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        });

        return modal;
    }

    // Hide modal with animation
    async hideModal() {
        if (!this.activeModal) return;

        const modal = this.activeModal;
        const content = modal.querySelector('.modal-content');

        // Animate out
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 300));

        // Cleanup
        if (modal.parentElement) {
            modal.remove();
        }
        this.activeModal = null;
        document.body.style.overflow = '';
    }

    // Setup modal close event handlers
    setupModalCloseHandlers(modal) {
        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            this.dom.addEventListener(closeBtn, 'click', () => this.hideModal());
        }

        // Overlay click
        this.dom.addEventListener(modal, 'click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        // Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    // Task modal (add/edit)
    showTaskModal(categories, task = null, preselectedCategory = null) {
        const isEdit = !!task;
        const title = isEdit ? 'Edit Task' : 'Add New Task';
        
        const content = `
            <form id="task-form" class="p-6 space-y-6">
                <div>
                    <label for="task-title" class="block text-sm font-medium text-gray-700 mb-2">
                        Task Title *
                    </label>
                    <input type="text" 
                           id="task-title" 
                           name="title"
                           required
                           data-field-name="Task Title"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                           placeholder="Enter task title..."
                           value="${task ? task.title : ''}"
                           maxlength="200">
                </div>

                <div>
                    <label for="task-description" class="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea id="task-description" 
                              name="description"
                              rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                              placeholder="Add a description...">${task ? task.description : ''}</textarea>
                </div>

                <div>
                    <label for="task-category" class="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                    </label>
                    <select id="task-category" 
                            name="category"
                            required
                            data-field-name="Category"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                        <option value="">Select a category</option>
                        ${categories.map(cat => `
                            <option value="${cat.name}" ${
                                (task && task.category === cat.name) || 
                                (preselectedCategory === cat.name) ? 'selected' : ''
                            }>
                                ${cat.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                        Color
                    </label>
                    ${this.renderer.renderColorPicker(task ? task.color : COLORS[0].value)}
                    <input type="hidden" id="task-color" name="color" value="${task ? task.color : COLORS[0].value}">
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button type="button" 
                            class="modal-cancel px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit" 
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        ${isEdit ? 'Update Task' : 'Add Task'}
                    </button>
                </div>
            </form>
        `;

        const modal = this.createModal(title, content);
        this.showModal(modal);

        // Setup form handlers
        this.setupTaskFormHandlers(modal, task);

        return modal;
    }

    // Setup task form event handlers
    setupTaskFormHandlers(modal, task = null) {
        const form = modal.querySelector('#task-form');
        const colorPicker = modal.querySelector('.color-picker');
        const colorInput = modal.querySelector('#task-color');
        const cancelBtn = modal.querySelector('.modal-cancel');

        // Color picker functionality
        if (colorPicker && colorInput) {
            this.dom.addEventListener(colorPicker, 'click', (e) => {
                if (e.target.classList.contains('color-option')) {
                    // Update visual selection
                    colorPicker.querySelectorAll('.color-option').forEach(btn => {
                        btn.classList.remove('border-gray-400', 'ring-2', 'ring-blue-500');
                        btn.classList.add('border-gray-200');
                    });
                    
                    e.target.classList.remove('border-gray-200');
                    e.target.classList.add('border-gray-400', 'ring-2', 'ring-blue-500');
                    
                    // Update hidden input
                    colorInput.value = e.target.dataset.color;
                }
            });
        }

        // Cancel button
        if (cancelBtn) {
            this.dom.addEventListener(cancelBtn, 'click', () => this.hideModal());
        }

        // Form submission will be handled by the main app
        return form;
    }

    // Export modal
    showExportModal() {
        const content = `
            <div class="p-6 space-y-6">
                <div class="text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                        <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 class="mt-4 text-lg font-medium text-gray-900">Export Your Tasks</h3>
                    <p class="mt-2 text-sm text-gray-500">Choose format and options for exporting your task data</p>
                </div>

                <form id="export-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="radio" name="format" value="json" checked class="text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">JSON (Complete data with metadata)</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="format" value="csv" class="text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">CSV (Spreadsheet compatible)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">Filter Options</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="radio" name="filter" value="all" checked class="text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">All tasks</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="filter" value="completed" class="text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Completed tasks only</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="filter" value="pending" class="text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Pending tasks only</span>
                            </label>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button type="button" 
                                class="modal-cancel px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            Export Data
                        </button>
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal('Export Tasks', content);
        this.showModal(modal);

        // Setup export form handlers
        const form = modal.querySelector('#export-form');
        const cancelBtn = modal.querySelector('.modal-cancel');

        if (cancelBtn) {
            this.dom.addEventListener(cancelBtn, 'click', () => this.hideModal());
        }

        return { modal, form };
    }

    // Confirmation modal
    showConfirmModal(title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning') {
        const iconColors = {
            warning: 'bg-yellow-100 text-yellow-600',
            danger: 'bg-red-100 text-red-600',
            info: 'bg-blue-100 text-blue-600'
        };

        const icons = {
            warning: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>`,
            danger: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                     </svg>`,
            info: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                   </svg>`
        };

        const content = `
            <div class="p-6">
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconColors[type]}">
                        ${icons[type]}
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-medium text-gray-900 mb-2">${title}</h3>
                        <p class="text-sm text-gray-600">${message}</p>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                    <button type="button" 
                            class="confirm-cancel px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        ${cancelText}
                    </button>
                    <button type="button" 
                            class="confirm-action px-6 py-2 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors font-medium">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        const modal = this.createModal('', content);
        this.showModal(modal);

        return new Promise((resolve) => {
            const confirmBtn = modal.querySelector('.confirm-action');
            const cancelBtn = modal.querySelector('.confirm-cancel');

            const handleConfirm = () => {
                this.hideModal();
                resolve(true);
            };

            const handleCancel = () => {
                this.hideModal();
                resolve(false);
            };

            if (confirmBtn) {
                this.dom.addEventListener(confirmBtn, 'click', handleConfirm);
            }

            if (cancelBtn) {
                this.dom.addEventListener(cancelBtn, 'click', handleCancel);
            }
        });
    }

    // Quick category selector modal for adding tasks
    showQuickAddModal(categories, preselectedCategory = null) {
        const content = `
            <form id="quick-add-form" class="p-6 space-y-4">
                <div>
                    <input type="text" 
                           id="quick-task-title" 
                           name="title"
                           required
                           class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                           placeholder="What needs to be done?"
                           maxlength="200">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    ${categories.map(cat => `
                        <button type="button" 
                                class="category-quick-select p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left ${preselectedCategory === cat.name ? 'border-blue-500 bg-blue-50' : ''}"
                                data-category="${cat.name}">
                            <div class="flex items-center space-x-2">
                                <div class="w-3 h-3 rounded-full" style="background-color: ${cat.color}"></div>
                                <span class="text-sm font-medium">${cat.name}</span>
                            </div>
                        </button>
                    `).join('')}
                </div>

                <input type="hidden" id="quick-category" name="category" value="${preselectedCategory || ''}">
                <input type="hidden" id="quick-color" name="color" value="${COLORS[0].value}">

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button type="button" 
                            class="modal-cancel px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit" 
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                            disabled>
                        Add Task
                    </button>
                </div>
            </form>
        `;

        const modal = this.createModal('Quick Add Task', content);
        this.showModal(modal);

        // Setup quick add handlers
        this.setupQuickAddHandlers(modal, preselectedCategory);

        return modal;
    }

    // Setup quick add form handlers
    setupQuickAddHandlers(modal, preselectedCategory) {
        const form = modal.querySelector('#quick-add-form');
        const titleInput = modal.querySelector('#quick-task-title');
        const categoryInput = modal.querySelector('#quick-category');
        const colorInput = modal.querySelector('#quick-color');
        const submitBtn = form.querySelector('button[type="submit"]');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const categoryButtons = modal.querySelectorAll('.category-quick-select');

        // Focus title input
        setTimeout(() => titleInput.focus(), 100);

        // Category selection
        categoryButtons.forEach(btn => {
            this.dom.addEventListener(btn, 'click', (e) => {
                // Update visual selection
                categoryButtons.forEach(b => {
                    b.classList.remove('border-blue-500', 'bg-blue-50');
                    b.classList.add('border-gray-200');
                });
                
                btn.classList.remove('border-gray-200');
                btn.classList.add('border-blue-500', 'bg-blue-50');
                
                // Update hidden inputs
                categoryInput.value = btn.dataset.category;
                
                // Enable submit if title is filled
                this.updateQuickAddSubmitState(titleInput, categoryInput, submitBtn);
            });
        });

        // Title input validation
        this.dom.addEventListener(titleInput, 'input', () => {
            this.updateQuickAddSubmitState(titleInput, categoryInput, submitBtn);
        });

        // Enter key to submit
        this.dom.addEventListener(titleInput, 'keydown', (e) => {
            if (e.key === 'Enter' && !submitBtn.disabled) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        });

        // Cancel button
        if (cancelBtn) {
            this.dom.addEventListener(cancelBtn, 'click', () => this.hideModal());
        }

        return form;
    }

    // Update quick add submit button state
    updateQuickAddSubmitState(titleInput, categoryInput, submitBtn) {
        const hasTitle = titleInput.value.trim().length > 0;
        const hasCategory = categoryInput.value.length > 0;
        
        submitBtn.disabled = !(hasTitle && hasCategory);
    }

    // Cleanup method
    cleanup() {
        if (this.activeModal) {
            this.hideModal();
        }
        this.dom.cleanup();
    }
}
