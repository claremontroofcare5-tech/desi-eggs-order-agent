
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};

  // Customer questions
  if (body.type === "question") {
    const { question, name = "", phone = "" } = body;

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Invalid question" });
    }

    try {
      const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveQuestion",
          question: question.trim(),
          name,
          phone
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error("Question save failed");
      }

      return res.status(200).json({ success: true });

    } catch (error) {
      return res.status(500).json({ error: "Question saving failed" });
    }
  }

  // Existing order system
  const { name, phone, quantity, address, payment } = body;

  if (!name || !phone || !address || !payment ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 2) {
    return res.status(400).json({ error: "Invalid order details" });
  }

  try {
    const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, phone, quantity, address, payment })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error("Order save failed");
    }

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: "Order saving failed" });
  }
}