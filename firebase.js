import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Sua configuração do Firebase (substitua pelas suas credenciais)
const firebaseConfig = {
  apiKey: "AIzaSyC_X9lEDqfGhuC06anFDj_lVMedr2I4LBY",
  authDomain: "continhas-f48d1.firebaseapp.com",
  projectId: "continhas-f48d1",
  storageBucket: "continhas-f48d1.firebasestorage.app",
  messagingSenderId: "897214134148",
  appId: "1:897214134148:web:ddb98c1daaae5476cb4fd1",
  measurementId: "G-6QDFDN9QQN"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Obtém a instância do Firestore
const db = getFirestore(app);

// Exporta a instância do Firestore
export { db };
