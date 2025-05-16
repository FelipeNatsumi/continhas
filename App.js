import React, { useEffect, useState } from "react";
import "./App.css";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

function App() {
  const [champions, setChampions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [ownedChampsByAccount, setOwnedChampsByAccount] = useState({});
  const [newAccountName, setNewAccountName] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);


  // Tema escuro/carregado do localStorage
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

  useEffect(() => {
    // Conecta à coleção "accounts" e escuta mudanças em tempo real
    const unsubscribe = onSnapshot(collection(db, "accounts"), (snapshot) => {
      const loadedAccounts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Extrai apenas os nomes das contas
      const accountNames = loadedAccounts.map((acc) => acc.name);
      setAccounts(accountNames);

      // Monta o objeto com campeões possuídos por conta
      const champsByAccount = {};
      loadedAccounts.forEach((acc) => {
        champsByAccount[acc.name] = acc.ownedChamps || [];
      });
      setOwnedChampsByAccount(champsByAccount);

      // Define a conta selecionada (se nenhuma estiver selecionada)
      if (accountNames.length > 0 && !selectedAccount) {
        setSelectedAccount(accountNames[0]);
      }
    });

    // Cleanup: encerra o listener ao desmontar o componente
    return () => unsubscribe();
  }, [selectedAccount]);

  function addAccount() {
    const trimmed = newAccountName.trim();
    if (!trimmed) return alert("Digite o nome da conta");
    if (accounts.includes(trimmed)) return alert("Conta já existe");
    const newAccounts = [...accounts, trimmed];
    setAccounts(newAccounts);
    setNewAccountName("");
    setSelectedAccount(trimmed);
  }

  function toggleChampion(champId) {
    if (!selectedAccount) {
      alert("Selecione uma conta primeiro");
      return;
    }
    const owned = ownedChampsByAccount[selectedAccount] || [];
    const newOwned = owned.includes(champId)
      ? owned.filter((id) => id !== champId)
      : [...owned, champId];
    setOwnedChampsByAccount({
      ...ownedChampsByAccount,
      [selectedAccount]: newOwned,
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

  function removeAccount(accountToRemove) {
  if (!window.confirm(`Tem certeza que deseja remover a conta "${accountToRemove}"?`)) return;

  const updatedAccounts = accounts.filter((acc) => acc !== accountToRemove);
  const updatedOwnedChamps = { ...ownedChampsByAccount };
  delete updatedOwnedChamps[accountToRemove];

  setAccounts(updatedAccounts);
  setOwnedChampsByAccount(updatedOwnedChamps);

  // Resetar conta selecionada se ela for removida
  if (selectedAccount === accountToRemove) {
    setSelectedAccount(updatedAccounts[0] || "");
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
    borderRadius: "4px",
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

        {/* Botão de alternar tema */}
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
      </header>


      <div style={{
        backgroundColor: isDarkMode ? "#1f1f1f" : "#f9f9f9",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: isDarkMode ? "0 2px 8px rgba(255,255,255,0.05)" : "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "30px",
        maxWidth: "500px"
      }}>
        <h2 style={{ marginTop: 0 }}>Gerenciar Contas</h2>

        {/* Input de nova conta */}
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
              cursor: "pointer"
            }}
          >
            ➕ Adicionar Conta
          </button>
        </div>

        {/* Dropdown de contas */}
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

        {/* Informações da conta selecionada */}
        {selectedAccount && (
          <>
            <p style={{ fontWeight: "bold", margin: "10px 0 5px" }}>
              Campeões possuídos: {getOwnedCount()} / {champions.length}
            </p>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
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
                cursor: "pointer"
              }}
            >
              🗑️ Remover Conta
            </button>
          </>
        )}
      </div>


      {/* Grid de campeões */}
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
                filter: owned ? "none" : "grayscale(100%) brightness(60%)", // preto e branco se não possuir
                overflow: "hidden", // evita que a imagem vaze para fora
                transition: "all 0.3s ease-in-out", // transição suave para tudo
                backgroundColor: isDarkMode ? "#1a1a1a" : "#fff", // fundo escuro ou claro conforme o tema
              }}
              title={owned ? "Você possui este campeão nesta conta" : "Clique para marcar como possuído"}
            >
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.id}_0.jpg`}
                alt={champ.name}
                style={{
                  width: "100%",
                  borderRadius: "8px", // arredondar os cantos da imagem
                  transition: "transform 0.3s ease", // transição suave para o efeito de zoom
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.10)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
