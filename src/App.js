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
import championVoiceMap from './data/champion_voice_map.json';

function App() {
    const [champions, setChampions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [ownedChampsByAccount, setOwnedChampsByAccount] = useState({});
    const [ownedSkinsByAccount, setOwnedSkinsByAccount] = useState({});
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
            "Ambessa",
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
            "Briar",
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
            "Naafiri",
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
            "Aurora",
            "Azir",
            "Cassiopeia",
            "Diana",
            "Ekko",
            "Fizz",
            "Galio",
            "Heimerdinger",
            "Hwei",
            "Irelia",
            "Jayce",
            "Kassadin",
            "Katarina",
            "Leblanc",
            "Lissandra",
            "Lux",
            "Malzahar",
            "Mel",
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
            "Smolder",
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
            "Mel",
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
    const [filterMode, setFilterMode] = useState("champion"); // ou "skin"
    const [selectedSkinsFilter, setSelectedSkinsFilter] = useState([]);
    const rankOptions = [
        { value: "", label: "Choose a rank" },
        ...["unranked", "iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"].map((tier) => ({
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
    const [selectedChampionsFilter, setSelectedChampionsFilter] = useState([]);
    const [ddragonVersion, setDdragonVersion] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [removeSuccess, setRemoveSuccess] = useState(false);
    const [showConfirmRemove, setShowConfirmRemove] = useState(false);
    const playChampionVoice = (championName) => {
        const champ = championVoiceMap[championName];
        if (!champ) return;
        const audio = new Audio(champ.audio);
        audio.volume = 0.1;
        audio.play().catch((err) =>
            console.warn(`Erro ao tocar voz de ${championName}:`, err)
        );
    };
    const [penaltiesByAccount, setPenaltiesByAccount] = useState({});
    const [showPenaltyTooltip, setShowPenaltyTooltip] = useState(false);
    const [activeTab, setActiveTab] = useState("champions"); // ou "skins"
    const [skins, setSkins] = useState([]);
    const getCorrectedChampionIdForSkin = (champId) => {
        if (champId === "Fiddlesticks") return "FiddleSticks";
        return champId;
    };

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
                const versionRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
                const versions = await versionRes.json();
                const latestVersion = versions[0];
                setDdragonVersion(latestVersion);
                const champsRes = await fetch(
                    `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
                );
                const champsData = await champsRes.json();
                const champsArray = Object.values(champsData.data);
                setChampions(champsArray);

                // Agora carrega skins também
                await fetchSkins(champsArray, latestVersion);
            } catch (err) {
                console.error("Erro ao carregar campeões:", err);
            }
        };

        const fetchSkins = async (championsList, version) => {
            const allSkins = [];
            for (const champ of championsList) {
                try {
                    const championIdForUrl = champ.id
                    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championIdForUrl}.json`);
                    const data = await res.json();
                    const skinsList = data.data[champ.id].skins.map(skin => ({
                        id: skin.id,
                        champId: champ.id,
                        name: skin.name === "default" ? champ.name : skin.name,
                        num: skin.num,
                    }));
                    allSkins.push(...skinsList);
                } catch (error) {
                    console.error(`Erro ao carregar skins do campeão ${champ.id}:`, error);
                }
            }
            setSkins(allSkins);
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
                const penaltiesData = {};
                const skinsData = {};
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    accountsList.push(docSnap.id);
                    champsData[docSnap.id] = data.ownedChamps || [];
                    skinsData[docSnap.id] = data.ownedSkins || [];
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
                    penaltiesData[docSnap.id] = data.penalty || "";
                });
                setAccounts(accountsList);
                setOwnedChampsByAccount(champsData);
                setOwnedSkinsByAccount(skinsData);
                setAccountDetails(details);
                setEloDataByAccount(eloData);
                setPenaltiesByAccount(penaltiesData);
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
                            ownedSkins: ownedSkinsByAccount[account] || [],
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

    async function toggleSkin(skinId) {
        if (!selectedAccount) {
            alert("Selecione uma conta primeiro");
            return;
        }

        const owned = ownedSkinsByAccount[selectedAccount] || [];
        const newOwned = owned.includes(skinId)
            ? owned.filter((id) => id !== skinId)
            : [...owned, skinId];

        const updated = {
            ...ownedSkinsByAccount,
            [selectedAccount]: newOwned,
        };
        setOwnedSkinsByAccount(updated);

        await updateDoc(doc(db, "accounts", selectedAccount), {
            ownedSkins: newOwned,
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

    function isSkinOwned(skinId) {
        if (!selectedAccount) return false;
        const owned = ownedSkinsByAccount[selectedAccount] || [];
        return owned.includes(skinId);
    }
    function getChampionsBySelectedRole() {
        if (!selectedRole) return champions;
        return champions.filter(c => championsByRole[selectedRole]?.includes(c.id));
    }

    function getOwnedChampionsBySelectedRole() {
        if (!selectedAccount) return [];
        const allOwned = ownedChampsByAccount[selectedAccount] || [];
        const champsInRole = getChampionsBySelectedRole().map(c => c.id);
        return allOwned.filter(id => champsInRole.includes(id));
    }

    function getSkinsBySelectedRole() {
        const champsInRole = getChampionsBySelectedRole().map(c => c.id);
        return skins.filter(skin => champsInRole.includes(skin.champId));
    }

    function getOwnedSkinsBySelectedRole() {
        if (!selectedAccount) return [];
        const allOwnedSkins = ownedSkinsByAccount[selectedAccount] || [];
        const skinsInRole = getSkinsBySelectedRole().map(skin => `${skin.champId}_${skin.num}`);
        return allOwnedSkins.filter(id => skinsInRole.includes(id));
    }

    async function removeAccount(accountToRemove) {
        const updatedAccounts = accounts.filter((acc) => acc !== accountToRemove);
        const updatedOwnedChamps = { ...ownedChampsByAccount };
        delete updatedOwnedChamps[accountToRemove];

        setAccounts(updatedAccounts);
        setOwnedChampsByAccount(updatedOwnedChamps);

        await deleteDoc(doc(db, "accounts", accountToRemove));

        // Limpar conta selecionada
        setSelectedAccount("");
    }

    async function saveLoginPassword() {
        if (!selectedAccount) return;

        const { login, password } = accountDetails[selectedAccount];

        try {
            await updateDoc(doc(db, "accounts", selectedAccount), {
                login,
                password,
            });
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
        fontFamily: "inherit, Segoe UI, Roboto, sans-serif",
    };

    const inputStyle = {
        backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
        color: isDarkMode ? "#ffffff" : "#000000",
        border: "1px solid #ccc",
        padding: "6px 8px",
        borderRadius: "5px",
        width: "90%",
        height: "32px",
        boxSizing: "border-box",
        fontSize: "14px",
        fontFamily: "inherit, Segoe UI, Roboto, sans-serif",
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
                                    setSelectedTierFilter("");
                                    setSelectedChampionsFilter([]); // ← aqui
                                    setShowFilteredAccounts(false);
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
                                            marginTop: "10px",
                                        }}
                                    >
                                        Editar Conta
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmRemove(true)}
                                        disabled={!selectedAccount}
                                        style={{
                                            ...buttonstyle,
                                            backgroundColor: removeSuccess ? "#4caf50" : "#e53935",
                                            height: "32px",
                                            marginTop: "10px",
                                            transition: "all 0.3s ease",
                                            opacity: selectedAccount ? 1 : 0.5,
                                            cursor: selectedAccount ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        {removeSuccess ? "✔️ Removida!" : "🗑️ Remover Conta"}
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
                        <div style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: "bold" }}>By Rank:</span>

                            <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                    onClick={() => setSelectedQueue("Solo/Duo")}
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #999",
                                        backgroundColor: selectedQueue === "Solo/Duo" ? "#9370DB" : (isDarkMode ? "#1e1e1e" : "#f0f0f0"),
                                        color: selectedQueue === "Solo/Duo" ? "#fff" : (isDarkMode ? "#fff" : "#000"),
                                        cursor: "pointer",
                                    }}
                                >
                                    Solo/Duo
                                </button>
                                <button
                                    onClick={() => setSelectedQueue("Flex")}
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: "12px",
                                        borderRadius: "6px",
                                        border: "1px solid #999",
                                        backgroundColor: selectedQueue === "Flex" ? "#9370DB" : (isDarkMode ? "#1e1e1e" : "#f0f0f0"),
                                        color: selectedQueue === "Flex" ? "#fff" : (isDarkMode ? "#fff" : "#000"),
                                        cursor: "pointer",
                                    }}
                                >
                                    Flex
                                </button>
                            </div>
                        </div>
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
                                    height: "32px",
                                    fontSize: "14px",
                                    padding: "0 4px",
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    padding: "0 4px",
                                    height: "30px",
                                    fontSize: "14px",
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
                                    color: isDarkMode ? "#aaa" : "#888",
                                    fontSize: "14px",
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <button
                                onClick={() => setFilterMode("champion")}
                                style={{
                                    padding: "4px 10px",
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #999",
                                    backgroundColor: filterMode === "champion" ? "#FF69B4" : (isDarkMode ? "#1e1e1e" : "#f0f0f0"),
                                    color: filterMode === "champion" ? "#fff" : (isDarkMode ? "#fff" : "#000"),
                                    cursor: "pointer",
                                }}
                            >
                                By Champion
                            </button>

                            <button
                                onClick={() => setFilterMode("skin")}
                                style={{
                                    padding: "4px 10px",
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #999",
                                    backgroundColor: filterMode === "skin" ? "#FF69B4" : (isDarkMode ? "#1e1e1e" : "#f0f0f0"),
                                    color: filterMode === "skin" ? "#fff" : (isDarkMode ? "#fff" : "#000"),
                                    cursor: "pointer",
                                }}
                            >
                                By Skin
                            </button>
                        </div>


                        {/* Aqui mostra o filtro de campeão ou uma mensagem se estiver no modo skin */}
                        {filterMode === "champion" ? (
                            <Select
                                isMulti
                                isSearchable={true}
                                filterOption={(option, inputValue) => {
                                    const normalizedInput = inputValue.toLowerCase();
                                    if (!option.data.searchTerms) return false;
                                    return option.data.searchTerms.some(term => term.includes(normalizedInput));
                                }}
                                options={champions.map(champ => ({
                                    value: champ.id,
                                    label: (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champ.id}.png`}
                                                alt={champ.name}
                                                style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    objectFit: "cover",
                                                    borderRadius: "50%",
                                                }}
                                            />
                                            <span>{champ.id === "MonkeyKing" ? "Wukong" : champ.name}</span>
                                        </div>
                                    ),
                                    searchTerms: [
                                        champ.id === "MonkeyKing" ? "wukong" : champ.id.toLowerCase()
                                    ]
                                }))}
                                value={champions
                                    .filter(c => selectedChampionsFilter.includes(c.id))
                                    .map(c => ({
                                        value: c.id,
                                        label: (
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${c.id}.png`}
                                                alt={c.name}
                                                style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    objectFit: "cover",
                                                    borderRadius: "50%",
                                                }}
                                            />
                                        )
                                    }))}
                                onChange={(selectedOptions) => {
                                    const selected = selectedOptions || [];
                                    const lastSelected = selected[selected.length - 1];

                                    if (lastSelected) {
                                        playChampionVoice(lastSelected.value);
                                    }

                                    setSelectedChampionsFilter(selected.map(opt => opt.value));
                                    setSelectedAccount("");
                                    setShowFilteredAccounts(false);
                                }}
                                placeholder="Champions..."
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                                        color: isDarkMode ? "#fff" : "#000",
                                        border: "1px solid #ccc",
                                        borderRadius: "5px",
                                        height: "32px",
                                        minHeight: "32px",
                                        boxSizing: "border-box",
                                        padding: "0 4px",
                                        overflow: "hidden",
                                    }),
                                    valueContainer: (base) => ({
                                        ...base,
                                        height: "32px",
                                        padding: "0 4px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                    }),
                                    multiValue: (base) => ({
                                        ...base,
                                        backgroundColor: "transparent",
                                        padding: "0",
                                        margin: "0",
                                    }),
                                    multiValueLabel: () => ({
                                        display: "flex",
                                        alignItems: "center",
                                    }),
                                    multiValueRemove: (base) => ({
                                        ...base,
                                        display: "none",
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        margin: 0,
                                        padding: 0,
                                        height: "20px",
                                        color: isDarkMode ? "#fff" : "#000",
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        fontSize: "14px",
                                        color: isDarkMode ? "#aaa" : "#888",
                                    }),
                                    indicatorsContainer: (base) => ({
                                        ...base,
                                        height: "32px",
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        padding: "2px",
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused
                                            ? isDarkMode ? "#333" : "#eee"
                                            : "transparent",
                                        color: isDarkMode ? "#fff" : "#000",
                                        padding: "6px 8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }),
                                }}

                            />
                        ) : (
                            <Select
                                isMulti
                                isSearchable={true}
                                filterOption={(option, inputValue) => {
                                    const normalized = inputValue.toLowerCase();
                                    return option.data.searchTerms.some(term => term.includes(normalized));
                                }}
                                options={skins
                                    .filter(skin => skin.num !== 0)
                                    .map(skin => {
                                        const fullId = `${skin.champId}_${skin.num}`;
                                        return {
                                            value: fullId,
                                            label: (
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <img
                                                        src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${getCorrectedChampionIdForSkin(skin.champId)}_${skin.num}.jpg`}
                                                        alt={skin.name}
                                                        style={{
                                                            width: "20px",
                                                            height: "20px",
                                                            objectFit: "cover",
                                                            borderRadius: "50%",
                                                        }}
                                                    />
                                                    <span>{skin.name}</span>
                                                </div>
                                            ),
                                            searchTerms: [
                                                skin.name.toLowerCase(),
                                                skin.champId.toLowerCase()
                                            ]
                                        };
                                    })}
                                onChange={(selectedOptions) => {
                                    const selected = selectedOptions || [];
                                    const skinIds = selected.map(opt => opt.value);
                                    setSelectedSkinsFilter(skinIds);
                                    setSelectedAccount("");
                                    setShowFilteredAccounts(false);
                                }}
                                placeholder="Skins..."
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                                        color: isDarkMode ? "#fff" : "#000",
                                        border: "1px solid #ccc",
                                        borderRadius: "5px",
                                        height: "32px",
                                        minHeight: "32px",
                                        boxSizing: "border-box",
                                        padding: "0 4px",
                                        overflow: "hidden",
                                    }),
                                    valueContainer: (base) => ({
                                        ...base,
                                        height: "32px",
                                        padding: "0 4px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                    }),
                                    multiValue: (base) => ({
                                        ...base,
                                        backgroundColor: "transparent",
                                        padding: "0",
                                        margin: "0",
                                    }),
                                    multiValueLabel: () => ({
                                        display: "flex",
                                        alignItems: "center",
                                    }),
                                    multiValueRemove: (base) => ({
                                        ...base,
                                        display: "none",
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        margin: 0,
                                        padding: 0,
                                        height: "20px",
                                        color: isDarkMode ? "#fff" : "#000",
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        fontSize: "14px",
                                        color: isDarkMode ? "#aaa" : "#888",
                                    }),
                                    indicatorsContainer: (base) => ({
                                        ...base,
                                        height: "32px",
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        padding: "2px",
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused
                                            ? isDarkMode ? "#333" : "#eee"
                                            : "transparent",
                                        color: isDarkMode ? "#fff" : "#000",
                                        padding: "6px 8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }),
                                }}
                            />
                        )}
                    </div>
                    {(selectedTierFilter || selectedChampionsFilter.length > 0 || selectedSkinsFilter.length > 0) && (
                        <div style={{ textAlign: "center", marginTop: "20px" }}>
                            <button
                                style={{ ...buttonstyle, backgroundColor: "#9370DB", height: "32px", marginTop: "10px" }}
                                onClick={() => {
                                    const queueKey = selectedQueue === "Flex" ? "flex" : "soloDuo";

                                    let matchingAccounts = [...accounts];

                                    if (filterMode === "champion" && selectedChampionsFilter.length > 0) {
                                        matchingAccounts = matchingAccounts.filter((acc) => {
                                            const owned = ownedChampsByAccount[acc] || [];
                                            const hasAllChampions = selectedChampionsFilter.every((c) => owned.includes(c));
                                            return hasAllChampions;
                                        });
                                    }

                                    if (filterMode === "skin" && selectedSkinsFilter.length > 0) {
                                        matchingAccounts = matchingAccounts.filter((acc) => {
                                            const ownedSkins = ownedSkinsByAccount[acc] || [];
                                            const hasAllSkins = selectedSkinsFilter.every((s) => ownedSkins.includes(s));
                                            return hasAllSkins;
                                        });
                                    }

                                    if (selectedTierFilter) {
                                        matchingAccounts = matchingAccounts.filter((acc) => {
                                            const elo = eloDataByAccount[acc]?.[queueKey];
                                            return elo?.tier === selectedTierFilter;
                                        });
                                    }

                                    matchingAccounts.sort((a, b) => {
                                        const eloA = eloDataByAccount[a]?.[queueKey] || {};
                                        const eloB = eloDataByAccount[b]?.[queueKey] || {};

                                        const tierOrder = ["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger", "unranked"];
                                        const divisionOrder = ["IV", "III", "II", "I"];

                                        const tierIndexA = tierOrder.indexOf(eloA.tier || "unranked");
                                        const tierIndexB = tierOrder.indexOf(eloB.tier || "unranked");

                                        if (tierIndexA !== tierIndexB) return tierIndexA - tierIndexB;

                                        const divisionIndexA = divisionOrder.indexOf(eloA.division || "IV");
                                        const divisionIndexB = divisionOrder.indexOf(eloB.division || "IV");

                                        return divisionIndexA - divisionIndexB;
                                    });

                                    setFilteredAccounts(matchingAccounts);
                                    setShowFilteredAccounts(true);
                                }}
                            >
                                Search
                            </button>
                        </div>
                    )}

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
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <h2 style={{ margin: 0 }}>Dados da Conta</h2>

                            <div
                                style={{ position: "relative" }}
                                onMouseEnter={() => setShowPenaltyTooltip(true)}
                                onMouseLeave={() => setShowPenaltyTooltip(false)}
                            >
                                <div
                                    onClick={async () => {
                                        const current = penaltiesByAccount[selectedAccount] || "";
                                        const input = prompt("Digite a penalidade (ex: 2x ng ou 1x 15m):", current);
                                        if (input !== null) {
                                            const trimmed = input.trim();
                                            setPenaltiesByAccount((prev) => ({
                                                ...prev,
                                                [selectedAccount]: trimmed,
                                            }));

                                            try {
                                                await updateDoc(doc(db, "accounts", selectedAccount), {
                                                    penalty: trimmed,
                                                });
                                            } catch (error) {
                                                console.error("Erro ao salvar penalidade:", error);
                                                alert("Erro ao salvar penalidade no Firestore.");
                                            }
                                        }
                                    }}
                                >
                                    <img
                                        src={
                                            penaltiesByAccount[selectedAccount]
                                                ? "/icons/penalty-alert.png"
                                                : "/icons/penalty-ok.png"
                                        }
                                        alt="penalidade"
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            objectFit: "contain",
                                        }}
                                    />
                                </div>

                                {penaltiesByAccount[selectedAccount] && showPenaltyTooltip && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            right: 0,
                                            backgroundColor: "#333",
                                            color: "#fff",
                                            padding: "6px 10px",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                            whiteSpace: "nowrap",
                                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                                            marginTop: "6px",
                                            zIndex: 10,
                                        }}
                                    >
                                        Penalidade: {penaltiesByAccount[selectedAccount]}
                                    </div>
                                )}
                            </div>


                        </div>

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
                                onClick={async () => {
                                    await saveLoginPassword();
                                    setSaveSuccess(true);
                                    setTimeout(() => setSaveSuccess(false), 2000); // reseta após 2 segundos
                                }}
                                style={{
                                    ...buttonstyle,
                                    backgroundColor: saveSuccess ? "#4caf50" : "#1976d2",
                                    height: "32px",
                                    marginTop: "12px",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                {saveSuccess ? "✔️ Salvo!" : "Salvar"}
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
                            marginBottom: "13px"
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
                                                        style={{ ...inputStyle, flex: 1.2 }}
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
                        <h2 style={{ marginTop: 0 }}>
                            {activeTab === "champions" ? "Campeones" : "Skins"}
                        </h2>

                        <p style={{ fontWeight: "bold", margin: "10px 0 8px" }}>
                            {activeTab === "champions"
                                ? `Campeões possuídos: ${getOwnedChampionsBySelectedRole().length} / ${getChampionsBySelectedRole().length}`
                                : `Skins possuídas: ${getOwnedSkinsBySelectedRole().length} / ${getSkinsBySelectedRole().length}`}
                        </p>

                        {/* Filtro por possuídos */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "20px",
                            }}
                        >
                            <div
                                onClick={() => setShowOnlyOwned(!showOnlyOwned)}
                                style={{
                                    width: "40px",
                                    height: "20px",
                                    borderRadius: "20px",
                                    backgroundColor: showOnlyOwned ? "#4caf50" : "#666",
                                    position: "relative",
                                    cursor: "pointer",
                                    transition: "background-color 0.3s ease",
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
                                        transition: "left 0.3s ease",
                                    }}
                                />
                            </div>
                            <span>Mostrar apenas possuídos</span>
                        </div>

                        {/* Filtro por rota */}
                        <div
                            style={{
                                marginTop: "35px",
                                display: "flex",
                                gap: "15px",
                                alignItems: "center",
                                justifyContent: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            {["top", "jungle", "mid", "marksman", "support"].map((role) => (
                                <img
                                    key={role}
                                    src={`/lanes/${role.toLowerCase()}.webp`} // caminho das imagens
                                    alt={role}
                                    title={role}
                                    onClick={() => setSelectedRole(selectedRole === role ? "" : role)}
                                    style={{
                                        width: "35px",
                                        height: "35px",
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

                        {/* Botões: Selecionar Todos / Remover Todos */}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginTop: "20px" }}>
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
                                    ...buttonstyle,
                                    backgroundColor: "#1976d2",
                                    height: "32px",
                                    marginTop: "20px",
                                }}
                            >
                                Selecionar Todos
                            </button>

                            <button
                                onClick={() => {
                                    if (!selectedAccount) return alert("Selecione uma conta primeiro.");
                                    setOwnedChampsByAccount(prev => ({
                                        ...prev,
                                        [selectedAccount]: [],
                                    }));
                                }}
                                style={{
                                    ...buttonstyle,
                                    backgroundColor: "#e53935",
                                    height: "32px",
                                    marginTop: "20px",
                                }}
                            >
                                Remover Todos
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedAccount && !showFilteredAccounts && (
                <>
                    {/* Seletor de aba */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "600px",
                            margin: "30px 0 40px",
                        }}
                    >
                        <div
                            onClick={() => setActiveTab("champions")}
                            style={{
                                cursor: "pointer",
                                fontSize: "1.1rem",
                                fontWeight: "bold",
                                color: activeTab === "champions" ? "#00ced1" : isDarkMode ? "#aaa" : "#444",
                                backgroundColor: activeTab === "champions" ? (isDarkMode ? "#2a2a2a" : "#e3f2fd") : "transparent",
                                padding: "10px 20px",
                                borderRadius: "20px",
                                transition: "all 0.3s ease",
                                transform: activeTab === "champions" ? "scale(1.05)" : "scale(1)",
                                boxShadow: activeTab === "champions" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                            }}
                        >
                            Champions
                        </div>

                        <div
                            onClick={() => setActiveTab("skins")}
                            style={{
                                cursor: "pointer",
                                fontSize: "1.1rem",
                                fontWeight: "bold",
                                color: activeTab === "skins" ? "#00ced1" : isDarkMode ? "#aaa" : "#444",
                                backgroundColor: activeTab === "skins" ? (isDarkMode ? "#2a2a2a" : "#e3f2fd") : "transparent",
                                padding: "10px 20px",
                                borderRadius: "20px",
                                transition: "all 0.3s ease",
                                transform: activeTab === "skins" ? "scale(1.05)" : "scale(1)",
                                boxShadow: activeTab === "skins" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                            }}
                        >
                            Skins
                        </div>
                    </div>

                    {/* Grid de Campeões */}
                    {activeTab === "champions" && (
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

                    {/* Grid de Skins */}
                    {activeTab === "skins" && (
                        <div style={{ marginTop: "20px" }}>
                            {champions
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .filter((champ) => {
                                    const champSkins = skins.filter(
                                        (skin) => skin.champId === champ.id && skin.num !== 0
                                    );
                                    const visibleSkins = champSkins.filter(
                                        (skin) => !showOnlyOwned || isSkinOwned(`${skin.champId}_${skin.num}`)
                                    );

                                    const passaFiltroDeRota =
                                        activeTab === "skins" && selectedRole
                                            ? championsByRole[selectedRole]?.includes(champ.id)
                                            : true;

                                    const isChampOwned = isOwned(champ.id); // <-- nova regra

                                    return visibleSkins.length > 0 && passaFiltroDeRota && isChampOwned;
                                })

                                .map((champ) => {
                                    const champSkins = skins.filter(
                                        (skin) => skin.champId === champ.id && skin.num !== 0
                                    );
                                    const visibleSkins = champSkins.filter(
                                        (skin) => !showOnlyOwned || isSkinOwned(`${skin.champId}_${skin.num}`)
                                    );

                                    return (
                                        <div key={champ.id} style={{ marginBottom: "40px" }}>
                                            <h3
                                                style={{
                                                    marginBottom: "12px",
                                                    fontSize: "1.3rem",
                                                    color: isDarkMode ? "#fff" : "#333",
                                                    display: "inline-block",
                                                    paddingBottom: "4px",
                                                }}
                                            >
                                                {champ.name}
                                                <span
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        color: isDarkMode ? "#aaa" : "#666",
                                                        marginLeft: "12px",
                                                    }}
                                                >
                                                    ({champSkins.filter(skin => isSkinOwned(`${skin.champId}_${skin.num}`)).length}/{champSkins.length})
                                                </span>
                                            </h3>

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(auto-fill, 110px)",
                                                    justifyContent: "center",
                                                    gap: "10px",
                                                    marginTop: "10px",
                                                }}
                                            >
                                                {visibleSkins.map((skin) => (
                                                    <div
                                                        key={skin.id}
                                                        onClick={() => toggleSkin(`${skin.champId}_${skin.num}`)}
                                                        style={{
                                                            width: "110px",
                                                            textAlign: "center",
                                                            borderRadius: "12px",
                                                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                            backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
                                                            overflow: "hidden",
                                                            filter: isSkinOwned(`${skin.champId}_${skin.num}`)
                                                                ? "none"
                                                                : "grayscale(100%) brightness(60%)",
                                                            cursor: "pointer",
                                                            transition: "filter 0.3s ease",
                                                        }}
                                                        title={
                                                            isSkinOwned(`${skin.champId}_${skin.num}`)
                                                                ? "Você possui esta skin nesta conta"
                                                                : "Clique para marcar como possuída"
                                                        }
                                                    >
                                                        <img
                                                            src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${getCorrectedChampionIdForSkin(skin.champId)}_${skin.num}.jpg`}
                                                            alt={skin.name}
                                                            style={{
                                                                width: "100%",
                                                                height: "180px",
                                                                objectFit: "cover",
                                                                borderRadius: "12px",
                                                            }}
                                                        />
                                                        <p style={{ fontSize: "0.75rem", margin: "6px 0" }}>{skin.name}</p>
                                                    </div>
                                                ))}
                                            </div>

                                        </div>
                                    );
                                })}

                        </div>
                    )}

                </>
            )}

            {/* Mostrar lista de contas filtradas se showFilteredAccounts for true */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "20px",
                    marginTop: "20px",
                    padding: "0 10px",
                }}
            >
                {filteredAccounts.map((acc) => {
                    const elo = eloDataByAccount[acc]?.soloDuo || {};
                    const tier = elo.tier || "unranked";
                    const championsToShow = selectedChampionsFilter.slice(0, 6);
                    const tierColors = {
                        unranked: "#888",
                        iron: "#6e6e6e",
                        bronze: "#cd7f32",
                        silver: "#c0c0c0",
                        gold: "#d4af37",
                        platinum: "#00bfa5",
                        emerald: "#3ddc84",
                        diamond: "#536dfe",
                        master: "#ab47bc",
                        grandmaster: "#f44336",
                        challenger: "#00b0ff",
                    };
                    const totalGames = (elo.wins || 0) + (elo.losses || 0);
                    const winrate = totalGames > 0 ? ((elo.wins / totalGames) * 100).toFixed(1) : "0";
                    const wrColor = (() => {
                        if (totalGames === 0) return "#888";
                        const rate = (elo.wins / totalGames) * 100;
                        if (rate < 40) return "red";
                        if (rate >= 40 && rate < 50) return "orange";
                        if (rate === 50) return "#888";
                        if (rate > 50 && rate < 80) return "green";
                        return "blue";
                    })();

                    return (
                        <div
                            key={acc}
                            onClick={() => {
                                setSelectedAccount(acc);
                                setSelectedTierFilter("");
                                setSelectedChampionsFilter([]);
                                setShowFilteredAccounts(false);
                            }}
                            style={{
                                backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                                borderRadius: "14px",
                                padding: "18px",
                                border: `1.5px solid ${tierColors[tier] || "#999"}`,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                transition: "transform 0.2s ease, border-color 0.3s ease",
                                flex: "0 0 240px",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
                            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            title="Clique para ver detalhes da conta"
                        >
                            <img
                                src={`/emblems/${tier}.webp`}
                                alt={tier}
                                style={{
                                    width: "56px",
                                    height: "56px",
                                    marginBottom: "8px",
                                }}
                            />
                            <h4 style={{ margin: "6px 0", color: isDarkMode ? "#fff" : "#000" }}>{acc}</h4>
                            <p style={{ fontSize: "13px", margin: "2px 0", color: isDarkMode ? "#aaa" : "#555" }}>
                                {tier.toUpperCase()} {elo.division || ""} - {elo.lp || 0} LP
                            </p>
                            <p style={{ fontSize: "13px", color: wrColor }}>
                                {winrate}% WR ({elo.wins || 0}W / {elo.losses || 0}L)
                            </p>
                            <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                                {championsToShow.map((champId) => (
                                    <img
                                        key={champId}
                                        src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champId}.png`}
                                        alt={champId}
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            border: "1px solid #ccc",
                                            backgroundColor: "#222",
                                            objectFit: "cover",
                                        }}
                                        title={champId}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>


            {showConfirmRemove && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000,
                    backdropFilter: "blur(2px)",
                }}>
                    <div style={{
                        backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
                        color: isDarkMode ? "#fff" : "#000",
                        padding: "24px",
                        borderRadius: "12px",
                        width: "100%",
                        maxWidth: "360px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        textAlign: "center",
                        position: "relative",
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>
                            Remover conta
                        </h3>

                        <p style={{ fontSize: "15px", marginBottom: "24px" }}>
                            Tem certeza que deseja remover <br />
                            <strong style={{ color: "#e53935" }}>{selectedAccount}</strong>?
                        </p>

                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                            <button
                                onClick={async () => {
                                    await removeAccount(selectedAccount);
                                    setShowConfirmRemove(false);
                                    setRemoveSuccess(true);
                                    setTimeout(() => setRemoveSuccess(false), 2000);
                                }}
                                style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    backgroundColor: "#e53935",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                }}
                            >
                                Remover
                            </button>

                            <button
                                onClick={() => setShowConfirmRemove(false)}
                                style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    backgroundColor: isDarkMode ? "#555" : "#ccc",
                                    color: isDarkMode ? "#fff" : "#000",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;	
