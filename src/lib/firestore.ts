import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// ============================================================================
// Helpers locais
// ============================================================================

/**
 * Gera um código aleatório alfanumérico curto (8 caracteres, A-Z e 2-9).
 * Exclui caracteres ambíguos (0, O, 1, I, L) para facilitar leitura em QR Codes
 * e digitação manual.
 */
export const generateInviteCode = (length: number = 8): string => {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return code;
};

// ============================================================================
// Coleção: condominios
// ============================================================================

export const getCondominios = async () => {
  const q = query(collection(db, "condominios"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getCondominio = async (condominioId: string) => {
  const ref = doc(db, "condominios", condominioId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
};

/**
 * Busca um condomínio a partir de UM dos seus códigos de convite.
 * Aceita tanto o código de síndica quanto o de morador.
 * Retorna também qual código bateu, para que o chamador saiba
 * qual papel o visitante deve receber.
 */
export const getCondominioByInviteCode = async (codigoConvite: string) => {
  if (!codigoConvite) return null;
  const upper = codigoConvite.toUpperCase().trim();

  // Tenta primeiro como código de síndica
  let q = query(
    collection(db, "condominios"),
    where("codigoConviteSindica", "==", upper)
  );
  let snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data(), matchedRole: "sindica" as const };
  }

  // Depois como código de morador
  q = query(
    collection(db, "condominios"),
    where("codigoConviteMorador", "==", upper)
  );
  snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data(), matchedRole: "morador" as const };
  }

  return null;
};

/**
 * Cria um novo condomínio com DOIS códigos de convite independentes:
 *  - codigoConviteSindica   (para a síndica se auto-cadastrar)
 *  - codigoConviteMorador   (para os moradores se auto-cadastrarem)
 *
 * Recebe um objeto com: nome, cnpj, sindicaEmail, sindicaNome.
 * Não cria a conta Auth da síndica — ela se cadastra via link (Opção C).
 */
export const createCondominio = async (data: {
  nome: string;
  cnpj?: string;
  sindicaEmail: string;
  sindicaNome: string;
}) => {
  const payload = {
    nome: data.nome,
    cnpj: data.cnpj || "",
    sindicaEmail: data.sindicaEmail,
    sindicaNome: data.sindicaNome,
    codigoConviteSindica: generateInviteCode(8),
    codigoConviteMorador: generateInviteCode(8),
    ativo: true,
    createdAt: new Date(),
  };

  const docRef = await addDoc(collection(db, "condominios"), payload);
  return { id: docRef.id, ...payload };
};

/**
 * Atualiza dados do condomínio (ex.: rotação de códigos, troca de síndica).
 */
export const updateCondominio = async (
  condominioId: string,
  data: Partial<{
    nome: string;
    cnpj: string;
    sindicaEmail: string;
    sindicaNome: string;
    sindicaUid: string;
    codigoConviteSindica: string;
    codigoConviteMorador: string;
    ativo: boolean;
  }>
) => {
  const ref = doc(db, "condominios", condominioId);
  await updateDoc(ref, { ...data, updatedAt: new Date() });
};

/**
 * Rotaciona (regenera) um dos códigos de convite do condomínio.
 *  - kind: "sindica" | "morador"
 */
export const rotateInviteCode = async (
  condominioId: string,
  kind: "sindica" | "morador"
) => {
  const field = kind === "sindica" ? "codigoConviteSindica" : "codigoConviteMorador";
  const newCode = generateInviteCode(8);
  await updateCondominio(condominioId, { [field]: newCode } as any);
  return newCode;
};

/**
 * Cria a conta de acesso da Síndica no Firebase Auth e Firestore
 * utilizando uma instância secundária em memória (preserva a sessão do Super Admin).
 */
export const createSindicaUser = async ({
  email,
  password,
  nome,
  condominioId,
}: {
  email: string;
  password: string;
  nome: string;
  condominioId: string;
}) => {
  const { initializeApp, deleteApp } = await import("firebase/app");
  const { getAuth, createUserWithEmailAndPassword, signOut } = await import("firebase/auth");
  const { firebaseConfig } = await import("./firebase");

  const appName = `sindica-creator-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, appName);
  const tempAuth = getAuth(tempApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    const uid = userCredential.user.uid;
    await signOut(tempAuth);
    await deleteApp(tempApp);

    // Grava perfil no Firestore usando a sessão do Super Admin
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, {
      uid,
      nome,
      email,
      role: "sindica",
      condominioId,
      createdAt: new Date(),
    });

    // Vincula a síndica ao condomínio
    await updateCondominio(condominioId, { sindicaUid: uid });

    return { uid, email, nome };
  } catch (error) {
    try {
      await deleteApp(tempApp);
    } catch {}
    throw error;
  }
};

// ============================================================================
// Coleção: condominios/{condoId}/unidades
// ============================================================================

export const getUnidades = async (condominioId: string) => {
  const q = query(collection(db, `condominios/${condominioId}/unidades`));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
};

export const createUnidadesEmLote = async (condominioId: string, unidades: any[]) => {
  // Para MVP simplificado sem batch (pode ser aprimorado depois para writeBatch)
  const promessas = unidades.map(u =>
    addDoc(collection(db, `condominios/${condominioId}/unidades`), u)
  );
  await Promise.all(promessas);
};

export const createUnidade = async (condominioId: string, unidade: { torre?: string; andar?: number; numero: string }) => {
  const docRef = await addDoc(collection(db, `condominios/${condominioId}/unidades`), {
    ...unidade,
    createdAt: new Date(),
  });
  return { id: docRef.id, ...unidade };
};

// ============================================================================
// Coleção: ocorrencias
// ============================================================================

export const getOcorrencias = async (condominioId: string, role: string, unidadeId?: string) => {
  let q;
  if (role === 'sindica' || role === 'zelador' || role === 'superadmin') {
    // Admin vê todas do condomínio
    q = query(collection(db, "ocorrencias"), where("condominioId", "==", condominioId));
  } else if (role === 'morador' && unidadeId) {
    // Morador vê apenas da sua unidade
    q = query(collection(db, "ocorrencias"), where("condominioId", "==", condominioId), where("unidadeId", "==", unidadeId));
  } else {
    return [];
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
};

export const createOcorrencia = async (data: any) => {
  const docRef = await addDoc(collection(db, "ocorrencias"), {
    ...data,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateOcorrenciaStatus = async (id: string, status: string) => {
  const ref = doc(db, "ocorrencias", id);
  await updateDoc(ref, { status });
};

// ============================================================================
// Coleção: users
// ============================================================================

export const getPendingUsers = async (condominioId: string) => {
  const q = query(
    collection(db, "users"),
    where("condominioId", "==", condominioId),
    where("role", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
};

export const approveUser = async (uid: string) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { role: "morador" });
};

export const rejectUser = async (uid: string) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { role: "rejected" });
};

export const getActiveUsers = async (condominioId: string) => {
  const q = query(
    collection(db, "users"),
    where("condominioId", "==", condominioId),
    where("role", "==", "morador")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
};

export const getUser = async (uid: string) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) };
};
