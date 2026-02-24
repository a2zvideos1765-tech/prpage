import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
        });
    } catch (error) {
        console.error('Firebase admin initialization error', error.stack);
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore(); // if we ever need it, though we use sqlite
