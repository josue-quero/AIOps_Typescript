import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC4XoE2Lv9BxjJPSFjnxGHR9H260V6ymnQ',
  authDomain: 'order-food-d6005.firebaseapp.com',
  databaseURL: 'https://order-food-d6005.firebaseio.com',
  projectId: 'order-food-d6005',
  storageBucket: 'order-food-d6005.appspot.com',
  messagingSenderId: '65681617191',
  appId: '1:65681617191:web:91a8bf8c1e476930903902',
  measurementId: 'G-F32R97KBBW',
};

// Initialize firebase app
const app = initializeApp(firebaseConfig);

// Initialize firebase sercices
const firestore = getFirestore(app);
const auth = getAuth(app);

export { firestore, auth };