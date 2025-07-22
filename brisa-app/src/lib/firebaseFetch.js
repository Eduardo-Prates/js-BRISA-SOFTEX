// src/lib/firebaseFetch.js
import { db } from './firebase'; // Seu arquivo de configuração existente
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// ===== HOTSPOTS =====
export async function getHotspots() {
  const hotspotsCol = collection(db, 'hotspots');
  const snapshot = await getDocs(hotspotsCol);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getHotspotById(id) {
  const hotspotRef = doc(db, 'hotspots', id);
  const snapshot = await getDoc(hotspotRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function addHotspot(hotspot) {
  return await addDoc(collection(db, 'hotspots'), {
    ...hotspot,
    createdAt: serverTimestamp()
  });
}

export async function updateHotspot(id, hotspot) {
  const hotspotRef = doc(db, 'hotspots', id);
  return await updateDoc(hotspotRef, {
    ...hotspot,
    updatedAt: serverTimestamp()
  });
}

export async function deleteHotspot(id) {
  const hotspotRef = doc(db, 'hotspots', id);
  return await deleteDoc(hotspotRef);
}

// ===== OFERTAS =====
export async function getOffers() {
  const offersCol = collection(db, 'ofertas');
  const snapshot = await getDocs(offersCol);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getOfferById(id) {
  const offerRef = doc(db, 'ofertas', id);
  const snapshot = await getDoc(offerRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function getOffersByHotspotId(hotspotId) {
  const offersCol = collection(db, 'ofertas');
  const q = query(offersCol, where("hotspotId", "==", hotspotId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function addOffer(offer) {
  return await addDoc(collection(db, 'ofertas'), {
    ...offer,
    createdAt: serverTimestamp()
  });
}

export async function updateOffer(id, offer) {
  const offerRef = doc(db, 'ofertas', id);
  return await updateDoc(offerRef, {
    ...offer,
    updatedAt: serverTimestamp()
  });
}

export async function deleteOffer(id) {
  const offerRef = doc(db, 'ofertas', id);
  return await deleteDoc(offerRef);
}

// ===== USUÁRIOS (baseado em CPF) =====
export async function getUserByCPF(cpf) {
  // Lista de CPFs de administradores
  const adminCPFs = ['12345678900', '00987654321'];
  const isAdmin = adminCPFs.includes(cpf);
  
  // Simula um pequeno atraso para parecer uma consulta real
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    cpf,
    isAdmin,
    // Outros dados para associar ao usuário
  };
}

// ===== CARRINHOS =====
export async function getCarrinhos() {
  const carrinhosCol = collection(db, 'carrinhos');
  const snapshot = await getDocs(carrinhosCol);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getCarrinhoById(id) {
  const carrinhoRef = doc(db, 'carrinhos', id);
  const snapshot = await getDoc(carrinhoRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

// Adicione estas funções no seu arquivo firebaseFetch.js

// ===== LISTENERS EM TEMPO REAL =====
export function listenToCarrinhoById(id, callback) {
  const carrinhoRef = doc(db, 'carrinhos', id);
  return onSnapshot(carrinhoRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Erro ao escutar carrinho:", error);
    callback(null, error);
  });
}

// Listener para ofertas (caso você queira escutar mudanças nas ofertas também)
export function listenToOffers(callback) {
  const offersCol = collection(db, 'ofertas');
  return onSnapshot(offersCol, (snapshot) => {
    const offers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(offers);
  }, (error) => {
    console.error("Erro ao escutar ofertas:", error);
    callback([], error);
  });
}

// Listener para hotspots (caso você queira escutar mudanças nos hotspots também)
export function listenToHotspots(callback) {
  const hotspotsCol = collection(db, 'hotspots');
  return onSnapshot(hotspotsCol, (snapshot) => {
    const hotspots = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(hotspots);
  }, (error) => {
    console.error("Erro ao escutar hotspots:", error);
    callback([], error);
  });
}

export async function updateCarrinhoPosition(id, position) {
  const carrinhoRef = doc(db, 'carrinhos', id);
  return await updateDoc(carrinhoRef, {
    position,
    updatedAt: serverTimestamp()
  });
}

// Função para escutar mudanças na posição do carrinho em tempo real
export function listenToCarrinhoPosition(id, callback) {
  const carrinhoRef = doc(db, 'carrinhos', id);
  return onSnapshot(carrinhoRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      });
    }
  });
}

export async function getCarrinhoByName(nomeCarrinho) {
  const carrinhosCol = collection(db, 'carrinhos');
  const q = query(carrinhosCol, where("nome", "==", nomeCarrinho));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  };
}

// ===== SUPERMERCADOS =====
export async function getSupermercados() {
  const supermercadosCol = collection(db, 'supermercados');
  const snapshot = await getDocs(supermercadosCol);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getSupermercadoById(id) {
  const supermercadoRef = doc(db, 'supermercados', id);
  const snapshot = await getDoc(supermercadoRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}