import { COLORS } from '../utils/constants.js';
import { formatDate } from '../utils/helpers.js';

// Pure rendering functions for UI components
export class Renderer {
    constructor(domManager) {
        this.dom = domManager;
    }

    // Render main application structure
    renderAppStructure() {
        return `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center h-16">
                            <div class="flex items-center space-x-3">
                                <h1 class="text-2xl font-bold text-gray-900">TaskFlow</h1>
                                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full" id="task-counter">0 tasks</span>
                            </div>
                            <div class="flex items-center space-x-4">
                                <button id="export-btn" class="text-gray-500 hover:text-gray-700 transition-colors">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </button>
                                <button id="add-task-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                    Add Task
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div class="space-y-6" id="categories-container">
                        <!-- Categories will be rendered here -->
                    </div>
                    
                    <!-- Empty state -->
                    <div id="empty-state" class="text-center py-16 hidden">
                        <svg class="mx-auto h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                        <h3 class="mt-4 text-lg font-medium text-gray-900">No tasks yet</h3>
                        <p class="mt-2 text-gray-500">Get started by creating your first task.</p>
                        <button id="empty-add-task-btn" class="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            Create First Task
                        </button>
                    </div>
                </main>

                <!-- Modals will be inserted here -->
                <div id="modal-container"></div>
            </div>
        `;
    }

    // Render category section
    renderCategory(categoryData) {
        const { name, color, taskCount, completedCount, tasks } = categoryData;
        const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden category-section" data-category="${name}">
                <div class="category-header p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" data-category="${name}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-4 h-4 rounded-full" style="background-color: ${color}"></div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">${name}</h3>
                                <p class="text-sm text-gray-500">${taskCount} tasks • ${completedCount} completed</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="text-right">
                                <div class="text-sm font-medium text-gray-600">${completionRate}%</div>
                                <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div class="h-full bg-green-500 transition-all duration-300" style="width: ${completionRate}%"></div>
                                </div>
                            </div>
                            <svg class="w-5 h-5 text-gray-400 transform transition-transform category-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="category-tasks ${taskCount === 0 ? 'hidden' : ''}" data-category="${name}">
                    <div class="p-6 space-y-4">
                        ${tasks.map(task => this.renderTask(task)).join('')}
                    </div>
                </div>
                ${taskCount === 0 ? this.renderEmptyCategory(name) : ''}
            </div>
        `;
    }

    // Render individual task
    renderTask(task) {
        return `
            <div class="task-item group bg-gray-50 rounded-lg p-4 border border-transparent hover:border-gray-200 hover:bg-white transition-all duration-200 ${task.completed ? 'opacity-60' : ''}" 
                 data-task-id="${task.id}">
                <div class="flex items-start space-x-4">
                    <button class="task-checkbox mt-0.5 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors ${task.completed ? 'bg-green-500 border-green-500' : ''}" 
                            data-task-id="${task.id}">
                        ${task.completed ? '<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
                    </button>
                    
                    <div class="flex-1 min-w-0">
                        <h4 class="task-title text-sm font-medium text-gray-900 ${task.completed ? 'line-through' : ''}" data-task-id="${task.id}">
                            ${task.title}
                        </h4>
                        ${task.description ? `<p class="task-description text-sm text-gray-600 mt-1 ${task.completed ? 'line-through' : ''}">${task.description}</p>` : ''}
                        <div class="flex items-center space-x-4 mt-2">
                            <div class="flex items-center space-x-2">
                                <div class="w-3 h-3 rounded-full" style="background-color: ${task.color}"></div>
                                <span class="text-xs text-gray-500">${formatDate(new Date(task.createdAt))}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="edit-task-btn text-gray-400 hover:text-blue-600 transition-colors" data-task-id="${task.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button class="delete-task-btn text-gray-400 hover:text-red-600 transition-colors" data-task-id="${task.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Render empty category state
    renderEmptyCategory(categoryName) {
        return `
            <div class="p-8 text-center border-t border-gray-100">
                <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p class="mt-2 text-sm text-gray-500">No tasks in ${categoryName}</p>
                <button class="add-task-to-category mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium" data-category="${categoryName}">
                    Add first task
                </button>
            </div>
        `;
    }

    // Render color picker
    renderColorPicker(selectedColor = COLORS[0].value) {
        return `
            <div class="color-picker grid grid-cols-4 gap-3">
                ${COLORS.map(color => `
                    <button type="button" 
                            class="color-option w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${selectedColor === color.value ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'}" 
                            style="background-color: ${color.value}"
                            data-color="${color.value}"
                            title="${color.name}">
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Update task counter in header
    updateTaskCounter(totalTasks, completedTasks) {
        const counter = this.dom.$('#task-counter');
        if (counter) {
            counter.textContent = `${totalTasks} tasks`;
            if (completedTasks > 0) {
                counter.textContent += ` • ${completedTasks} done`;
            }
        }
    }

    // Show/hide empty state
    toggleEmptyState(show) {
        const emptyState = this.dom.$('#empty-state');
        const categoriesContainer = this.dom.$('#categories-container');
        
        if (emptyState && categoriesContainer) {
            if (show) {
                emptyState.classList.remove('hidden');
                categoriesContainer.classList.add('hidden');
            } else {
                emptyState.classList.add('hidden');
                categoriesContainer.classList.remove('hidden');
            }
        }
    }
}
