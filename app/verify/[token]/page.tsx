type VerifyPageProps = {
  params: { token: string };
};

export default function VerifyPage({ params }: VerifyPageProps) {
  const token = params.token;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold mb-3">
          PassGuard KYC — verification
        </h1>
        <p className="text-sm text-white/60 mb-4">
          Verification session token:
        </p>
        <div className="font-mono text-xs bg-white/5 rounded-lg px-3 py-2 mb-6 break-all">
          {token}
        </div>
        <p className="text-xs text-white/40">
          This verification page is in development mode.
        </p>
      </div>
    </div>
  );
}
