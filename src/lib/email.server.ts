// Warstwa powiadomień e-mail. Działa automatycznie po podłączeniu domeny e-mail
// (klucz RESEND_API_KEY). Bez klucza wiadomości są tylko logowane — aplikacja
// nigdy nie przerywa zamówienia z powodu e-maila.

type Mail = { to: string; subject: string; html: string };

const brand = "Wirtualny Antykwariat";

function shell(title: string, body: string) {
  return `<div style="font-family:Georgia,serif;background:#f6f1e7;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #e0d5c1;border-radius:8px;padding:28px">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8a7a60">${brand}</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#3a2f22">${title}</h1>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#8a7a60">Wiadomość wysłana automatycznie przez ${brand}.</p>
  </div>
</div>`;
}

function lines(items: { name: string; price: number }[]) {
  return `<ul style="padding-left:18px;color:#4a3f30;font-size:14px">${items
    .map((i) => `<li>${i.name} — ${i.price.toLocaleString("pl-PL")} zł</li>`)
    .join("")}</ul>`;
}

async function send(mail: Mail) {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"] ?? `${brand} <onboarding@resend.dev>`;
  if (!apiKey) {
    console.info(`[email:skipped] ${mail.to} — ${mail.subject} (brak konfiguracji domeny e-mail)`);
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html }),
    });
    if (!response.ok) console.error(`[email:error] ${response.status} ${await response.text()}`);
  } catch (error) {
    console.error("[email:error]", (error as Error).message);
  }
}

export async function sendAll(mails: (Mail | null)[]) {
  await Promise.all(mails.filter((m): m is Mail => m !== null).map(send));
}

export function sellerEmail() {
  return process.env["SELLER_EMAIL"] ?? null;
}

type OrderInfo = {
  orderId: string;
  total: number;
  buyerName: string;
  address: string;
  items: { name: string; price: number }[];
};

export function orderCreatedMails(buyer: string | null, order: OrderInfo): (Mail | null)[] {
  const summary = `${lines(order.items)}<p style="font-size:15px;color:#3a2f22"><strong>Razem: ${order.total.toLocaleString("pl-PL")} zł</strong></p>`;
  const seller = sellerEmail();
  return [
    buyer
      ? {
          to: buyer,
          subject: `Zamówienie przyjęte — przedmioty zarezerwowane (#${order.orderId.slice(0, 8)})`,
          html: shell(
            "Dziękujemy za zamówienie!",
            `<p style="font-size:14px;color:#4a3f30">Twoje przedmioty zostały <strong>zarezerwowane</strong> i czekają na płatność.</p>${summary}
             <p style="font-size:14px;color:#4a3f30">Adres wysyłki: ${order.address}</p>`,
          ),
        }
      : null,
    seller
      ? {
          to: seller,
          subject: `Nowe zamówienie od ${order.buyerName} (#${order.orderId.slice(0, 8)})`,
          html: shell(
            "Nowe zamówienie w antykwariacie",
            `<p style="font-size:14px;color:#4a3f30">Kupujący: ${order.buyerName}<br/>Adres: ${order.address}</p>${summary}`,
          ),
        }
      : null,
  ];
}

export function orderPaidMails(buyer: string | null, order: { orderId: string; total: number }) {
  const seller = sellerEmail();
  const body = `<p style="font-size:14px;color:#4a3f30">Płatność ${order.total.toLocaleString("pl-PL")} zł została zaksięgowana. Przedmioty oznaczono jako <strong>sprzedane</strong>.</p>`;
  return [
    buyer
      ? {
          to: buyer,
          subject: `Płatność potwierdzona (#${order.orderId.slice(0, 8)})`,
          html: shell("Płatność potwierdzona", body),
        }
      : null,
    seller
      ? {
          to: seller,
          subject: `Zamówienie opłacone (#${order.orderId.slice(0, 8)})`,
          html: shell("Zamówienie opłacone", body),
        }
      : null,
  ];
}

const statusText: Record<string, string> = {
  pending: "oczekuje na płatność",
  paid: "opłacone",
  cancelled: "anulowane",
};

export function orderStatusMails(buyer: string | null, orderId: string, status: string) {
  const seller = sellerEmail();
  const label = statusText[status] ?? status;
  const body = `<p style="font-size:14px;color:#4a3f30">Status zamówienia <strong>#${orderId.slice(0, 8)}</strong> został zmieniony na: <strong>${label}</strong>.</p>`;
  return [
    buyer ? { to: buyer, subject: `Zmiana statusu zamówienia: ${label}`, html: shell("Zmiana statusu zamówienia", body) } : null,
    seller
      ? { to: seller, subject: `Status zamówienia #${orderId.slice(0, 8)}: ${label}`, html: shell("Zmiana statusu zamówienia", body) }
      : null,
  ];
}
