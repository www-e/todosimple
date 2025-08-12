import { generateId, sanitizeText } from '../utils/helpers.js';
import { APP_CONFIG, DEFAULT_CATEGORIES, COLORS } from '../utils/constants.js';

// Task model
export class Task {
    constructor({ id = null, title, description = '', category, color = COLORS[0].value, completed = false, createdAt = null, updatedAt = null }) {
        this.id = id || generateId();
        this.title = sanitizeText(title);
        this.description = sanitizeText(description);
        this.category = category;
        this.color = color;
        this.completed = completed;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();
    }

    // Validation
    validate() {
        const errors = [];
        
        if (!this.title || this.title.length === 0) {
            errors.push('Title is required');
        }
        
        if (this.title.length > APP_CONFIG.MAX_TASK_LENGTH) {
            errors.push(`Title must be less than ${APP_CONFIG.MAX_TASK_LENGTH} characters`);
        }
        
        if (!this.category) {
            errors.push('Category is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Update task
    update(updates) {
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                this[key] = updates[key];
            }
        });
        this.updatedAt = new Date().toISOString();
    }

    // Convert to plain object for storage
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            category: this.category,
            color: this.color,
            completed: this.completed,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Create from plain object
    static fromJSON(data) {
        return new Task(data);
    }
}

// Category model
export class Category {
    constructor({ name, color = COLORS[0].value, createdAt = null }) {
        this.name = sanitizeText(name);
        this.color = color;
        this.createdAt = createdAt || new Date().toISOString();
    }

    validate() {
        const errors = [];
        
        if (!this.name || this.name.length === 0) {
            errors.push('Category name is required');
        }
        
        if (this.name.length > APP_CONFIG.MAX_CATEGORY_LENGTH) {
            errors.push(`Category name must be less than ${APP_CONFIG.MAX_CATEGORY_LENGTH} characters`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    toJSON() {
        return {
            name: this.name,
            color: this.color,
            createdAt: this.createdAt
        };
    }

    static fromJSON(data) {
        return new Category(data);
    }
}

// Main App Data Model
export class AppData {
    constructor() {
        this.tasks = [];
        this.categories = DEFAULT_CATEGORIES.map(name => new Category({ name }));
        this.version = APP_CONFIG.VERSION;
        this.lastModified = new Date().toISOString();
    }

    // Get tasks by category
    getTasksByCategory(categoryName) {
        return this.tasks.filter(task => task.category === categoryName);
    }

    // Get categories with task counts
    getCategoriesWithCounts() {
        return this.categories.map(category => ({
            ...category,
            taskCount: this.getTasksByCategory(category.name).length,
            completedCount: this.getTasksByCategory(category.name).filter(t => t.completed).length
        }));
    }

    // Add task
    addTask(taskData) {
        const task = new Task(taskData);
        const validation = task.validate();
        
        if (!validation.isValid) {
            throw new Error(`Invalid task: ${validation.errors.join(', ')}`);
        }
        
        this.tasks.push(task);
        this.lastModified = new Date().toISOString();
        return task;
    }

    // Update task
    updateTask(taskId, updates) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        
        task.update(updates);
        const validation = task.validate();
        
        if (!validation.isValid) {
            throw new Error(`Invalid task update: ${validation.errors.join(', ')}`);
        }
        
        this.lastModified = new Date().toISOString();
        return task;
    }

    // Delete task
    deleteTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index === -1) {
            throw new Error('Task not found');
        }
        
        const deletedTask = this.tasks.splice(index, 1)[0];
        this.lastModified = new Date().toISOString();
        return deletedTask;
    }

    // Add category
    addCategory(categoryData) {
        const category = new Category(categoryData);
        const validation = category.validate();
        
        if (!validation.isValid) {
            throw new Error(`Invalid category: ${validation.errors.join(', ')}`);
        }
        
        // Check for duplicates
        if (this.categories.some(c => c.name === category.name)) {
            throw new Error('Category already exists');
        }
        
        this.categories.push(category);
        this.lastModified = new Date().toISOString();
        return category;
    }

    // Delete category (and all its tasks)
    deleteCategory(categoryName) {
        const categoryIndex = this.categories.findIndex(c => c.name === categoryName);
        if (categoryIndex === -1) {
            throw new Error('Category not found');
        }
        
        // Remove all tasks in this category
        this.tasks = this.tasks.filter(t => t.category !== categoryName);
        
        // Remove the category
        const deletedCategory = this.categories.splice(categoryIndex, 1)[0];
        this.lastModified = new Date().toISOString();
        return deletedCategory;
    }

    // Serialize for storage
    toJSON() {
        return {
            tasks: this.tasks.map(t => t.toJSON()),
            categories: this.categories.map(c => c.toJSON()),
            version: this.version,
            lastModified: this.lastModified
        };
    }

    // Deserialize from storage
    static fromJSON(data) {
        const appData = new AppData();
        
        if (data.tasks) {
            appData.tasks = data.tasks.map(t => Task.fromJSON(t));
        }
        
        if (data.categories) {
            appData.categories = data.categories.map(c => Category.fromJSON(c));
        }
        
        appData.version = data.version || APP_CONFIG.VERSION;
        appData.lastModified = data.lastModified || new Date().toISOString();
        
        return appData;
    }
}
