// App.tsx
import React, { useEffect, useState } from "react";
import { getContractReadOnly, normAddr, ABI, config } from "./contract";
import { FaStar, FaChartBar, FaUsers, FaQuestionCircle } from "react-icons/fa";
import WalletManager from "./components/WalletManager";
import WalletSelector from "./components/WalletSelector";
import { ethers } from "ethers";

export default function App() {
  const [account, setAccount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  interface Question {
    id: number;
    text: string;
    totalResponses: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  }

  useEffect(() => {
    loadQuestions().finally(() => setLoading(false));
  }, []);

  const checkAdmin = async (addr: string) => {
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      const adminAddr: string = await contract.admin();
      setIsAdmin(normAddr(addr) === normAddr(adminAddr));
    } catch (e) {
      setIsAdmin(false);
      console.error("Failed to check admin", e);
    }
  };

  const onWalletSelect = async (wallet: any) => {
    if (!wallet.provider) return;
    try {
      const web3Provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const acc = accounts[0] || "";
      setAccount(acc);
      await checkAdmin(acc);

      wallet.provider.on("accountsChanged", async (accounts: string[]) => {
        const newAcc = accounts[0] || "";
        setAccount(newAcc);
        await checkAdmin(newAcc);
      });
    } catch (e) {
      console.error("Failed to connect wallet", e);
      alert("Failed to connect wallet: " + e);
    }
  };

  const onConnect = () => setWalletSelectorOpen(true);
  const onDisconnect = () => {
    setAccount("");
    setIsAdmin(false);
    setProvider(null);
  };

  // ----------------- Load Questions -----------------
  const loadQuestions = async () => {
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      const count = Number(await contract.getQuestionCount());
      const list: Question[] = [];
      for (let i = 0; i < count; i++) {
        const qRaw = await contract.getQuestionStats(i);
        list.push({
          id: i,
          text: qRaw[0],
          totalResponses: Number(qRaw[1]),
          averageScore: Number(qRaw[2]),
          highestScore: Number(qRaw[3]),
          lowestScore: Number(qRaw[4]),
        });
      }
      setQuestions(list);
    } catch (e) {
      console.error("Failed to load questions", e);
    }
  };

  const createQuestion = async (text: string) => {
    if (!text) { alert("Please enter question text"); return; }
    if (!provider) { alert("Please connect wallet first"); return; }
    setCreating(true);
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(config.contractAddress, ABI, signer);
      const tx = await contract.createQuestion(text);
      await tx.wait();
      setShowCreateModal(false);
      await loadQuestions();
      alert("Question created!");
    } catch (e: any) {
      alert("Creation failed: " + (e?.message || e));
    } finally {
      setCreating(false);
    }
  };

  const submitScore = async (qId: number) => {
    if (!provider) { alert("Please connect wallet first"); return; }
    const scoreStr = prompt("Enter score 1-5");
    if (!scoreStr) return;
    const score = Number(scoreStr);
    if (isNaN(score) || score < 1 || score > 5) { alert("Invalid score"); return; }
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(config.contractAddress, ABI, signer);
      const tx = await contract.submitResponse(qId, score);
      await tx.wait();
      await loadQuestions();
      alert("Score submitted!");
    } catch (e: any) {
      console.error("Submit failed", e);
      alert("Submit failed: " + (e?.message || e));
    }
  };

  if (loading) return (
    <div style={{
      background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "white",
      fontSize: "24px"
    }}>
      Loading...
    </div>
  );

  // ----------------- Aggregate Stats -----------------
  const totalResponses = questions.reduce((sum, q) => sum + q.totalResponses, 0);
  const overallAvg = questions.length > 0 ? questions.reduce((sum, q) => sum + q.averageScore, 0) / questions.length : 0;

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
      minHeight: "100vh", 
      padding: 24, 
      background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
      color: "#fff"
    }}>
      {/* Navbar */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        marginBottom: 32, 
        alignItems: "center",
        backdropFilter: "blur(10px)",
        background: "rgba(255, 255, 255, 0.1)",
        padding: "16px 24px",
        borderRadius: 16,
        border: "1px solid rgba(255, 255, 255, 0.2)"
      }}>
        <h1 style={{ fontSize: 32, fontWeight: "700", margin: 0, background: "linear-gradient(45deg, #a7d2ff, #fff)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
          Satisfaction Survey
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isAdmin && (
            <button 
              onClick={() => setShowCreateModal(true)} 
              style={{
                padding: "10px 16px",
                background: "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              ➕ Create Question
            </button>
          )}
          <WalletManager account={account} onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
      </header>

      {/* Project Intro */}
      <section style={{ 
        marginBottom: 32, 
        padding: 24, 
        borderRadius: 16, 
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
      }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 0 }}>
          <FaQuestionCircle /> Project Introduction
        </h2>
        <p>This survey platform allows users to rate various projects. Scores are stored on-chain, ensuring transparency and immutability.</p>

        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaChartBar /> Features
        </h3>
        <ul>
          <li>Connect multiple Ethereum wallets</li>
          <li>On-chain score recording</li>
          <li>Admin can create new survey questions</li>
          <li>Real-time statistics of responses</li>
        </ul>

        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaUsers /> Statistics
        </h3>
        <div style={{ 
          display: "flex", 
          gap: 24,
          flexWrap: "wrap"
        }}>
          <div style={{
            background: "linear-gradient(45deg, rgba(79, 172, 254, 0.2), rgba(0, 242, 254, 0.2))",
            padding: "16px",
            borderRadius: 12,
            minWidth: "120px",
            textAlign: "center",
            backdropFilter: "blur(5px)"
          }}>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Total Questions</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{questions.length}</div>
          </div>
          <div style={{
            background: "linear-gradient(45deg, rgba(79, 172, 254, 0.2), rgba(0, 242, 254, 0.2))",
            padding: "16px",
            borderRadius: 12,
            minWidth: "120px",
            textAlign: "center",
            backdropFilter: "blur(5px)"
          }}>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Total Responses</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{totalResponses}</div>
          </div>
          <div style={{
            background: "linear-gradient(45deg, rgba(79, 172, 254, 0.2), rgba(0, 242, 254, 0.2))",
            padding: "16px",
            borderRadius: 12,
            minWidth: "120px",
            textAlign: "center",
            backdropFilter: "blur(5px)"
          }}>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Average Score</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{overallAvg.toFixed(1)}</div>
          </div>
        </div>
      </section>

      {/* Questions List */}
      <main>
        {questions.map(q => {
          const roundedAvg = Math.round(q.averageScore);
          return (
            <div key={q.id} style={{ 
              padding: 24, 
              marginBottom: 16, 
              borderRadius: 16, 
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease"
            }} onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 36px rgba(0, 0, 0, 0.15)";
            }} onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.1)";
            }}>
              <h3 style={{ marginTop: 0 }}>{q.text}</h3>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                {[1,2,3,4,5].map(star => (
                  <span key={star}><FaStar size={20} color={star <= roundedAvg ? "#facc15" : "rgba(255, 255, 255, 0.3)"} /></span>
                ))}
                <span style={{ marginLeft: 12, fontSize: 16, fontWeight: "600" }}>
                  {q.averageScore.toFixed(1)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 14, opacity: 0.9, marginBottom: 16, flexWrap: "wrap" }}>
                <span>Participants: {q.totalResponses}</span>
                <span>Highest: {q.highestScore}</span>
                <span>Lowest: {q.lowestScore}</span>
              </div>
              {account && (
                <button 
                  onClick={() => submitScore(q.id)} 
                  style={{ 
                    padding: "10px 16px", 
                    borderRadius: 8, 
                    background: "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)", 
                    color: "#fff", 
                    border: "none", 
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "transform 0.2s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  Submit Score
                </button>
              )}
            </div>
          );
        })}
      </main>

      {/* Modals */}
      {showCreateModal && <ModalCreate onCreate={createQuestion} onClose={() => setShowCreateModal(false)} creating={creating} />}
      {walletSelectorOpen && (
        <WalletSelector
          isOpen={walletSelectorOpen}
          onWalletSelect={(wallet) => { onWalletSelect(wallet); setWalletSelectorOpen(false); }}
          onClose={() => setWalletSelectorOpen(false)}
        />
      )}
    </div>
  );
}

// ------------------- Create Modal -------------------
function ModalCreate({ onCreate, onClose, creating }: { onCreate: (text: string) => void; onClose: () => void; creating: boolean }) {
  const [text, setText] = useState("");
  return (
    <div style={{
      position: "fixed", 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      background: "rgba(0, 0, 0, 0.7)", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      zIndex: 1000,
      backdropFilter: "blur(5px)"
    }}>
      <div style={{ 
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", 
        borderRadius: 16, 
        padding: 32, 
        minWidth: 400,
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
      }}>
        <h2 style={{ marginTop: 0, color: "white" }}>Create Question</h2>
        <input 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Question text" 
          style={{ 
            width: "100%", 
            padding: 12, 
            marginTop: 12, 
            marginBottom: 20,
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "rgba(255, 255, 255, 0.1)",
            color: "white",
            fontSize: "16px"
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button 
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Cancel
          </button>
          <button 
            onClick={() => onCreate(text)} 
            disabled={creating}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              cursor: creating ? "not-allowed" : "pointer",
              opacity: creating ? 0.7 : 1,
              fontWeight: "600"
            }}
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}