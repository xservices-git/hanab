import Image from 'next/image';

export default function CustomerFooter() {
  return (
    <footer className="mt-8 h-[92px] pt-5 text-center">
      <Image src="https://i.imgur.com/KTvuiwM.png" alt="Bộ Công Thương" width={100} height={32} sizes="100px" className="mx-auto h-8 w-[100px] object-contain" />
      <div className="mx-auto mt-1 w-[275px] text-[14px] leading-5 text-[#555]">
        Bản quyền thuộc về<br />Ngân hàng Thương mại Cổ phần KEB Hana Bank
      </div>
    </footer>
  );
}
