import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

import { isSuperAdminEmail, resolveEffectiveRole, type UserRole } from "../lib/auth-helpers";

interface AppUser {
  uid: string;
  nome: string;
  email: string;
  role: UserRole;
  status?: string;
  condominioId?: string;
  unidadeId?: string;
  unidadeNome?: string;
}

interface AuthContextType {
  currentUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  appUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const isSuperAdmin = isSuperAdminEmail(user.email, import.meta.env.VITE_SUPERADMIN_EMAIL);

        if (isSuperAdmin) {
          const adminProfile: AppUser = {
            uid: user.uid,
            nome: user.displayName || "Super Admin",
            email: user.email || "wagnertecnoia@gmail.com",
            role: "superadmin"
          };
          setAppUser(adminProfile);
          setLoading(false);

          // Sincroniza e garante no Firestore que o role é superadmin
          try {
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, { ...adminProfile, role: "superadmin" }, { merge: true });
          } catch (e) {
            console.warn("Aviso ao sincronizar doc do admin:", e);
          }
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as AppUser;
            const effectiveRole = resolveEffectiveRole({
              role: data.role,
              email: user.email,
              configuredEnv: import.meta.env.VITE_SUPERADMIN_EMAIL
            });
            setAppUser({ ...data, role: effectiveRole });
          } else {
            setAppUser({
              uid: user.uid,
              nome: user.displayName || "Usuário",
              email: user.email || "",
              role: "pending",
            });
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setAppUser({
            uid: user.uid,
            nome: user.displayName || "Usuário",
            email: user.email || "",
            role: "pending",
          });
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, appUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
