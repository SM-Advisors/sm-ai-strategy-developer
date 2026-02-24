import { useNavigate } from "react-router-dom";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";

const AdminBar = () => {
  const navigate = useNavigate();
  const { isAdmin, adminUser, signInWithGoogle, signOut } = useAuthStore();

  if (isAdmin && adminUser) {
    const initials = adminUser.email
      ? adminUser.email.slice(0, 2).toUpperCase()
      : "AD";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-xs border-primary/30 hover:border-primary/60"
          >
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {initials}
            </span>
            <span className="hidden sm:inline text-foreground/70">Admin</span>
            <ChevronDown className="w-3 h-3 text-foreground/50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => navigate("/admin")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin Panel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={signInWithGoogle}
      className="text-xs text-navy hover:text-navy/80 bg-background hover:bg-background border-navy/40 hover:border-navy/60 px-3 font-semibold"
    >
      Admin
    </Button>
  );
};

export default AdminBar;
