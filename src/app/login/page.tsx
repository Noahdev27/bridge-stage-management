// src/app/admin/login/page.tsx
import { signIn } from "@/shared/auth/auth"; // Ton fichier d'auth existant

export default function AdminLoginPage() {
  
  // Cette fonction sera exécutée côté serveur quand le bouton est cliqué
  async function handleLogin(formData: FormData) {
    "use server";
    
    // On appelle signIn avec les identifiants récupérés
    // 'credentials' est le nom du provider configuré dans ton auth.ts
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin", // Redirection automatique après succès
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <h1 className="mb-6 text-center text-xl font-semibold text-gray-800">
          Accès Admin
        </h1>
        
        <form action={handleLogin} className="flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          
          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            required
            className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          
          <button 
            type="submit" 
            className="w-full rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 transition"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}