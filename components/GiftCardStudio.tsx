"use client";

import { useEffect, useState } from "react";
import { Gift, Sparkles, Send, Download, Check, MessageCircle, Loader2 } from "lucide-react";

export default function GiftCardStudio() {
  const [amount, setAmount] = useState<number>(3500);
  const [recipientName, setRecipientName] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [message, setMessage] = useState<string>("Wishing you pure relaxation and tranquility!");
  const [occasion, setOccasion] = useState<string>("Birthday");
  const [isGenerated, setIsGenerated] = useState<boolean>(false);

  // Drawn once on the client. Computed during render it produced a different
  // number on the server than in the browser (hydration mismatch), and it also
  // re-rolled the guest's voucher code on every keystroke.
  const [voucherCode, setVoucherCode] = useState<string>("GIFT-ALX-••••");

  useEffect(() => {
    setVoucherCode("GIFT-ALX-" + Math.floor(1000 + Math.random() * 9000));
  }, []);

  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [writeError, setWriteError] = useState<string>("");

  /** Drafts the note so nobody abandons the form staring at an empty box. */
  const writeMessage = async () => {
    setIsWriting(true);
    setWriteError("");
    try {
      const response = await fetch("/api/ai/gift-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion,
          recipient: recipientName,
          sender: senderName,
          amount,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setWriteError(data?.error ?? "Couldn't write that just now.");
        return;
      }
      setMessage(data.message);
    } catch {
      setWriteError("Couldn't reach the writer. Check your connection.");
    } finally {
      setIsWriting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🎁 *ALEXA SPA LUXURY GIFT VOUCHER*\n\n` +
      `Dearest ${recipientName || "Friend"},\n` +
      `"${message}"\n\n` +
      `*Voucher Value:* ₹${amount.toLocaleString("en-IN")}\n` +
      `*Voucher Code:* ${voucherCode}\n` +
      `*Redeem At:* Alexa Spa, 2nd Floor, Grand Plaza\n` +
      `*Validity:* 6 Months from today\n\n` +
      `With warm love,\n${senderName || "Your Well-Wisher"}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="relative w-full max-w-[1600px] mx-auto py-4 text-[#f7f4ee] select-none my-10">
      {/* Header */}
      <div className="pool pool-center text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/30 text-[11px] font-mono tracking-widest uppercase text-[#c5a880]">
          <Gift className="w-3.5 h-3.5" />
          <span>BESPOKE DIGITAL GIFTING</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#f7f4ee] uppercase tracking-wide text-shade-strong">
          GIFT THE PRIVILEGE OF <span className="italic text-[#c5a880]">DEEP RELAXATION</span>
        </h2>
        <p className="text-base text-[#f0e9df]/85 max-w-xl mx-auto font-sans leading-relaxed">
          Create a personalized digital spa gift voucher in seconds. Delivered instantly to your loved one via WhatsApp with a luxury gold seal card.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Voucher Form */}
        <div className="pool lg:col-span-6 space-y-7">
          {/* Amount Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-[0.22em] text-[#c5a880] uppercase">
              1. SELECT VOUCHER VALUE
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2000, 3500, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-3 text-sm font-mono font-bold border-b transition-all cursor-pointer ${
                    amount === val
                      ? "border-[#c5a880] text-[#c5a880]"
                      : "border-white/[0.09] text-[#e8ded2]/60 hover:text-[#f7f4ee]"
                  }`}
                >
                  ₹{val.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-[0.22em] text-[#c5a880] uppercase">
              2. OCCASION
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Birthday", "Anniversary", "Just to Pamper"].map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setOccasion(occ)}
                  className={`py-3 text-sm font-sans border-b transition-all cursor-pointer ${
                    occasion === occ
                      ? "border-[#c5a880] text-[#f7f4ee]"
                      : "border-white/[0.09] text-[#e8ded2]/60 hover:text-[#f7f4ee]"
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-[0.22em] text-[#c5a880] uppercase">RECIPIENT NAME</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-transparent border-b border-white/[0.14] px-0 py-2.5 text-sm text-[#f7f4ee] placeholder:text-[#e8ded2]/30 focus:outline-none focus:border-[#c5a880] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-[0.22em] text-[#c5a880] uppercase">YOUR NAME</label>
              <input
                type="text"
                placeholder="e.g. Ananya"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full bg-transparent border-b border-white/[0.14] px-0 py-2.5 text-sm text-[#f7f4ee] placeholder:text-[#e8ded2]/30 focus:outline-none focus:border-[#c5a880] transition-colors"
              />
            </div>
          </div>

          {/* Message — the field people stall on, so there's a way out of it */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <label className="text-[11px] font-mono tracking-[0.22em] text-[#c5a880] uppercase">
                PERSONAL MESSAGE
              </label>
              <button
                type="button"
                onClick={writeMessage}
                disabled={isWriting}
                className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-[#e8ded2]/60 transition-colors hover:text-[#c5a880] disabled:cursor-wait disabled:opacity-60 cursor-pointer"
              >
                {isWriting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isWriting ? "Writing" : "Write it for me"}
              </button>
            </div>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-transparent border-b border-white/[0.14] px-0 py-2.5 text-sm text-[#f7f4ee] placeholder:text-[#e8ded2]/30 focus:outline-none focus:border-[#c5a880] transition-colors"
            />
            {writeError && (
              <span className="block text-[11px] text-[#e0785e]">{writeError}</span>
            )}
          </div>
        </div>

        {/* Right: Live Digital Gift Card Card Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative p-7 rounded-3xl bg-gradient-to-br from-[#1c2630] via-[#0f1419] to-[#07090b] border-2 border-[#c5a880]/50 shadow-2xl space-y-6 text-[#f7f4ee] overflow-hidden">
            {/* Card Gold Accent Line */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a880]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-[#c5a880] block">
                  SANCTUARY GIFT CERTIFICATE
                </span>
                <h3 className="text-xl font-serif tracking-widest text-[#f7f4ee]">
                  ALEXA SPA
                </h3>
              </div>

              <div className="text-right">
                <span className="text-2xl font-mono text-[#c5a880] font-bold">
                  ₹{amount.toLocaleString("en-IN")}
                </span>
                <span className="text-[8px] font-mono text-[#e8ded2]/50 block">
                  VALID 6 MONTHS
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-[#c5a880] uppercase">
                EXCLUSIVELY CRAFTED FOR:
              </span>
              <h4 className="text-2xl font-serif text-[#f7f4ee] italic">
                {recipientName || "Honored Guest"}
              </h4>
              <p className="text-xs text-[#e8ded2]/80 font-sans italic line-clamp-2">
                "{message}"
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-mono text-[#e8ded2]/60">
              <span>FROM: {senderName || "A Friend"}</span>
              <span className="text-[#c5a880]">{voucherCode}</span>
            </div>
          </div>

          {/* Share Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-3 rounded-full bg-[#25D366] text-[#07090b] font-sans font-bold text-xs tracking-wider uppercase hover:scale-105 transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>SEND VOUCHER ON WHATSAPP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
