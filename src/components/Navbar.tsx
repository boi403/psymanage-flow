import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border h-[70px] flex items-center justify-between px-[5%]">
      <a href="#" className="flex items-center gap-2.5 no-underline">
        <div className="w-[38px] h-[38px] rounded-[10px] gradient-primary flex items-center justify-center text-primary-foreground font-extrabold text-base tracking-tighter">
          PM
        </div>
        <span className="text-lg font-bold text-foreground">
          Psico<span className="text-primary">Manager</span>
        </span>
      </a>

      <div className="hidden md:flex items-center gap-1.5">
        {["Funcionalidades", "Para quem", "Planos", "FAQ", "Blog"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
            className="text-muted-foreground text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-primary-light hover:text-primary-dark transition-all no-underline"
          >
            {item}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <Link to={user ? "/dashboard" : "/auth"} className="hidden md:inline-flex items-center px-5 py-2 border-[1.5px] border-primary text-primary bg-transparent rounded-lg font-semibold text-sm hover:bg-primary-light transition-all no-underline">
          {user ? "Painel" : "Entrar"}
        </Link>
        <Link to="/auth" className="inline-flex items-center gap-1.5 px-5 py-2 gradient-primary text-primary-foreground rounded-lg font-bold text-sm hover:-translate-y-0.5 hover:shadow-brand-lg transition-all no-underline">
          Começar grátis →
        </Link>
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-[70px] left-0 right-0 bg-background border-b border-border p-4 flex flex-col gap-2 md:hidden">
          {["Funcionalidades", "Para quem", "Planos", "FAQ", "Blog"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
              className="text-muted-foreground text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-primary-light transition-all no-underline"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
