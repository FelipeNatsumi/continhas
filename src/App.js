import React, { useEffect, useState } from "react";
import "./App.css";
import Login from "./login";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import Select from "react-select";

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
  const [isEditingAccountName, setIsEditingAccountName] = useState(false);
  const [editedAccountName, setEditedAccountName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const championsByRole = {
    top: [
      "Aatrox",
      "Akali",
      "Camille",
      "Chogath",
      "Darius",
      "Fiora",
      "DrMundo",
      "Gangplank",
      "Garen",
      "Gnar",
      "Gragas",
      "Gwen",
      "Heimerdinger",
      "Illaoi",
      "Irelia",
      "Jax",
      "Jayce",
      "Kayle",
      "Kennen",
      "Kled",
      "KSante",
      "Malphite",
      "Maokai",
      "Wukong",
      "Mordekaiser",
      "Nasus",
      "Olaf",
      "Ornn",
      "Pantheon",
      "Poppy",
      "Quinn",
      "Renekton",
      "Riven",
      "Rumble",
      "Sett",
      "Shen",
      "Singed",
      "Sion",
      "TahmKench",
      "Teemo",
      "Trundle",
      "Tryndamere",
      "Urgot",
      "Vladimir",
      "Volibear",
      "Warwick",
      "Yorick",
      "Zac",
      "Yone",
    ],
    jungle: [
      "Amumu",
      "Belveth",
      "Diana",
      "Ekko",
      "Elise",
      "Evelynn",
      "Fiddlesticks",
      "Graves",
      "Hecarim",
      "Ivern",
      "JarvanIV",
      "Jax",
      "Kayn",
      "Khazix",
      "Karthus",
      "Kindred",
      "LeeSin",
      "Lillia",
      "MasterYi",
      "Wukong",
      "Nidalee",
      "Nocturne",
      "Nunu",
      "Qiyana",
      "Rammus",
      "RekSai",
      "Rengar",
      "Sejuani",
      "Shaco",
      "Shyvana",
      "Skarner",
      "Talon",
      "Taliyah",
      "Trundle",
      "Udyr",
      "Vi",
      "Viego",
      "Volibear",
      "Warwick",
      "XinZhao",
      "Zac",
    ],
    mid: [
      "Ahri",
      "Akali",
      "Akshan",
      "Anivia",
      "Annie",
      "AurelionSol",
      "Azir",
      "Cassiopeia",
      "Diana",
      "Ekko",
      "Fizz",
      "Galio",
      "Heimerdinger",
      "Irelia",
      "Jayce",
      "Kassadin",
      "Katarina",
      "Leblanc",
      "Lissandra",
      "Lux",
      "Malzahar",
      "Morgana",
      "Orianna",
      "Qiyana",
      "Ryze",
      "Swain",
      "Sylas",
      "Syndra",
      "Taliyah",
      "Talon",
      "TwistedFate",
      "Veigar",
      "Vex",
      "Viktor",
      "Vladimir",
      "Xerath",
      "Yasuo",
      "Yone",
      "Zed",
      "Ziggs",
      "Zoe",
    ],
    marksman: [
      "Aphelios",
      "Ashe",
      "Caitlyn",
      "Corki",
      "Draven",
      "Ezreal",
      "Jhin",
      "Jinx",
      "Kaisa",
      "Kalista",
      "KogMaw",
      "Lucian",
      "MissFortune",
      "Nilah",
      "Samira",
      "Senna",
      "Sivir",
      "Tristana",
      "Twitch",
      "Varus",
      "Vayne",
      "Xayah",
      "Zeri",
      "Ziggs",
    ],
    support: [
      "Alistar",
      "Ashe",
      "Bard",
      "Blitzcrank",
      "Brand",
      "Braum",
      "Elise",
      "Janna",
      "Karma",
      "Leona",
      "Lulu",
      "Lux",
      "Maokai",
      "Milio",
      "Morgana",
      "Nami",
      "Nautilus",
      "Neeko",
      "Poppy",
      "Pyke",
      "Rakan",
      "Rell",
      "Renata",
      "Senna",
      "Seraphine",
      "Sona",
      "Soraka",
      "TahmKench",
      "Taric",
      "Thresh",
      "Velkoz",
      "Xerath",
      "Yuumi",
      "Zilean",
      "Zyra",
    ],
  };
  const [selectedQueue, setSelectedQueue] = useState("Solo/Duo");
  const [eloDataByAccount, setEloDataByAccount] = useState({});
  const [selectedTierFilter, setSelectedTierFilter] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [showFilteredAccounts, setShowFilteredAccounts] = useState(false);
  const rankOptions = [
    { value: "", label: "Choose a rank" },
    ...["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"].map((tier) => ({
      value: tier,
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img
            src={`/emblems/${tier}.webp`}
            alt={tier}
            style={{ width: "20px", height: "20px", objectFit: "contain" }}
          />
          <span style={{ textTransform: "capitalize" }}>{tier}</span>
        </div>
      ),
    })),
  ];

  function getQueueKey(queueLabel) {
    return queueLabel === "Flex" ? "flex" : "soloDuo";
  }

  function getQueueName(queueLabel) {
    return queueLabel === "Flex" ? "flex" : "soloDuo";
  }

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

  // Carregar campeões da versão mais recente da Riot
  useEffect(() => {
    const fetchChampions = async () => {
      try {
        // Passo 1: buscar a versão mais recente
        const versionRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await versionRes.json();
        const latestVersion = versions[0];

        // Passo 2: buscar os campeões usando a versão correta
        const champsRes = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
        );
        const champsData = await champsRes.json();
        const champsArray = Object.values(champsData.data);
        setChampions(champsArray);
      } catch (err) {
        console.error("Erro ao carregar campeões:", err);
      }
    };

    fetchChampions();
  }, []);


  // Carregar contas e dados do Firestore
  useEffect(() => {
    async function fetchAccountsFromFirestore() {
      try {
        const snapshot = await getDocs(collection(db, "accounts"));
        const accountsList = [];
        const champsData = {};
        const details = {};
        const eloData = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          accountsList.push(docSnap.id);
          champsData[docSnap.id] = data.ownedChamps || [];
          details[docSnap.id] = {
            login: data.login || "",
            password: data.password || "",
          };
          eloData[docSnap.id] = data.ranked || {
            soloDuo: {
              tier: "",
              division: "",
              wins: 0,
              losses: 0,
              queue: "soloDUO",
            },
            flex: {
              tier: "",
              division: "",
              wins: 0,
              losses: 0,
              queue: "flex",
            }
          };
        });

        setAccounts(accountsList);
        setOwnedChampsByAccount(champsData);
        setAccountDetails(details);
        setEloDataByAccount(eloData);
        setSelectedAccount("");
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
            {
              ownedChamps: owned,
              ranked: eloDataByAccount[account] || {},
            },
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
  }, [accounts, ownedChampsByAccount, eloDataByAccount]);

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

  async function atualizarEloAutomaticamente() {
    try {
      if (!selectedAccount.includes("#")) {
        return alert("Conta selecionada deve estar no formato nome#tag.");
      }

      const [gameName, tagLine] = selectedAccount.split("#");
      if (!gameName || !tagLine) {
        return alert("Formato inválido. Use nome#tag.");
      }

      const response = await fetch(`/api/getRankedData?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`);

      const text = await response.text(); // Lê a resposta como texto bruto (JSON ou erro HTML)

      try {
        const { rankedData } = JSON.parse(text); // Agora tenta converter em JSON
        const soloDuo = rankedData.find(entry => entry.queueType === "RANKED_SOLO_5x5");
        const flex = rankedData.find(entry => entry.queueType === "RANKED_FLEX_SR");

        setEloDataByAccount(prev => ({
          ...prev,
          [selectedAccount]: {
            soloDuo: soloDuo ? {
              tier: soloDuo.tier.toLowerCase(),
              division: soloDuo.rank,
              wins: soloDuo.wins,
              losses: soloDuo.losses,
              lp: soloDuo.leaguePoints,
              queue: "soloDuo",
            } : {},
            flex: flex ? {
              tier: flex.tier.toLowerCase(),
              division: flex.rank,
              wins: flex.wins,
              losses: flex.losses,
              lp: flex.leaguePoints,
              queue: "flex",
            } : {},
          }
        }));

        alert("Elo atualizado com sucesso!");
      } catch (jsonErr) {
        console.error("Erro ao converter resposta em JSON:", text);
        alert("Erro inesperado da API. Veja o console.");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      alert("Erro ao atualizar elo automaticamente.");
    }
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

  {/*
  async function handleLogout() {
    await signOut(auth);
    setUser(null);
  }
  */}

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
        `Tem certeza que deseja remover a conta "${accountToRemove}"?`,
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
    width: "90%",
    height: "32px",
    boxSizing: "border-box",
  };

  const buttonstyle = {
    color: "white",
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
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
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.1)")
            }
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

      {/* Box*/}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        {/* Box 1 - Gerenciar contas */}
        <div
          style={{
            backgroundColor: isDarkMode ? "#1f1f1f" : "#f9f9f9",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: isDarkMode
              ? "0 2px 8px rgba(255,255,255,0.05)"
              : "0 2px 8px rgba(0,0,0,0.1)",
            maxWidth: "350px",
            flex: 1,
            minWidth: "300px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Gerenciar Contas</h2>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontWeight: "bold", marginBottom: "6px", display: "block" }}>
              Criar nova conta
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Nome da nova conta"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
              <button
                onClick={addAccount}
                style={{ ...buttonstyle, backgroundColor: "#4caf50", }}
              >
                ➕ Adicionar Conta
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}>
              Conta selecionada:
            </label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select
                style={{ ...inputStyle, flex: 1 }}
                value={selectedAccount}
                onChange={(e) => {
                  setSelectedAccount(e.target.value);
                  setSelectedTierFilter(""); // ← resetar o filtro de elo
                  setShowFilteredAccounts(false); // ← mostrar campeões novamente
                }}
              >
                <option value="">-- Selecione uma conta --</option>
                {[...accounts]
                  .sort((a, b) => a.localeCompare(b))
                  .map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
              </select>

              <button
                onClick={() => {
                  if (selectedAccount) {
                    navigator.clipboard.writeText(selectedAccount);
                  }
                }}
                title="Copy"
                style={{ ...buttonstyle, backgroundColor: isDarkMode ? "#1e1e1e" : "#fff", fontSize: "16px" }}
              >
                ✏️
              </button>
            </div>

          </div>

          {selectedAccount && (
            <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
              {isEditingAccountName ? (
                <>
                  <input
                    type="text"
                    value={editedAccountName}
                    onChange={(e) => setEditedAccountName(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={async () => {
                      const newName = editedAccountName.trim();
                      if (!newName) {
                        alert("O nome da conta não pode estar vazio");
                        return;
                      }
                      if (accounts.includes(newName)) {
                        alert("Já existe uma conta com esse nome");
                        return;
                      }

                      const oldName = selectedAccount;
                      const owned = ownedChampsByAccount[oldName] || [];
                      const details = accountDetails[oldName] || { login: "", password: "" };

                      try {
                        await setDoc(doc(db, "accounts", newName), {
                          ownedChamps: owned,
                          login: details.login,
                          password: details.password,
                        });

                        await deleteDoc(doc(db, "accounts", oldName));

                        setAccounts((prev) =>
                          prev.map((acc) => (acc === oldName ? newName : acc))
                        );
                        setOwnedChampsByAccount((prev) => {
                          const copy = { ...prev };
                          copy[newName] = copy[oldName];
                          delete copy[oldName];
                          return copy;
                        });
                        setAccountDetails((prev) => {
                          const copy = { ...prev };
                          copy[newName] = copy[oldName];
                          delete copy[oldName];
                          return copy;
                        });

                        setSelectedAccount(newName);
                        setIsEditingAccountName(false);
                        alert("Nome da conta atualizado com sucesso!");
                      } catch (error) {
                        console.error("Erro ao renomear conta:", error);
                        alert("Erro ao atualizar o nome da conta.");
                      }
                    }}
                    style={{ ...buttonstyle, backgroundColor: "#1976d2", height: "32px" }}
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditingAccountName(false)}
                    style={{ ...buttonstyle, backgroundColor: "#e53935", height: "32px" }}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditingAccountName(true);
                      setEditedAccountName(selectedAccount);
                    }}
                    style={{
                      ...buttonstyle,
                      backgroundColor: "#f0ad4e",
                      display: "flex",
                      alignItems: "center",
                      marginRight: "auto",
                      height: "32px",
                    }}
                  >
                    Editar Conta
                  </button>
                  <button
                    onClick={() => removeAccount(selectedAccount)}
                    style={{
                      ...buttonstyle,
                      backgroundColor: "#e53935",
                      display: "flex",
                      alignItems: "center",
                      Height: "32px",
                    }}
                  >
                    🗑️ Remover Conta
                  </button>
                </>
              )}
            </div>
          )}

        </div>

        {/* Box 2- Filtro */}
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
            minWidth: "200px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Filtro</h2>

          <div style={{ marginTop: "20px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}>
              By Rank
            </label>
            <Select
              options={rankOptions}
              value={rankOptions.find(opt => opt.value === selectedTierFilter)}
              onChange={(selected) => {
                setSelectedTierFilter(selected.value);
                setSelectedAccount("");
                setShowFilteredAccounts(false);
              }}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                  color: isDarkMode ? "#fff" : "#000",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  minHeight: "30px",
                  height: "30px",
                  fontSize: "13px",
                  padding: "0 4px", // pequeno padding lateral
                }),
                valueContainer: (base) => ({
                  ...base,
                  paddingTop: "0px",
                  paddingBottom: "0px",
                  paddingLeft: "4px",
                  paddingRight: "4px",
                  height: "30px",
                  fontSize: "16px",
                }),
                input: (base) => ({
                  ...base,
                  margin: 0,
                  padding: 0,
                  height: "100%",
                  color: isDarkMode ? "#fff" : "#000",
                }),
                dropdownIndicator: (base) => ({
                  ...base,
                  padding: "2px", // reduz a área da setinha
                }),
                indicatorsContainer: (base) => ({
                  ...base,
                  padding: "0px",
                }),
                singleValue: (base) => ({
                  ...base,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: isDarkMode ? "#fff" : "#000",
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused
                    ? isDarkMode ? "#333" : "#eee"
                    : "transparent",
                  color: isDarkMode ? "#fff" : "#000",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "6px 8px", // controla espaço interno de cada opção
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                  color: isDarkMode ? "#fff" : "#000",
                }),
                placeholder: (base) => ({
                  ...base,
                  color: isDarkMode ? "#aaa" : "#888",
                }),
              }}
            />
          </div>

          <div style={{ marginTop: "14px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}>
              By Champion
            </label>
            <input
              type="text"
              placeholder="Escolhe o campeão"
              style={{ ...inputStyle, width: "100%", margin: 0 }}
            />
          </div>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              style={{
                ...buttonstyle,
                backgroundColor: "#1976d2",
                height: "32px",
                justifyContent: "center", // horizontal
                alignItems: "center",     // vertical
              }}
              onClick={() => {
                if (!selectedTierFilter) {
                  alert("Selecione um elo para filtrar");
                  return;
                }

                const matchingAccounts = accounts.filter((acc) => {
                  const tier = eloDataByAccount[acc]?.soloDuo?.tier;
                  return tier === selectedTierFilter;
                });

                setFilteredAccounts(matchingAccounts);
                setShowFilteredAccounts(true);
              }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Box 3 - Detalhes da conta */}
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
              minWidth: "200px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Dados da Conta</h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Login:
                </label>
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
                <label
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Senha:
                </label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
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
                      backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                      border: "none",
                      borderRadius: "5px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                    title={showPassword ? "Hide" : "Show"}
                  >
                    {showPassword ? "🙈" : "🐵"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={saveLoginPassword}
                style={{
                  ...buttonstyle,
                  backgroundColor: "#1976d2",
                  height: "32px",
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Box 4 - Elo */}
        {selectedAccount && (
          <div
            style={{
              backgroundColor: isDarkMode ? "#1f1f1f" : "#f9f9f9",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: isDarkMode
                ? "0 2px 8px rgba(255,255,255,0.05)"
                : "0 2px 8px rgba(0,0,0,0.1)",
              maxWidth: "400px",
              flex: 1,
              minWidth: "400px",
            }}
          >

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px"
            }}>
              <h2 style={{ margin: 0 }}>Elo</h2>

              <img
                src="/gatinho.png"
                alt="Atualizar elo"
                onClick={atualizarEloAutomaticamente}
                style={{
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  transition: "transform 0.2s ease-in-out",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.5)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                title="Clique para atualizar o elo"
              />
            </div>

            {/* Seletor de fila */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold" }}>Queue:</label>
              <select
                style={{ ...inputStyle, width: "100%", marginTop: "5px" }}
                value={selectedQueue}
                onChange={(e) => setSelectedQueue(e.target.value)}
              >
                <option value="Solo/Duo">Solo/Duo</option>
                <option value="Flex">Flex</option>
              </select>
            </div>

            {/* Carregando dados da fila atual */}
            {(() => {
              const queueKey = getQueueKey(selectedQueue);
              const currentData = eloDataByAccount[selectedAccount]?.[queueKey] || {};

              return (
                <>
                  {/* Tier + Divisão */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "15px" }}>
                    <img
                      src={`/emblems/${currentData.tier || "unranked"}.webp`}
                      alt="Elo"
                      style={{ width: "120px", height: "120px", objectFit: "contain" }}
                    />
                    <div style={{ flex: 1 }}>
                      {/* Selects de Tier + Divisão */}
                      {/* Selects de Tier e Divisão, ou Pontos (LP) para elos altos */}
                      <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                        <select
                          style={{ ...inputStyle, flex: 1.5 }}
                          value={currentData.tier || ""}
                          onChange={(e) =>
                            setEloDataByAccount((prev) => ({
                              ...prev,
                              [selectedAccount]: {
                                ...prev[selectedAccount],
                                [queueKey]: {
                                  ...prev[selectedAccount]?.[queueKey],
                                  tier: e.target.value,
                                  queue: getQueueName(selectedQueue),
                                },
                              },
                            }))
                          }
                        >
                          <option value="">Tier</option>
                          <option value="unranked">Unranked</option>
                          <option value="iron">Iron</option>
                          <option value="bronze">Bronze</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                          <option value="platinum">Platinum</option>
                          <option value="emerald">Emerald</option>
                          <option value="diamond">Diamond</option>
                          <option value="master">Master</option>
                          <option value="grandmaster">Grandmaster</option>
                          <option value="challenger">Challenger</option>
                        </select>

                        {/* Tier alto: Master+ não tem divisão */}
                        {["master", "grandmaster", "challenger"].includes(currentData.tier) ? null : (
                          <select
                            style={{ ...inputStyle, flex: 1 }}
                            value={currentData.division || ""}
                            onChange={(e) =>
                              setEloDataByAccount((prev) => ({
                                ...prev,
                                [selectedAccount]: {
                                  ...prev[selectedAccount],
                                  [queueKey]: {
                                    ...prev[selectedAccount]?.[queueKey],
                                    division: e.target.value,
                                  },
                                },
                              }))
                            }
                          >
                            <option value="">Divisão</option>
                            <option value="IV">IV</option>
                            <option value="III">III</option>
                            <option value="II">II</option>
                            <option value="I">I</option>
                          </select>
                        )}

                        {/* Campo de LP para todos os tiers */}
                        <input
                          type="number"
                          min="0"
                          placeholder="Pontos (LP)"
                          style={{ ...inputStyle, flex: 0.5, textAlign: "center" }}
                          value={currentData.lp || 0}
                          onChange={(e) =>
                            setEloDataByAccount((prev) => ({
                              ...prev,
                              [selectedAccount]: {
                                ...prev[selectedAccount],
                                [queueKey]: {
                                  ...prev[selectedAccount]?.[queueKey],
                                  lp: parseInt(e.target.value) || 0,
                                },
                              },
                            }))
                          }
                        />
                      </div>

                      {/* Inputs de Wins (W) e Losses (L) */}
                      <div style={{ marginBottom: "10px", width: "100%" }}>
                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: "bold", fontSize: "13px", lineHeight: "1" }}>Wins:</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              style={{
                                ...inputStyle,
                                width: "60px",
                                padding: "4px 6px",
                                border: "none",
                                outline: "none",
                                backgroundColor: "transparent",
                                color: isDarkMode ? "#fff" : "#000",
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                                appearance: "textfield",
                              }}
                              value={currentData.wins || 0}
                              onChange={(e) =>
                                setEloDataByAccount((prev) => ({
                                  ...prev,
                                  [selectedAccount]: {
                                    ...prev[selectedAccount],
                                    [queueKey]: {
                                      ...prev[selectedAccount]?.[queueKey],
                                      wins: parseInt(e.target.value) || 0,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: "bold", fontSize: "13px", lineHeight: "1" }}>Losses:</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              style={{
                                ...inputStyle,
                                width: "60px",
                                padding: "4px 6px",
                                border: "none",
                                outline: "none",
                                backgroundColor: "transparent",
                                color: isDarkMode ? "#fff" : "#000",
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                                appearance: "textfield",
                              }}
                              value={currentData.losses || 0}
                              onChange={(e) =>
                                setEloDataByAccount((prev) => ({
                                  ...prev,
                                  [selectedAccount]: {
                                    ...prev[selectedAccount],
                                    [queueKey]: {
                                      ...prev[selectedAccount]?.[queueKey],
                                      losses: parseInt(e.target.value) || 0,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>

                        {/* Win Rate */}
                        <div style={{ marginTop: "8px" }}>
                          <span style={{ fontSize: "13px" }}>Win Rate:</span>{" "}
                          <span style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: (() => {
                              const wins = currentData.wins || 0;
                              const losses = currentData.losses || 0;
                              const total = wins + losses;
                              if (total === 0) return "#888"; // cinza
                              const rate = (wins / total) * 100;
                              if (rate < 40) return "red";
                              if (rate >= 40 && rate < 50) return "orange";
                              if (rate === 50) return "#888"; // cinza
                              if (rate > 50 && rate < 80) return "green";
                              return "blue";
                            })()
                          }}>
                            {(() => {
                              const wins = currentData.wins || 0;
                              const losses = currentData.losses || 0;
                              const total = wins + losses;
                              return total === 0 ? "0%" : `${((wins / total) * 100).toFixed(1)}%`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Box 5 - Filtros */}
        {selectedAccount && (
          <div
            style={{
              backgroundColor: isDarkMode ? "#1f1f1f" : "#f9f9f9",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: isDarkMode
                ? "0 2px 8px rgba(255,255,255,0.05)"
                : "0 2px 8px rgba(0,0,0,0.1)",
              maxWidth: "300px",
              flex: 1,
              minWidth: "300px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Campeones</h2>

            {/* Filtro por possuidos */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "40px" }}>
              <div
                onClick={() => setShowOnlyOwned(!showOnlyOwned)}
                style={{
                  width: "40px",
                  height: "20px",
                  borderRadius: "20px",
                  backgroundColor: showOnlyOwned ? "#4caf50" : "#666",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease"
                }}
                title="Alternar filtro de possuídos"
              >
                <div
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: showOnlyOwned ? "20px" : "2px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    transition: "left 0.3s ease"
                  }}
                />
              </div>
              <span>Mostrar apenas possuídos</span>
            </div>

            <p style={{ fontWeight: "bold", margin: "10px 0 5px" }}>
              Campeões possuídos: {getOwnedCount()} / {champions.length}
            </p>

            {/* Botão temporário para selecionar todos */}
            <button
              onClick={() => {
                if (!selectedAccount) return alert("Selecione uma conta primeiro.");
                const todosIds = champions.map(champ => champ.id);
                setOwnedChampsByAccount(prev => ({
                  ...prev,
                  [selectedAccount]: todosIds,
                }));
              }}
              style={{
                marginTop: "20px",
                padding: "8px 12px",
                backgroundColor: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                width: "100%",
              }}
            >
              Selecionar Todos os Campeões
            </button>

            {/* Botão para remover todos os campeões */}
            <button
              onClick={() => {
                if (!selectedAccount) return alert("Selecione uma conta primeiro.");
                setOwnedChampsByAccount(prev => ({
                  ...prev,
                  [selectedAccount]: [],
                }));
              }}
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                backgroundColor: "#e53935",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                width: "100%",
              }}
            >
              Remover Todos os Campeões
            </button>

            {/* Filtro por rota */}
            <div
              style={{
                marginTop: "50px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: "bold" }}></span>
              {["top", "jungle", "mid", "marksman", "support"].map((role) => (
                <img
                  key={role}
                  src={`/lanes/${role.toLowerCase()}.webp`} // caminho das imagens
                  alt={role}
                  title={role}
                  onClick={() =>
                    setSelectedRole(selectedRole === role ? "" : role)
                  }
                  style={{
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    filter: selectedRole === role ? "none" : "grayscale(100%)",
                    borderRadius: "8px",
                    transition: "all 0.3s ease",
                    transform: selectedRole === role ? "scale(1.1)" : "scale(1)",
                  }}
                  onMouseOver={(e) => {
                    if (selectedRole !== role) {
                      e.currentTarget.style.filter = "none";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedRole !== role) {
                      e.currentTarget.style.filter = "grayscale(100%)";
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mostrar campeões apenas se não estiver filtrando por elo */}
      {!showFilteredAccounts && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
          }}
        >
          {champions
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter((champ) => {
              if (showOnlyOwned && !isOwned(champ.id)) return false;
              if (
                selectedRole &&
                !championsByRole[selectedRole]?.includes(champ.id)
              )
                return false;
              return true;
            })
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
                    filter: owned ? "none" : "grayscale(100%) brightness(60%)",
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
                  <p style={{ fontSize: "0.85rem", margin: "6px 0" }}>
                    {champ.name}
                  </p>
                </div>
              );
            })}
        </div>
      )}

      {/* Mostrar lista de contas filtradas se showFilteredAccounts for true */}
      {showFilteredAccounts && (
        <div style={{ marginTop: "20px" }}>
          <h3>Contas com elo {selectedTierFilter.toUpperCase()}:</h3>
          {filteredAccounts.length === 0 ? (
            <p>Nenhuma conta encontrada com esse elo.</p>
          ) : (
            <ul>
              {filteredAccounts.map((acc) => (
                <li
                  key={acc}
                  onClick={() => {
                    setSelectedAccount(acc); // seleciona a conta
                    setSelectedTierFilter(""); // reseta o filtro de elo
                    setShowFilteredAccounts(false); // mostra campeões e dados da conta
                  }}
                  style={{
                    marginBottom: "8px",
                    cursor: "pointer",
                    color: "#1976d2",
                    fontWeight: "bold",
                    textDecoration: "underline",
                  }}
                  title="Clique para ver detalhes da conta"
                >
                  {acc}
                </li>
              ))}
            </ul>
          )}
          <button
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              backgroundColor: "#e53935",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => setShowFilteredAccounts(false)}
          >
            Voltar
          </button>
        </div>
      )}

    </div>
  );
}

export default App;