import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWebSocketContext } from "../context/WebSocketContext";

type ArmorPiece = {
  instance_id: string;
  item_hash: number;
  name: string;
  archetype: string;
  tertiary: string;
  ghost_mod?: string;
};

export default function LootTracker() {
  const { auth } = useAuth();
  const [newArmor, setNewArmor] = useState<ArmorPiece[]>([]);

  // Use shared WebSocket context
  const { status: wsStatus, lastMessage } = useWebSocketContext();

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === "newLoot") {
      const newLoot = lastMessage.data;
      if (newLoot?.length > 0) {
        setNewArmor((prev) => [...newLoot, ...prev]); // prepend new
      }
    }
  }, [lastMessage]);

  // Clear armor when not authenticated
  useEffect(() => {
    if (auth.status !== "authenticated") {
      setNewArmor([]);
    }
  }, [auth.status]);

  if (auth.status !== "authenticated") {
    return <div>Not authenticated.</div>; // or show "Login to track loot"
  }

  return (
    <div className="loot-tracker">
      <h2>
        Recent Armor Drops{" "}
        {wsStatus === "connected" && <span>(Live)</span>}
      </h2>
      {newArmor.length === 0 ? (
        <p>No drops detected yet. Go farm some tier 5 legendary armor!</p>
      ) : (
        <div className="armor-list">
          {newArmor.map((armor) => (
            <div key={armor.instance_id} className="armor-card">
              <a
                href={`https://www.light.gg/db/items/${armor.item_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="armor-name"
              >
                {armor.name}
              </a>
              <div className="armor-details">
                <span className="armor-archetype">
                  <strong>Archetype:</strong> {armor.archetype}
                </span>
                <span className="armor-tertiary">
                  <strong>Tertiary:</strong> {armor.tertiary}
                </span>
                {armor.ghost_mod && (
                  <span className="armor-ghost-mod">
                    <strong>Ghost Mod:</strong> {armor.ghost_mod}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
