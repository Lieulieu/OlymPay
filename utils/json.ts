export async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: text?.slice(0, 200) || "Invalid server response",
    };
  }
}
