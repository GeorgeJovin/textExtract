
import { initializeApp, } from "firebase/app";
import { initializeAuth, getReactNativePersistence  } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyAprAj29KoFipgrNfRqbQCQT6KtbAA_B80",
    authDomain: "react-native-e1d39.firebaseapp.com",
    projectId: "react-native-e1d39",
    storageBucket: "react-native-e1d39.appspot.com",
    messagingSenderId: "711978634547",
    appId: "1:711978634547:web:a58b838c1faed6bf224246",
    measurementId: "G-ZXG00T8ZM3"
  };

const app = initializeApp(firebaseConfig);

initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});


export default app;