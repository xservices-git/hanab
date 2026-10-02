import { useState } from 'react';
import { useRouter } from 'next/router';
import { Camera } from 'lucide-react';
import { Header } from './verify';
import MobileBottomNav from '../components/MobileBottomNav';

export default function KycPage() {
  const router = useRouter();
  const [files, setFiles] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const required = ['front', 'back', 'face'];
  const next = () => {
    setSubmitted(true);
    if (required.every((key) => files[key])) {
      window.localStorage.setItem('loanKyc', JSON.stringify(files));
      router.push('/bank-info');
    }
  };

  return (
    <main className="min-h-screen bg-[#142014] text-[#333]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white">
        <Header title="Xác minh" />
        <h1 className="mt-[13px] text-center text-[18px] font-bold">Chụp ảnh định danh KYC</h1>
        <div className="mx-[25px] mt-[13px] space-y-[20px]">
          <UploadBox id="front" label="Mặt trước Hộ chiếu / CCCD" image={files.front} error={submitted && !files.front} onPick={(img) => setFiles((old) => ({ ...old, front: img }))} />
          <UploadBox id="back" label="Mặt sau Hộ chiếu / CCCD" image={files.back} error={submitted && !files.back} onPick={(img) => setFiles((old) => ({ ...old, back: img }))} />
          <UploadBox id="face" label="Ảnh chân dung" image={files.face} error={submitted && !files.face} onPick={(img) => setFiles((old) => ({ ...old, face: img }))} />
        </div>
        <div className="mt-[13px] flex justify-center">
          <button onClick={next} className="flex h-[52px] w-[100px] items-center justify-center rounded-full bg-[#2AAD69] text-[20px] font-bold text-white">Tiếp tục</button>
        </div>
        <MobileBottomNav active="plus" />
      </div>
    </main>
  );
}

function UploadBox({ id, label, image, error, onPick }: { id: string; label: string; image?: string; error?: boolean; onPick: (img: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className={`flex h-[164px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[5px] bg-[#eeeeee] text-[#333] ${error ? 'border-2 border-[#c92232]' : ''}`}>
        {image ? <img src={image} alt={label} className="h-full w-full object-cover" /> : <><Camera className="h-7 w-7" /><span className="mt-2 text-[16px] font-bold">{label}</span></>}
      </label>
      <input id={id} className="hidden" type="file" accept="image/*" capture="environment" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; onPick(await imageFileToDataUrl(file)); }} />
      {error && <p className="mt-1 text-[13px] text-[#c92232]">Vui lòng tải ảnh</p>}
    </div>
  );
}



async function imageFileToDataUrl(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kh?ng th? x? l? ?nh');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}
