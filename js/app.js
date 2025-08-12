import { AppData } from './data/models.js';
import { StorageManager } from './data/storage.js';
import { ExportManager } from './data/export.js';
import { DOMManager } from './ui/dom.js';
import { Renderer } from './ui/render.js';
import { ModalManager } from './ui/modal.js';
import { DEFAULT_CATEGORIES } from './utils/constants.js';

// Main Application Controller
export class TodoApp {
    constructor() {
        this.appData = null;
        this.storage = new StorageManager();
        this.exportManager = new ExportManager();
        this.dom = new DOMManager();
        this.renderer = new Renderer(this.dom);
        this.modal = new ModalManager(this.dom, this.renderer);
        
        this.autoSaveInterval = null;
        this.isInitialized = false;
    }

    // Initialize the application
    async init() {
        try {
            console.log('🚀 Initializing TaskFlow...');
            
            // Load data from storage
            const loadResult = this.storage.load();
            if (loadResult.success) {
                this.appData = loadResult.data;
                console.log('✅ Data loaded successfully');
            } else {
                console.warn('⚠️ Failed to load data:', loadResult.error);
                this.appData = new AppData();
            }

            // Render the application
            this.renderApp();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup auto-save
            this.setupAutoSave();
            
            // Initial render of categories and tasks
            this.renderCategories();
            
            this.isInitialized = true;
            console.log('✅ TaskFlow initialized successfully');
            
            // Show welcome message for new users
            if (this.appData.tasks.length === 0) {
                this.dom.showToast('Welcome to TaskFlow! Start by creating your first task.', 'info', 5000);
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.dom.showToast('Failed to initialize application. Please refresh the page.', 'error');
        }
    }

    // Render the main application structure
    renderApp() {
        const appContainer = this.dom.$('#app') || document.body;
        appContainer.innerHTML = this.renderer.renderAppStructure();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Header buttons
        const addTaskBtn = this.dom.$('#add-task-btn');
        const emptyAddTaskBtn = this.dom.$('#empty-add-task-btn');
        const exportBtn = this.dom.$('#export-btn');

        if (addTaskBtn) {
            this.dom.addEventListener(addTaskBtn, 'click', () => this.handleAddTask());
        }
        
        if (emptyAddTaskBtn) {
            this.dom.addEventListener(emptyAddTaskBtn, 'click', () => this.handleAddTask());
        }
        
        if (exportBtn) {
            this.dom.addEventListener(exportBtn, 'click', () => this.handleExport());
        }

        // Category and task interactions (delegated)
        const categoriesContainer = this.dom.$('#categories-container');
        if (categoriesContainer) {
            this.dom.addEventListener(categoriesContainer, 'click', (e) => this.handleCategoryContainerClick(e));
        }

        // Keyboard shortcuts
        this.dom.addEventListener(document, 'keydown', (e) => this.handleKeyboardShortcuts(e));

        // Auto-save on page unload
        this.dom.addEventListener(window, 'beforeunload', () => this.saveData());
    }

    // Handle delegated clicks within categories container
    handleCategoryContainerClick(e) {
        const target = e.target.closest('button, .category-header');
        if (!target) return;

        // Category header toggle
        if (target.classList.contains('category-header')) {
            this.handleCategoryToggle(target.dataset.category);
            return;
        }

        // Task checkbox
        if (target.classList.contains('task-checkbox')) {
            this.handleTaskToggle(target.dataset.taskId);
            return;
        }

        // Edit task button
        if (target.classList.contains('edit-task-btn')) {
            this.handleEditTask(target.dataset.taskId);
            return;
        }

        // Delete task button
        if (target.classList.contains('delete-task-btn')) {
            this.handleDeleteTask(target.dataset.taskId);
            return;
        }

        // Add task to specific category
        if (target.classList.contains('add-task-to-category')) {
            this.handleAddTask(target.dataset.category);
            return;
        }

        // Task title edit (double-click)
        if (target.classList.contains('task-title')) {
            this.dom.addEventListener(target, 'dblclick', () => {
                this.handleInlineTaskEdit(target.dataset.taskId);
            });
        }
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N for new task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.handleAddTask();
        }

        // Ctrl/Cmd + E for export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.handleExport();
        }
    }

    // Category toggle (expand/collapse)
    handleCategoryToggle(categoryName) {
        const categorySection = this.dom.$(`.category-section[data-category="${categoryName}"]`);
        const tasksContainer = categorySection?.querySelector('.category-tasks');
        const chevron = categorySection?.querySelector('.category-chevron');
        
        if (!tasksContainer || !chevron) return;

        const isExpanded = !tasksContainer.classList.contains('hidden');
        
        if (isExpanded) {
            // Collapse
            this.dom.slideUp(tasksContainer);
            chevron.style.transform = 'rotate(-90deg)';
        } else {
            // Expand
            tasksContainer.classList.remove('hidden');
            this.dom.slideDown(tasksContainer);
            chevron.style.transform = 'rotate(0deg)';
        }
    }

    // Add new task
    async handleAddTask(preselectedCategory = null) {
        const modal = this.modal.showTaskModal(this.appData.categories, null, preselectedCategory);
        const form = modal.querySelector('#task-form');
        
        if (form) {
            this.dom.addEventListener(form, 'submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const taskData = {
                    title: formData.get('title').trim(),
                    description: formData.get('description').trim(),
                    category: formData.get('category'),
                    color: formData.get('color')
                };

                // Validate form
                const validation = this.dom.validateForm(form);
                if (!validation.isValid) {
                    this.dom.showToast('Please fill in all required fields', 'error');
                    return;
                }

                try {
                    // Add task to data model
                    const newTask = this.appData.addTask(taskData);
                    
                    // Save to storage
                    await this.saveData();
                    
                    // Re-render categories
                    this.renderCategories();
                    
                    // Close modal and show success
                    await this.modal.hideModal();
                    this.dom.showToast(`Task "${newTask.title}" added successfully!`, 'success');
                    
                } catch (error) {
                    console.error('Failed to add task:', error);
                    this.dom.showToast('Failed to add task: ' + error.message, 'error');
                }
            });
        }
    }

    // Edit existing task
    async handleEditTask(taskId) {
        const task = this.appData.tasks.find(t => t.id === taskId);
        if (!task) {
            this.dom.showToast('Task not found', 'error');
            return;
        }

        const modal = this.modal.showTaskModal(this.appData.categories, task);
        const form = modal.querySelector('#task-form');
        
        if (form) {
            this.dom.addEventListener(form, 'submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const updates = {
                    title: formData.get('title').trim(),
                    description: formData.get('description').trim(),
                    category: formData.get('category'),
                    color: formData.get('color')
                };

                // Validate form
                const validation = this.dom.validateForm(form);
                if (!validation.isValid) {
                    this.dom.showToast('Please fill in all required fields', 'error');
                    return;
                }

                try {
                    // Update task
                    this.appData.updateTask(taskId, updates);
                    
                    // Save to storage
                    await this.saveData();
                    
                    // Re-render categories
                    this.renderCategories();
                    
                    // Close modal and show success
                    await this.modal.hideModal();
                    this.dom.showToast(`Task "${updates.title}" updated successfully!`, 'success');
                    
                } catch (error) {
                    console.error('Failed to update task:', error);
                    this.dom.showToast('Failed to update task: ' + error.message, 'error');
                }
            });
        }
    }

    // Toggle task completion
    async handleTaskToggle(taskId) {
        try {
            const task = this.appData.tasks.find(t => t.id === taskId);
            if (!task) return;

            // Toggle completion
            this.appData.updateTask(taskId, { completed: !task.completed });
            
            // Save to storage
            await this.saveData();
            
            // Update UI
            this.renderCategories();
            
            // Show feedback
            const message = task.completed ? 
                `Task "${task.title}" marked as completed!` : 
                `Task "${task.title}" marked as pending`;
            this.dom.showToast(message, 'success', 2000);
            
        } catch (error) {
            console.error('Failed to toggle task:', error);
            this.dom.showToast('Failed to update task', 'error');
        }
    }

    // Delete task with confirmation
    async handleDeleteTask(taskId) {
        const task = this.appData.tasks.find(t => t.id === taskId);
        if (!task) return;

        const confirmed = await this.modal.showConfirmModal(
            'Delete Task',
            `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
            'Delete',
            'Cancel',
            'danger'
        );

        if (confirmed) {
            try {
                this.appData.deleteTask(taskId);
                await this.saveData();
                this.renderCategories();
                this.dom.showToast(`Task "${task.title}" deleted successfully`, 'success');
            } catch (error) {
                console.error('Failed to delete task:', error);
                this.dom.showToast('Failed to delete task', 'error');
            }
        }
    }

    // Handle export functionality
    async handleExport() {
        const { modal, form } = this.modal.showExportModal();
        
        this.dom.addEventListener(form, 'submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const format = formData.get('format');
            const filter = formData.get('filter');
            
            // Prepare export options
            const options = {};
            if (filter === 'completed') {
                options.completedOnly = true;
            } else if (filter === 'pending') {
                options.completedOnly = false;
            }

            try {
                // Show loading
                const submitBtn = form.querySelector('button[type="submit"]');
                this.dom.showLoading(submitBtn, 'Exporting...');
                
                // Perform export
                const result = this.exportManager.quickExport(this.appData, format);
                
                if (result.success) {
                    await this.modal.hideModal();
                    this.dom.showToast(`Data exported successfully as ${format.toUpperCase()}`, 'success');
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                console.error('Export failed:', error);
                this.dom.showToast('Export failed: ' + error.message, 'error');
            } finally {
                const submitBtn = form.querySelector('button[type="submit"]');
                this.dom.hideLoading(submitBtn);
            }
        });
    }

    // Render all categories and tasks
    renderCategories() {
        const container = this.dom.$('#categories-container');
        if (!container) return;

        const categoriesWithCounts = this.appData.getCategoriesWithCounts();
        const totalTasks = this.appData.tasks.length;
        const completedTasks = this.appData.tasks.filter(t => t.completed).length;

        // Update task counter
        this.renderer.updateTaskCounter(totalTasks, completedTasks);

        // Show/hide empty state
        if (totalTasks === 0) {
            this.renderer.toggleEmptyState(true);
            return;
        } else {
            this.renderer.toggleEmptyState(false);
        }

        // Render categories
        const categoriesHTML = categoriesWithCounts.map(category => {
            const categoryTasks = this.appData.getTasksByCategory(category.name);
            return this.renderer.renderCategory({
                ...category,
                tasks: categoryTasks
            });
        }).join('');

        container.innerHTML = categoriesHTML;
    }

    // Save data to storage
    async saveData() {
        try {
            const result = this.storage.save(this.appData);
            if (!result.success) {
                console.error('Failed to save data:', result.error);
                this.dom.showToast('Failed to save data', 'error');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Save error:', error);
            this.dom.showToast('Failed to save data', 'error');
            return false;
        }
    }

    // Setup auto-save functionality
    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = this.storage.enableAutoSave(this.appData, 30000);
        console.log('✅ Auto-save enabled');
    }

    // Inline task title editing
    handleInlineTaskEdit(taskId) {
        const task = this.appData.tasks.find(t => t.id === taskId);
        if (!task) return;

        const titleElement = this.dom.$(`.task-title[data-task-id="${taskId}"]`);
        if (!titleElement) return;

        const originalTitle = task.title;
        const input = this.dom.createElement('input', {
            classes: ['w-full', 'text-sm', 'font-medium', 'bg-transparent', 'border-0', 'outline-0', 'ring-2', 'ring-blue-500', 'rounded', 'px-2', 'py-1'],
            attributes: { 
                type: 'text', 
                value: originalTitle,
                maxlength: '200'
            }
        });

        titleElement.replaceWith(input);
        input.focus();
        input.select();

        const saveEdit = async () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== originalTitle) {
                try {
                    this.appData.updateTask(taskId, { title: newTitle });
                    await this.saveData();
                    this.dom.showToast('Task updated', 'success', 1500);
                } catch (error) {
                    this.dom.showToast('Failed to update task', 'error');
                }
            }
            this.renderCategories();
        };

        const cancelEdit = () => {
            this.renderCategories();
        };

        // Save on Enter, cancel on Escape
        this.dom.addEventListener(input, 'keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });

        // Save on blur
        this.dom.addEventListener(input, 'blur', saveEdit);
    }

    // Get application statistics
    getStats() {
        const total = this.appData.tasks.length;
        const completed = this.appData.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const categories = this.appData.categories.length;
        
        return {
            total,
            completed,
            pending,
            categories,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    // Cleanup resources
    cleanup() {
        console.log('🧹 Cleaning up TaskFlow...');
        
        if (this.autoSaveInterval) {
            this.storage.disableAutoSave(this.autoSaveInterval);
        }
        
        this.dom.cleanup();
        this.modal.cleanup();
        
        console.log('✅ Cleanup completed');
    }

    // Error boundary
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        this.dom.showToast('An unexpected error occurred. Please try again.', 'error');
        
        // Optionally send error to monitoring service
        // this.reportError(error, context);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.todoApp = new TodoApp();
    
    try {
        await window.todoApp.init();
    } catch (error) {
        console.error('Failed to start TaskFlow:', error);
        document.body.innerHTML = `
            <div class="min-h-screen bg-gray-50 flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-gray-900 mb-4">Failed to Load TaskFlow</h1>
                    <p class="text-gray-600 mb-4">Please refresh the page and try again.</p>
                    <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.todoApp) {
        window.todoApp.cleanup();
    }
});
