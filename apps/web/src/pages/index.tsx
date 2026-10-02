import type { GetServerSideProps } from 'next';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
      ?ang m? trang ??ng k?...
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/signup',
    permanent: false,
  },
});
