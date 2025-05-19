import React, { useEffect, useState } from "react";
import "./App.css";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from "firebase/auth";
import { db, auth } from "./firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

function App() {
  const [champions, setChampions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [ownedChampsByAccount, setOwnedChampsByAccount] = useState({});
  const [newAccountName, setNewAccountName] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [user, setUser] = useState(null);

  // Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Tema escuro
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Carregar campeões
  useEffect(() => {
    fetch(
      "https://ddragon.leagueoflegends.com/cdn/13.12.1/data/en_US/champion.json"
    )
      .then((res) => res.json())
      .then((data) => {
        const champsArray = Object.values(data.data);
        setChampions(champsArray);
      })
      .catch((err) => console.error(err));
  }, []);

  // Carregar contas e dados do Firestore
  useEffect(() => {
    if (!user) return;

    async function fetchAccountsFromFirestore() {
      try {
        const snapshot = await getDocs(collection(db, "accounts"));
        const accountsList = [];
        const champsData = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          accountsList.push(docSnap.id);
          champsData[docSnap.id] = data.ownedChamps || [];
        });

        setAccounts(accountsList);
        setOwnedChampsByAccount(champsData);
        if (accountsList.length > 0) setSelectedAccount(accountsList[0]);
      } catch (error) {
        console.error("Erro ao buscar contas do Firestore:", error);
      }
    }

    fetchAccountsFromFirestore();
  }, [user]);

  // Sincronizar alterações
  useEffect(() => {
    async function syncToFirestore() {
      try {
        for (const account of accounts) {
          const owned = ownedChampsByAccount[account] || [];
          await setDoc(
            doc(db, "accounts", account),
            { ownedChamps: owned },
            { merge: true }
          );
        }
      } catch (error) {
        console.error("Erro ao sincronizar com Firestore:", error);
      }
    }

    if (accounts.length > 0) {
      syncToFirestore();
    }
  }, [accounts, ownedChampsByAccount]);

  async function addAccount() {
    const trimmed = newAccountName.trim();
    if (!trimmed) return alert("Digite o nome da conta");
    if (accounts.includes(trimmed)) return alert("Conta já existe");

    const newAccounts = [...accounts, trimmed];
    setAccounts(newAccounts);
    setOwnedChampsByAccount({ ...ownedChampsByAccount, [trimmed]: [] });
    setNewAccountName("");
    setSelectedAccount(trimmed);

    await setDoc(doc(db, "accounts", trimmed), {
      ownedChamps: [],
    });
  }

  async function toggleChampion(champId) {
    if (!selectedAccount) {
      alert("Selecione uma conta primeiro");
      return;
    }

    const owned = ownedChampsByAccount[selectedAccount] || [];
    const newOwned = owned.includes(champId)
      ? owned.filter((id) => id !== champId)
      : [...owned, champId];

    const updated = {
      ...ownedChampsByAccount,
      [selectedAccount]: newOwned,
    };
    setOwnedChampsByAccount(updated);

    await updateDoc(doc(db, "accounts", selectedAccount), {
      ownedChamps: newOwned,
    });
  }

  function isOwned(champId) {
    if (!selectedAccount) return false;
    const owned = ownedChampsByAccount[selectedAccount] || [];
    return owned.includes(champId);
  }

  function getOwnedCount() {
    if (!selectedAccount) return 0;
    return (ownedChampsByAccount[selectedAccount] || []).length;
  }

  async function removeAccount(accountToRemove) {
    if (!window.confirm(`Tem certeza que deseja remover a conta "${accountToRemove}"?`)) return;

    const updatedAccounts = accounts.filter((acc) => acc !== accountToRemove);
    const updatedOwnedChamps = { ...ownedChampsByAccount };
    delete updatedOwnedChamps[accountToRemove];

    setAccounts(updatedAccounts);
    setOwnedChampsByAccount(updatedOwnedChamps);

    if (selectedAccount === accountToRemove) {
      setSelectedAccount(updatedAccounts[0] || "");
    }

    await deleteDoc(doc(db, "accounts", accountToRemove));
  }

  const appStyle = {
    backgroundColor: isDarkMode ? "#121212" : "#ffffff",
    color: isDarkMode ? "#ffffff" : "#1a1a1a",
    minHeight: "100vh",
    padding: "20px",
    transition: "all 0.3s ease",
    fontFamily: "Segoe UI, Roboto, sans-serif",
  };

  const inputStyle = {
    backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
    color: isDarkMode ? "#ffffff" : "#000000",
    border: "1px solid #ccc",
    padding: "6px",
    borderRadius: "4px",
  };

  if (!user) {
    return (
      <div style={appStyle}>
        <header style={{ display: "flex", justifyContent: "space-between", padding: "10px 20px" }}>
          <h1>🎮 Continhas</h1>
          <button className="google-login-btn" onClick={login} aria-label="Login com Google">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 533.5 544.3"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="#4285f4"
                d="M533.5 278.4c0-18.8-1.5-37-4.4-54.6H272v103.3h146.9c-6.4 34.5-25.7 63.7-54.6 83.3v68h88.4c51.6-47.6 81.8-117.6 81.8-199.9z"
              />
              <path
                fill="#34a853"
                d="M272 544.3c73.5 0 135.3-24.3 180.4-65.9l-88.4-68c-24.5 16.4-55.7 26-92 26-70.7 0-130.7-47.7-152.2-111.5H29.6v69.9c45.2 89.3 137.4 149.5 242.4 149.5z"
              />
              <path
                fill="#fbbc04"
                d="M119.8 322.9c-10.7-32-10.7-66.5 0-98.5v-69.9H29.6c-38.9 76.6-38.9 167.7 0 244.3l90.2-75.9z"
              />
              <path
                fill="#ea4335"
                d="M272 107.7c39.9 0 75.7 13.7 103.9 40.6l77.9-77.9C406.9 24.3 345 0 272 0 167 0 74.8 60.2 29.6 149.5l90.2 75.9c21.5-63.8 81.5-111.5 152.2-111.5z"
              />
            </svg>
            Login com Google
          </button>
        </header>
        <p style={{ textAlign: "center", marginTop: "50px" }}>Faça login para acessar suas contas.</p>
      </div>
    );
  }

  return (
    <div style={appStyle}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: isDarkMode ? "#1f1f1f" : "#f0f0f0",
          borderRadius: "8px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0 }}>🎮 Continhas</h1>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span>{user.displayName}</span>
          <button onClick={logout}>🚪 Sair</button>
          <div
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              cursor: "pointer",
              fontSize: "24px",
              transition: "transform 0.2s",
            }}
            title="Alternar tema"
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isDarkMode ? "🌙" : "☀️"}
          </div>
        </div>
      </header>

      <div
        style={{
          backgroundColor: isDarkMode ? "#1f1f1f" : "#f9f9f9",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: isDarkMode
            ? "0 2px 8px rgba(255,255,255,0.05)"
            : "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "30px",
          maxWidth: "500px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Gerenciar Contas</h2>

        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Nome da nova conta"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
          />
          <button
            onClick={addAccount}
            style={{
              backgroundColor: "#4caf50",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ➕ Adicionar Conta
          </button>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ fontWeight: "bold" }}>Conta selecionada:</label>
          <select
            style={{ ...inputStyle, width: "100%", marginTop: "5px" }}
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="">-- Selecione uma conta --</option>
            {accounts.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>
        </div>

        {selectedAccount && (
          <>
            <p style={{ fontWeight: "bold", margin: "10px 0 5px" }}>
              Campeões possuídos: {getOwnedCount()} / {champions.length}
            </p>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <input
                type="checkbox"
                checked={showOnlyOwned}
                onChange={(e) => setShowOnlyOwned(e.target.checked)}
              />
              Mostrar apenas possuídos
            </label>

            <button
              onClick={() => removeAccount(selectedAccount)}
              style={{
                backgroundColor: "#e53935",
                color: "white",
                padding: "6px 12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🗑️ Remover Conta
            </button>
          </>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
        }}
      >
        {champions
          .filter((champ) => !showOnlyOwned || isOwned(champ.id))
          .map((champ) => {
            const owned = isOwned(champ.id);
            return (
              <div
                key={champ.id}
                onClick={() => toggleChampion(champ.id)}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  filter: owned
                    ? "none"
                    : "grayscale(100%) brightness(60%)",
                  overflow: "hidden",
                  transition: "all 0.3s ease-in-out",
                  backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
                }}
                title={
                  owned
                    ? "Você possui este campeão nesta conta"
                    : "Clique para marcar como possuído"
                }
              >
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.id}_0.jpg`}
                  alt={champ.name}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "scale(1.10)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
                <p>{champ.name}</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default App;

