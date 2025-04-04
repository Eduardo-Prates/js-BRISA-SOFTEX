import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getCarrinhos() {
  const snapshot = await getDocs(collection(db, 'carrinhos'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getOfertas() {
  const snapshot = await getDocs(collection(db, 'ofertas'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
