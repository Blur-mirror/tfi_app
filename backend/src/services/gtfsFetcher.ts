// backend/src/services/gtfsFetcher.ts
import axios from "axios";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";
import unzipper from "unzipper";

const streamPipeline = promisify(pipeline);

/**
 * Service to download and extract GTFS static data
 * GTFS contains: stops.txt, routes.txt, trips.txt, stop_times.txt, etc.
 */
class GTFSFetcher {
  private readonly GTFS_URL = "https://www.transportforireland.ie/transitData/google_transit_combined.zip";
  private readonly DATA_DIR = path.join(__dirname, "../../data/gtfs");

  async downloadAndExtract(): Promise<void> {
    try {
      console.log("📦 Downloading GTFS static data...");
      
      // Ensure data directory exists
      if (!fs.existsSync(this.DATA_DIR)) {
        fs.mkdirSync(this.DATA_DIR, { recursive: true });
      }

      // Download GTFS zip file
      const response = await axios({
        method: "GET",
        url: this.GTFS_URL,
        responseType: "stream",
        headers: {
          "x-api-key": process.env.TFI_API_KEY,
        },
      });

      const zipPath = path.join(this.DATA_DIR, "gtfs.zip");
      
      // Save zip file
      await streamPipeline(
        response.data,
        fs.createWriteStream(zipPath)
      );

      console.log("✅ Downloaded GTFS zip");
      console.log("📂 Extracting files...");

      // Extract zip
      await fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: this.DATA_DIR }))
        .promise();

      console.log("✅ GTFS data extracted to:", this.DATA_DIR);

      // Clean up zip file
      fs.unlinkSync(zipPath);

      // List extracted files
      const files = fs.readdirSync(this.DATA_DIR);
      console.log("📄 Available files:", files);

    } catch (error: any) {
      console.error("❌ Failed to download GTFS data:", error.message);
      throw error;
    }
  }

  /**
   * Check if GTFS data exists and is recent (< 24 hours old)
   */
  isDataFresh(): boolean {
    const stopsFile = path.join(this.DATA_DIR, "stops.txt");
    
    if (!fs.existsSync(stopsFile)) {
      return false;
    }

    const stats = fs.statSync(stopsFile);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    
    return ageHours < 24;
  }

  /**
   * Get path to GTFS data directory
   */
  getDataPath(): string {
    return this.DATA_DIR;
  }
}

export const gtfsFetcher = new GTFSFetcher();