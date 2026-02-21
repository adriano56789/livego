
// Model Audit Agent
// This module provides a utility to verify data consistency within the application's runtime.
// It is intended for manual debugging or development checks and does not run automatically on startup.

import { db } from './database';

export const ModelAuditAgent = {
    /**
     * Checks the integrity of the in-memory database simulation.
     * This ensures that critical collections and initial data are properly seeded.
     */
    run: () => {
        console.groupCollapsed('🕵️‍♂️ Model Audit Agent (Data Integrity Check)');
        
        const checks = [
            { name: 'Users Collection', valid: db.users && db.users.size > 0 },
            { name: 'Streamers Collection', valid: Array.isArray(db.streamers) && db.streamers.length > 0 },
            { name: 'Gifts Catalog', valid: Array.isArray(db.gifts) && db.gifts.length > 0 },
            { name: 'Countries List', valid: Array.isArray(db.countries) && db.countries.length > 0 }
        ];

        let allValid = true;
        checks.forEach(check => {
            if (check.valid) {
                console.log(`%c✔ ${check.name} initialized correctly.`, 'color: #4ade80');
            } else {
                console.warn(`%c❌ ${check.name} appears empty or undefined.`, 'color: #ef4444');
                allValid = false;
            }
        });

        if (allValid) {
            console.log('%c✅ Database Simulation Integrity: PASS', 'color: #4ade80; font-weight: bold;');
        } else {
            console.warn('%c⚠️ Database Simulation Integrity: WARNING - Some collections are empty.', 'color: #fbbf24; font-weight: bold;');
        }

        console.groupEnd();
    }
};
