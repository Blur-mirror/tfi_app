import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TFI_BASE_URL = process.env.TFI_BASE_URL!;
const TFI_API_KEY = process.env.TFI_API_KEY!;

/**
 * Fetches real-time Dublin Bus data from TFI API
 */
export async function getBusData(stopId: string) {
  try {
    const response = await axios.get(`${TFI_BASE_URL}gtfsr`, {
      headers: { "x-api-key": TFI_API_KEY },
      params: {
        format: "json",
        stopId: stopId, // if TFI API supports filtering by stop
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching TFI data:", error);
    throw new Error("Failed to fetch data from TFI");
  }
}
