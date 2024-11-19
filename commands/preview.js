import { preview } from "vite";

export async function previewer() {
  try {
    const server = await preview({
      preview: {
        port: 8080,
        open: true,
      },
    });

    server.printUrls();
  } catch (error) {
    console.error("Error starting Vite server:", error);
  }
}
