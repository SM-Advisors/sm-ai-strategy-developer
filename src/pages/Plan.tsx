import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Plan = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="font-serif text-3xl">Your Strategic Plan</h1>
        <p className="text-muted-foreground">
          Your plan will appear here once AI analysis is complete.
        </p>
        <Button variant="outline-light" onClick={() => navigate("/intake")} className="gap-2 mt-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Assessment
        </Button>
      </div>
    </div>
  );
};

export default Plan;
