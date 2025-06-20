import axios from "axios";

export function handleAxiosError(err: unknown): void {
  if (axios.isAxiosError(err)) {
    console.log("❌ Error:", err.response?.data?.message || err.message);
  } else {
    console.log("❌ Unknown error:", err);
  }
}
