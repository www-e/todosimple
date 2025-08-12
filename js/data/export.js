import { AppData, Task, Category } from './models.js';
import { formatDate } from '../utils/helpers.js';

// Export/Import Manager
export class ExportManager {
    constructor() {
        this.supportedFormats = ['json', 'csv'];
    }

    // Export data in JSON format
    exportJSON(appData, options = {}) {
        try {
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: appData.version,
                    totalTasks: appData.tasks.length,
                    totalCategories: appData.categories.length
                },
                data: appData.toJSON()
            };

            // Apply filters if specified
            if (options.categoryFilter) {
                exportData.data.tasks = exportData.data.tasks.filter(
                    task => task.category === options.categoryFilter
                );
            }

            if (options.completedOnly !== undefined) {
                exportData.data.tasks = exportData.data.tasks.filter(
                    task => task.completed === options.completedOnly
                );
            }

            const jsonString = JSON.stringify(exportData, null, 2);
            return { success: true, data: jsonString, format: 'json' };
        } catch (error) {
            return { 
                success: false, 
                error: 'Failed to export JSON data: ' + error.message 
            };
        }
    }

    // Export data in CSV format
    exportCSV(appData, options = {}) {
        try {
            let tasks = appData.tasks;

            // Apply filters
            if (options.categoryFilter) {
                tasks = tasks.filter(task => task.category === options.categoryFilter);
            }

            if (options.completedOnly !== undefined) {
                tasks = tasks.filter(task => task.completed === options.completedOnly);
            }

            // CSV headers
            const headers = ['ID', 'Title', 'Description', 'Category', 'Color', 'Completed', 'Created Date', 'Updated Date'];
            
            // Convert tasks to CSV rows
            const rows = tasks.map(task => [
                task.id,
                this.escapeCSV(task.title),
                this.escapeCSV(task.description),
                task.category,
                task.color,
                task.completed ? 'Yes' : 'No',
                formatDate(new Date(task.createdAt)),
                formatDate(new Date(task.updatedAt))
            ]);

            const csvContent = [headers, ...rows]
                .map(row => row.join(','))
                .join('\n');

            return { success: true, data: csvContent, format: 'csv' };
        } catch (error) {
            return { 
                success: false, 
                error: 'Failed to export CSV data: ' + error.message 
            };
        }
    }

    // Helper method to escape CSV values
    escapeCSV(value) {
        if (typeof value !== 'string') return value;
        
        // If value contains comma, newline, or quote, wrap in quotes and escape existing quotes
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    // Download exported data
    downloadFile(data, filename, format) {
        try {
            const mimeTypes = {
                json: 'application/json',
                csv: 'text/csv'
            };

            const blob = new Blob([data], { type: mimeTypes[format] });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: 'Failed to download file: ' + error.message 
            };
        }
    }

    // Generate filename with timestamp
    generateFilename(appData, format, prefix = 'todoapp') {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const taskCount = appData.tasks.length;
        return `${prefix}_${timestamp}_${taskCount}tasks.${format}`;
    }

    // Import JSON data
    importJSON(jsonString) {
        try {
            const importData = JSON.parse(jsonString);
            
            // Validate import data structure
            if (!importData.data || !Array.isArray(importData.data.tasks)) {
                throw new Error('Invalid import data structure');
            }

            const appData = AppData.fromJSON(importData.data);
            
            return { 
                success: true, 
                data: appData,
                metadata: importData.metadata || {}
            };
        } catch (error) {
            return { 
                success: false, 
                error: 'Failed to import JSON data: ' + error.message 
            };
        }
    }

    // Import CSV data
    importCSV(csvString) {
        try {
            const lines = csvString.trim().split('\n');
            if (lines.length < 2) {
                throw new Error('CSV file must have headers and at least one data row');
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const appData = new AppData();
            
            // Clear default categories to avoid duplicates
            appData.categories = [];
            const categorySet = new Set();

            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVRow(lines[i]);
                
                if (values.length >= 6) {
                    const [id, title, description, category, color, completed] = values;
                    
                    // Add category if not exists
                    if (!categorySet.has(category)) {
                        appData.categories.push(new Category({ name: category }));
                        categorySet.add(category);
                    }

                    // Create task
                    const task = new Task({
                        id: id || undefined,
                        title: title,
                        description: description || '',
                        category: category,
                        color: color || '#3B82F6',
                        completed: completed.toLowerCase() === 'yes' || completed.toLowerCase() === 'true'
                    });

                    appData.tasks.push(task);
                }
            }

            return { success: true, data: appData };
        } catch (error) {
            return { 
                success: false, 
                error: 'Failed to import CSV data: ' + error.message 
            };
        }
    }

    // Parse CSV row handling quoted values
    parseCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                if (inQuotes && row[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last field
        result.push(current.trim());
        return result;
    }

    // Quick export with default settings
    quickExport(appData, format = 'json') {
        const filename = this.generateFilename(appData, format);
        
        let exportResult;
        if (format === 'json') {
            exportResult = this.exportJSON(appData);
        } else if (format === 'csv') {
            exportResult = this.exportCSV(appData);
        } else {
            return { success: false, error: 'Unsupported format' };
        }

        if (exportResult.success) {
            return this.downloadFile(exportResult.data, filename, format);
        }
        
        return exportResult;
    }
}
