// dropRoutesCollection.js
const mongoose = require('mongoose');

async function dropRoutesCollection() {
    try {
        await mongoose.connect('mongodb+srv://kuluniyalindigamage_db_user:8Nl2AVadkMMB8IHb@cluster0.znq4xzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        
        // Drop the entire routes collection
        await mongoose.connection.db.collection('routes').drop();
        console.log('✅ Routes collection dropped completely');
        
        // Drop any indexes on routes
        try {
            await mongoose.connection.db.collection('routes').dropIndexes();
            console.log('✅ All route indexes dropped');
        } catch (e) {
            console.log('ℹ️ No indexes to drop');
        }
        
        await mongoose.disconnect();
        console.log('🎉 Collection and indexes cleared!');
        
    } catch (error) {
        if (error.message.includes('ns not found')) {
            console.log('ℹ️ Routes collection doesn\'t exist');
        } else {
            console.error('❌ Error:', error);
        }
    }
}

dropRoutesCollection();