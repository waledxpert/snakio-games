import { useLocation, useNavigate } from "react-router-dom";
import WalletGate from "../components/WalletGate";
import { useWallet } from "../lib/walletContext";

export default function ConnectWalletPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { acceptConnectedAddress } = useWallet();
  const from = location.state?.from || "/create-match";

  return (
    <WalletGate
      onConnected={(address) => {
        acceptConnectedAddress(address);
        navigate(from, { replace: true });
      }}
      onCancel={() => navigate(from, { replace: true })}
    />
  );
}
