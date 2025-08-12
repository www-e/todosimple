import { AppData } from './models.js';
import { APP_CONFIG } from '../utils/constants.js';

// Local Storage Manager
export class StorageManager {
    constructor() {
        this.storageKey = APP_CONFIG.STORAGE_KEY;
    }

    // Save data to localStorage
    save(appData) {
        try {
            const serializedData = JSON.stringify(appData.toJSON());
            localStorage.setItem(this.storageKey, serializedData);
            return { success: true };
        } catch (error) {
            console.error('Failed to save data:', error);
            return { 
                success: false, 
                error: 'Failed to save data to local storage' 
            };
        }
    }

    // Load data from localStorage
    load() {
        try {
            const serializedData = localStorage.getItem(this.storageKey);
            
            if (!serializedData) {
                // Return new AppData if no saved data exists
                return { success: true, data: new AppData() };
            }

            const parsedData = JSON.parse(serializedData);
            const appData = AppData.fromJSON(parsedData);
            
            return { success: true, data: appData };
        } catch (error) {
            console.error('Failed to load data:', error);
            return { 
                success: false, 
                error: 'Failed to load data from local storage',
                data: new AppData() // Fallback to new data
            };
        }
    }

    // Clear all data
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return { success: true };
        } catch (error) {
            console.error('Failed to clear data:', error);
            return { 
                success: false, 
                error: 'Failed to clear local storage' 
            };
        }
    }

    // Get storage info
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const sizeInBytes = data ? new Blob([data]).size : 0;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            
            return {
                success: true,
                info: {
                    sizeBytes: sizeInBytes,
                    sizeKB: sizeInKB,
                    lastModified: data ? JSON.parse(data).lastModified : null,
                    hasData: !!data
                }
            };
        } catch (error) {
            return { 
                success: false, 
                error: 'Failed to get storage info' 
            };
        }
    }

    // Auto-save functionality
    enableAutoSave(appData, intervalMs = 30000) {
        return setInterval(() => {
            this.save(appData);
        }, intervalMs);
    }

    disableAutoSave(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
        }
    }
}
