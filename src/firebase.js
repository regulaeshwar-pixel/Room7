import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDv9v9xVRdlIZJpFoT8KCLVOg821UeCi6w",
    authDomain: "flowhouse-a6c5e.firebaseapp.com",
    projectId: "flowhouse-a6c5e",
    storageBucket: "flowhouse-a6c5e.firebasestorage.app",
    messagingSenderId: "557573050778",
    appId: "1:557573050778:web:9b47db0c0b3f10fef12a23"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
