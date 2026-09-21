import { useState } from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('admin@pochta.ru');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="w-screen min-h-screen bg-[#141414] overflow-y-auto relative">
      {/* Background decorative element */}
      <div className="absolute top-0 right-0 w-[773px] h-[431px] opacity-20 pointer-events-none hidden lg:block" style={{ transform: 'rotate(14deg)', transformOrigin: 'top left' }}>
        <div className="w-full h-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-3xl" />
      </div>

      {/* Title */}
      <div className="pt-20 pb-6 lg:pb-8 px-8 lg:px-16 text-white text-4xl lg:text-6xl font-light" style={{ fontFamily: 'Playfair Display, serif' }}>
        Почта.Пространство
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[711px] mx-8 lg:mx-16 bg-white rounded-2xl p-6 lg:p-10 shadow-2xl mb-12">
        <h1 className="text-[#0052CC] text-3xl lg:text-4xl font-semibold mb-6 lg:mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          Вход
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
          {/* Email field */}
          <div className="relative">
            <div className="w-full h-10 rounded-md border-2 border-[#0052CC] flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-full px-3 text-sm text-[#0052CC] placeholder-[#0052CC] focus:outline-none bg-transparent"
                placeholder="Логин"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="relative">
            <div className="w-full h-10 rounded-md border-2 border-[#0052CC] flex items-center">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-full px-3 text-sm text-[#0052CC] placeholder-[#0052CC] focus:outline-none bg-transparent"
                placeholder="Пароль"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* Links */}
          <div className="space-y-1 pt-1">
            <div className="text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="text-[#0052CC]/80">Нет аккаунта? </span>
              <span className="text-[#0052CC]/80 font-semibold cursor-pointer hover:underline">Зарегистрироваться</span>
            </div>
            <div className="text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="text-[#0052CC]/80">Забыли пароль? </span>
              <span className="text-[#0052CC]/80 font-semibold cursor-pointer hover:underline">Восстановить</span>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-[112px] h-[41px] rounded-md text-white text-base font-normal flex items-center justify-center gap-2.5 transition-all hover:opacity-90"
            style={{
              background: 'radial-gradient(ellipse 82.43% 77.80% at 50.00% 50.00%, #0052CC 25%, white 100%)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
