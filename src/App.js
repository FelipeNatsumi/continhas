import React, { useEffect, useState } from "react";
import "./App.css";
import Login from "./login";
import { auth } from "./firebaseConfig"; // <-- IMPORTANTE
import { onAuthStateChanged, signOut } from "firebase/auth"; // <-- IMPORTANTE
import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

function App() {
  const [champions, setChampions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [ownedChampsByAccount, setOwnedChampsByAccount] = useState({});
  const [newAccountName, setNewAccountName] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [user, setUser] = useState(null); // <-- NOVO
  const [loading, setLoading] = useState(true); // <-- NOVO
  const [accountDetails, setAccountDetails] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Tema escuro
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe(); // limpa o listener
  }, []);

  // Carregar campeões da API
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
    async function fetchAccountsFromFirestore() {
      try {
        const snapshot = await getDocs(collection(db, "accounts"));
        const accountsList = [];
        const champsData = {};
        const details = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          accountsList.push(docSnap.id);
          champsData[docSnap.id] = data.ownedChamps || [];
          details[docSnap.id] = {
            login: data.login || "",
            password: data.password || ""
          };
        });

        setAccounts(accountsList);
        setOwnedChampsByAccount(champsData);
        setAccountDetails(details);
        if (accountsList.length > 0) setSelectedAccount(accountsList[0]);
      } catch (error) {
        console.error("Erro ao buscar contas do Firestore:", error);
      }
    }

    fetchAccountsFromFirestore();
  }, []);

  // Sincronizar alterações com Firestore
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

  if (loading) return <p>Carregando...</p>;

  if (!user) {
    return <Login onLogin={(user) => setUser(user)} />;
  }

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
      login: "",
      password: "",
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

  async function handleLogout() {
    await signOut(auth);
    setUser(null);
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
    if (
      !window.confirm(
        `Tem certeza que deseja remover a conta "${accountToRemove}"?`
      )
    )
      return;

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

  async function saveLoginPassword() {
    if (!selectedAccount) return;

    const { login, password } = accountDetails[selectedAccount];

    try {
      await updateDoc(doc(db, "accounts", selectedAccount), {
        login,
        password,
      });
      alert("Login e senha salvos com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar login/senha:", err);
      alert("Erro ao salvar login/senha.");
    }
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
    borderRadius: "5px",
    width: "90%"
  };

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

          {/*
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#e53935",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Sair
          </button>
          */}
        </div>
      </header>

    <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
      {/* Box 1 - Gerenciar contas */}
      <div
        style={{
          backgroundColor: isDarkMode ? "#1f1f1f" : "#f9f9f9",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: isDarkMode
            ? "0 2px 8px rgba(255,255,255,0.05)"
            : "0 2px 8px rgba(0,0,0,0.1)",
          maxWidth: "500px",
          flex: 1,
          minWidth: "300px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Gerenciar Contas</h2>

        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            style={{ 
              backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
              color: isDarkMode ? "#ffffff" : "#000000",
              border: "1px solid #ccc",
              padding: "6px",
              borderRadius: "4px",
              flex: 1
            }}
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
            style={{ 
              backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
              color: isDarkMode ? "#ffffff" : "#000000",
              border: "1px solid #ccc",
              padding: "6px",
              borderRadius: "4px",
              width: "100%",
              marginTop: "5px"
            }}
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

    {/* Box 2 - Detalhes da conta */}
    {selectedAccount && (
      <div
        style={{
          backgroundColor: isDarkMode ? "#1f1f1f" : "#f9f9f9",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: isDarkMode
            ? "0 2px 8px rgba(255,255,255,0.05)"
            : "0 2px 8px rgba(0,0,0,0.1)",
          maxWidth: "250px",
          flex: 1,
          minWidth: "100px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Detalhes da Conta</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "15px" }}>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Login:</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={accountDetails[selectedAccount]?.login || ""}
                onChange={(e) =>
                  setAccountDetails((prev) => ({
                    ...prev,
                    [selectedAccount]: {
                      ...prev[selectedAccount],
                      login: e.target.value,
                    },
                  }))
                }
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Digite o login"
              />
            </div>
          </div>

          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Senha:</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={accountDetails[selectedAccount]?.password || ""}
                  onChange={(e) =>
                    setAccountDetails((prev) => ({
                      ...prev,
                      [selectedAccount]: {
                        ...prev[selectedAccount],
                        password: e.target.value,
                      },
                    }))
                  }
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Digite a senha"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    backgroundColor: "#ccc",
                    border: "none",
                    borderRadius: "5px",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? "🙈" : "🐵"}
                </button>
              </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "30px"}}> 
          <button
            onClick={saveLoginPassword}
            style={{
              backgroundColor: "#1976d2",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    )}

  </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
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
                <p style={{ fontSize: "0.85rem", margin: "6px 0" }}>{champ.name}</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default App;