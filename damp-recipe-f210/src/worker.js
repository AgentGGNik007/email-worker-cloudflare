export default {
  async email(message, env, ctx) {
    const { EmailMessage } = await import("cloudflare:email");
    
    try {
      const rawEmail = await streamToString(message.raw);

      const [headerSection, ...bodyParts] = rawEmail.split("\r\n\r\n");
      const body = bodyParts.join("\r\n\r\n");

      const allowedHeaders = ["content-type", "mime-version", "subject", "date"];
      const filteredHeaders = headerSection
        .split("\r\n")
        .filter(line => {
          if (line.startsWith(" ") || line.startsWith("\t")) return true;
          const key = line.split(":")[0].toLowerCase();
          return allowedHeaders.includes(key);
        })
        .join("\r\n");

      const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2,9)}@framenode.net>`;

      const newRaw = [
        `From: Datenschutz <datenschutz@framenode.net>`,
        `To: datenschutz-cozycrit@googlegroups.com`,
        `Reply-To: ${message.from}`,
        `Message-ID: ${messageId}`,
        filteredHeaders,
        ``,
        body
      ].join("\r\n");

      const newMessage = new EmailMessage(
        "datenschutz@framenode.net",
        "datenschutz-cozycrit@googlegroups.com",
        newRaw
      );
      
      await env.SEND_EMAIL.send(newMessage);
      
    } catch (e) {
      console.error("Fehler:", e.message);
    }
  }
};

async function streamToString(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(new TextDecoder().decode(value));
  }
  return chunks.join("");
}