
interface Raid {
  name: string;
  completions: number;
  flawless: number;
  time: string;
}

interface PlayerStats {
  platformIcon: string;
  playerName: string;
  totalRaids: number;
  totalFlawless: number;
  totalTime: string;
  raids: Raid[];
}

// Mock service to simulate fetching player stats
export const getPlayerStats = (playerName: string): Promise<PlayerStats> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        platformIcon: "💻",
        playerName: playerName || "Guardian12345",
        totalRaids: 342,
        totalFlawless: 28,
        totalTime: "487h 23m",
        raids: [
          {
            name: "Last Wish",
            completions: 62,
            flawless: 3,
            time: "41m 12s"
          },
          {
            name: "Garden of Salvation",
            completions: 47,
            flawless: 2,
            time: "45m 32s"
          },
          {
            name: "Deep Stone Crypt",
            completions: 85,
            flawless: 7,
            time: "32m 18s"
          },
          {
            name: "Vault of Glass",
            completions: 73,
            flawless: 5,
            time: "38m 44s"
          },
          {
            name: "Vow of the Disciple",
            completions: 41,
            flawless: 6,
            time: "42m 56s"
          },
          {
            name: "King's Fall",
            completions: 34,
            flawless: 5,
            time: "51m 22s"
          }
        ]
      });
    }, 500);
  });
};