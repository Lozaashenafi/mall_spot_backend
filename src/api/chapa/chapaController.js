const CHAPA_SECRET_KEY =
  process.env.CHAPA_SECRET_KEY || "CHAPA-TEST-SECRET-KEY";
import axios from "axios";

export const initiateChapaPayment = async (req, res) => {
  const {
    amount,
    currency,
    email,
    first_name,
    tx_ref,
    return_url,
    callback_url,
    customizations,
  } = req.body;

  try {
    const chapaRes = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount,
        currency: currency || "ETB",
        email,
        first_name,
        tx_ref,
        return_url,
        callback_url,
        customizations,
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(chapaRes.data);
  } catch (err) {
    console.error("Chapa Init Error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "Chapa payment initialization failed.",
      error: err.message,
    });
  }
};
